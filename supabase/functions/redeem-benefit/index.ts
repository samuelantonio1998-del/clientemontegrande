import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: isAdmin } = await supabaseAuth.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { benefit_type, client_user_id } = await req.json();
    if (!benefit_type || !client_user_id) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current profile state from DB
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", client_user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (benefit_type === "discount") {
      if (!profile.discount_available) {
        return new Response(JSON.stringify({ error: "discount_not_available" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newSavings = (Number(profile.total_savings) || 0) + 10;
      await supabase
        .from("profiles")
        .update({ discount_available: false, total_savings: newSavings })
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

      return new Response(JSON.stringify({ success: true, type: "discount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (benefit_type === "buffet") {
      if (!profile.buffet_available) {
        return new Response(JSON.stringify({ error: "buffet_not_available" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const currentPoints = Number(profile.total_points) || 0;
      if (currentPoints < 200) {
        return new Response(JSON.stringify({ error: "insufficient_points" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("profiles")
        .update({ buffet_available: false, total_points: currentPoints - 200 })
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

      return new Response(JSON.stringify({ success: true, type: "buffet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid benefit_type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("redeem-benefit error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
