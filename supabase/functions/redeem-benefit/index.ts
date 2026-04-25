import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function respond(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respond({ error: "Unauthorized" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return respond({ error: "Unauthorized" });
    }

    const { data: isAdmin } = await supabaseAuth.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return respond({ error: "Forbidden" });
    }

    const { benefit_type, client_user_id } = await req.json();
    if (!benefit_type || !client_user_id) {
      return respond({ error: "Missing parameters" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", client_user_id)
      .single();

    if (profileError || !profile) {
      return respond({ error: "Client not found" });
    }

    if (benefit_type === "discount") {
      if (!profile.discount_available) {
        return respond({ error: "discount_not_available" });
      }

      const earnedAt = profile.discount_earned_at;
      if (earnedAt) {
        const { data: mealsAfter } = await supabase
          .from("transactions")
          .select("id")
          .eq("user_id", client_user_id)
          .eq("type", "meal")
          .gt("created_at", earnedAt)
          .limit(1);

        if (!mealsAfter || mealsAfter.length === 0) {
          return respond({ error: "must_return_first" });
        }
      }

      const newSavings = (Number(profile.total_savings) || 0) + 10;
      await supabase
        .from("profiles")
        .update({ discount_available: false, total_savings: newSavings, discount_earned_at: null })
        .eq("user_id", client_user_id);

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        client_user_id,
        client_name: profile.display_name,
        client_code: profile.client_code,
        action_type: "redeem_discount",
        description: "Desconto resgatado",
        points_changed: 0,
      });

      return respond({ success: true, type: "discount" });
    }

    if (benefit_type === "buffet") {
      if (!profile.buffet_available) {
        return respond({ error: "buffet_not_available" });
      }

      const currentPoints = Number(profile.total_points) || 0;
      if (currentPoints < 200) {
        return respond({ error: "insufficient_points" });
      }

      const earnedAt = profile.buffet_earned_at;
      if (earnedAt) {
        const { data: mealsAfter } = await supabase
          .from("transactions")
          .select("id")
          .eq("user_id", client_user_id)
          .eq("type", "meal")
          .gt("created_at", earnedAt)
          .limit(1);

        if (!mealsAfter || mealsAfter.length === 0) {
          return respond({ error: "must_return_first" });
        }
      }

      await supabase
        .from("profiles")
        .update({ buffet_available: false, total_points: currentPoints - 200, buffet_earned_at: null })
        .eq("user_id", client_user_id);

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        client_user_id,
        client_name: profile.display_name,
        client_code: profile.client_code,
        action_type: "redeem_buffet",
        description: "Buffet resgatado",
        points_changed: -200,
      });

      return respond({ success: true, type: "buffet" });
    }

    return respond({ error: "Invalid benefit_type" });
  } catch (err) {
    console.error("redeem-benefit error:", err);
    return respond({ error: "Internal server error" });
  }
});
