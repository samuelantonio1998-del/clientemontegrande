import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function respond(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return respond({ error: "Not authenticated" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return respond({ error: "Invalid token" });
    }

    const { data: isAdmin } = await supabaseAuth.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return respond({ error: "Forbidden" });
    }

    const { client_user_id } = await req.json();
    if (!client_user_id) {
      return respond({ error: "Missing client_user_id" });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Server-side weekday check
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return respond({ error: "weekday_only" });
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
      return respond({ error: "cooldown_active" });
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name, client_code, consecutive_meals, current_week_start, total_points")
      .eq("user_id", client_user_id)
      .single();

    if (profileError || !profile) {
      return respond({ error: "Client not found" });
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

    // Update profile
    const profileUpdate: Record<string, any> = {
      consecutive_meals: reachedDiscount ? 0 : newMeals,
      current_week_start: mondayStr,
      discount_available: reachedDiscount,
      total_points: profile.total_points + pointsEarned,
    };

    if (reachedDiscount) {
      profileUpdate.discount_earned_at = new Date().toISOString();
    }

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

    return respond({
      success: true,
      meals: newMeals,
      reachedDiscount,
      pointsEarned,
      transactionId: txData?.id,
    });
  } catch (e) {
    console.error("register-meal error:", e);
    return respond({ error: "An unexpected error occurred" });
  }
});
