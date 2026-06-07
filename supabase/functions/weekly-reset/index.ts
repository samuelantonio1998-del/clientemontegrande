import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify the request is from the cron scheduler.
  // Token is stored in the database vault (name: 'cron_secret') so both
  // pg_cron and this function read from the same source of truth.
  const authHeader = req.headers.get("Authorization") || "";
  const provided = authHeader.replace(/^Bearer\s+/i, "").trim();

  const { data: expected, error: secretErr } = await supabase.rpc("get_cron_secret");
  if (secretErr || !expected || !provided || provided !== expected) {
    console.error("weekly-reset auth failed", { secretErr });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Grant discount to clients who completed 4 meals and reset their counter
  const { error: err1 } = await supabase
    .from("profiles")
    .update({ discount_available: true, consecutive_meals: 0, current_week_start: null })
    .eq("consecutive_meals", 4);

  // Reset meals for everyone else who started but didn't complete
  const { error: err2 } = await supabase
    .from("profiles")
    .update({ consecutive_meals: 0, current_week_start: null })
    .gt("consecutive_meals", 0)
    .lt("consecutive_meals", 4);

  if (err1 || err2) {
    console.error("weekly-reset update error", { err1, err2 });
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
