import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
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

    const { client_user_id } = await req.json();
    if (!client_user_id) {
      return new Response(JSON.stringify({ error: "Missing client_user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Server-side weekday check
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return new Response(
        JSON.stringify({ error: "weekday_only" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side 5-hour cooldown check
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const { data: lastMeals } = await supabase
      .from("transactions")
      .select("created_at")
      .eq("user_id", client_user_id)
      .eq("type", "meal")
      .gte("created_at", fiveHoursAgo)
      .limit(1);

    if (lastMeals && lastMeals.length > 0) {
      return new Response(
        JSON.stringify({ error: "cooldown_active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current profile atomically
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name, client_code, consecutive_meals, current_week_start, total_points")
      .eq("user_id", client_user_id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate meals
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
    const mondayStr = monday.toISOString().split("T")[0];

    let newMeals = profile.consecutive_meals;
    if (profile.current_week_start !== mondayStr) {
      newMeals = 1;
    } else {
      newMeals += 1;
    }

    const reachedDiscount = newMeals >= 4;
    const pointsEarned = 10;

    // Insert transaction
    const { data: txData } = await supabase
      .from("transactions")
      .insert({
        user_id: client_user_id,
        amount: 0,
        points_earned: pointsEarned,
        description: reachedDiscount
          ? `Refeição ${newMeals}/4 — desconto desbloqueado!`
          : `Refeição ${newMeals}/4`,
        type: "meal",
      })
      .select("id")
      .single();

    // Update profile atomically using fresh server-side data
    const profileUpdate: Record<string, any> = {
      consecutive_meals: reachedDiscount ? 0 : newMeals,
      current_week_start: mondayStr,
      discount_available: reachedDiscount,
      total_points: profile.total_points + pointsEarned,
    };

    // Record when discount was earned
    if (reachedDiscount) {
      profileUpdate.discount_earned_at = new Date().toISOString();
    }

    // Check if buffet threshold reached (200 points)
    const newTotal = profile.total_points + pointsEarned;
    if (newTotal >= 200 && profile.total_points < 200) {
      profileUpdate.buffet_earned_at = new Date().toISOString();
    }

    await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", client_user_id);

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      client_user_id: client_user_id,
      client_name: profile.display_name,
      client_code: profile.client_code,
      action_type: "meal",
      description: reachedDiscount
        ? `Refeição ${newMeals}/4 — desconto desbloqueado!`
        : `Refeição ${newMeals}/4`,
      points_changed: pointsEarned,
      transaction_id: txData?.id || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        meals: newMeals,
        reachedDiscount,
        pointsEarned,
        transactionId: txData?.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("register-meal error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
