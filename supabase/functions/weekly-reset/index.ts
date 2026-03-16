import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Verify the request is from the cron scheduler
  const authHeader = req.headers.get("Authorization");
  const expectedToken = Deno.env.get("CRON_SECRET");
  if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Set discount_available = true for clients who completed 4 meals
  await supabase
    .from("profiles")
    .update({ discount_available: true, consecutive_meals: 0, current_week_start: null })
    .eq("consecutive_meals", 4);

  // Reset meals for everyone else
  await supabase
    .from("profiles")
    .update({ consecutive_meals: 0, current_week_start: null })
    .gt("consecutive_meals", 0)
    .lt("consecutive_meals", 4);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
