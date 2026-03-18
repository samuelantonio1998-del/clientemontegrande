import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { screenshot_url, claim_id } = await req.json();
    if (!screenshot_url || !claim_id) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Gemini to analyze the screenshot
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                'You are an image verification assistant. You analyze Instagram screenshots to determine if the user is following a specific account. Look for the "A seguir" (Following) button or "Following" button in the screenshot. Respond ONLY with a JSON object: {"following": true} or {"following": false}. Nothing else.',
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: 'Analyze this Instagram screenshot. Is the user following the account "restaurante_monte_grande"? Look for the "A seguir" or "Following" button which indicates they are following. Reply only with JSON.',
                },
                {
                  type: "image_url",
                  image_url: { url: screenshot_url },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "verify_follow",
                description:
                  "Verify if the user is following the Instagram account based on the screenshot",
                parameters: {
                  type: "object",
                  properties: {
                    following: {
                      type: "boolean",
                      description:
                        'Whether the screenshot shows the user is following (has "A seguir" or "Following" button)',
                    },
                    confidence: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                      description: "Confidence level of the verification",
                    },
                  },
                  required: ["following", "confidence"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "verify_follow" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      // On AI failure, set to pending for manual review
      return new Response(
        JSON.stringify({ status: "pending", reason: "AI verification unavailable" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let following = false;

    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        following = args.following === true;
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    const newStatus = following ? "approved" : "rejected";
    const pointsToAward = following ? 10 : 0;

    // Update claim - clear screenshot_url after verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase
      .from("follow_claims")
      .update({
        status: newStatus,
        points_awarded: pointsToAward,
        reviewed_at: new Date().toISOString(),
        screenshot_url: "verified",
      })
      .eq("id", claim_id)
      .eq("user_id", user.id);

    // Delete the screenshot from storage
    const filePath = `${user.id}/instagram-follow`;
    const { data: files } = await supabase.storage
      .from("follow-screenshots")
      .list(user.id);
    
    if (files && files.length > 0) {
      const paths = files.map((f: { name: string }) => `${user.id}/${f.name}`);
      await supabase.storage.from("follow-screenshots").remove(paths);
    }

    if (following) {
      // Award points
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ total_points: profile.total_points + 10 })
          .eq("user_id", user.id);
      }

      // Log transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: 0,
        points_earned: 10,
        type: "follow",
        description: "Instagram follow — 10 pts",
      });
    }

    return new Response(
      JSON.stringify({ status: newStatus, following }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("verify-follow error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
