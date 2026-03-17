import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authorization (accept anon key for cron or CRON_SECRET)
  const authHeader = req.headers.get("authorization");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (authHeader !== `Bearer ${anonKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-based
  const firstDayOfMonth = today.getDate() === 1;

  // Only send on the 1st of each month
  if (!firstDayOfMonth) {
    return new Response(JSON.stringify({ message: "Not the first day of the month, skipping" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get all users with birthday in the current month
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, birth_date")
    .not("birth_date", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const birthdayUsers = (profiles || []).filter((p) => {
    if (!p.birth_date) return false;
    const birthMonth = new Date(p.birth_date).getMonth() + 1;
    return birthMonth === currentMonth;
  });

  // Log birthday notifications (email sending will be handled by email infrastructure when configured)
  console.log(`Found ${birthdayUsers.length} birthday users for month ${currentMonth}`);

  // For each birthday user, create a transaction as a birthday notification marker
  for (const user of birthdayUsers) {
    // Check if we already sent a birthday notification this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.user_id)
      .eq("type", "birthday")
      .gte("created_at", monthStart)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Insert birthday notification transaction
    await supabase.from("transactions").insert({
      user_id: user.user_id,
      amount: 0,
      points_earned: 0,
      type: "birthday",
      description: "🎂 Mês de aniversário — refeição gratuita com 18+ pessoas ou espumante com 10+ pessoas",
    });
  }

  return new Response(
    JSON.stringify({ message: `Processed ${birthdayUsers.length} birthday notifications` }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
