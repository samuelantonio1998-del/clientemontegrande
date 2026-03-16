import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transaction_id, rating, comment } = await req.json();

    if (!transaction_id || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already reviewed
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("transaction_id", transaction_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Already reviewed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the transaction belongs to the user
    const { data: tx } = await supabase
      .from("transactions")
      .select("id, user_id")
      .eq("id", transaction_id)
      .eq("user_id", user.id)
      .single();

    if (!tx) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pointsAwarded = 1.5; // Base points for rating only

    // If comment provided, use AI to evaluate credibility
    if (comment && comment.trim().length > 0) {
      const trimmedComment = comment.trim().substring(0, 500);

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You evaluate restaurant review comments for credibility. A credible comment is one that provides specific, genuine feedback about the food, service, ambiance, or experience - not just generic praise like "good" or spam. Reply with ONLY "true" or "false".`,
              },
              {
                role: "user",
                content: `Is this restaurant review comment credible? "${trimmedComment}"`,
              },
            ],
            max_tokens: 5,
            temperature: 0,
          }),
        });

        const aiData = await aiResponse.json();
        const answer = aiData.choices?.[0]?.message?.content?.trim()?.toLowerCase();
        if (answer === "true") {
          pointsAwarded = 5;
        }
      } catch {
        // If AI fails, keep base points
      }
    }

    // Insert review
    const { error: insertError } = await supabase.from("reviews").insert({
      user_id: user.id,
      transaction_id,
      rating,
      comment: comment?.trim()?.substring(0, 500) || null,
      points_awarded: pointsAwarded,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Award points using service role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.rpc("sql", {
      query: `UPDATE public.profiles SET total_points = total_points + ${pointsAwarded} WHERE user_id = '${user.id}'`,
    }).catch(() => {
      // Fallback: direct update
    });

    // Direct update as fallback
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("total_points")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      await serviceClient
        .from("profiles")
        .update({ total_points: (Number(profile.total_points) || 0) + pointsAwarded })
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({ success: true, points_awarded: pointsAwarded }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
