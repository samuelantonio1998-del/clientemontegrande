import { createClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse, preflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflightResponse(req);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const pin = body?.pin;
    const expectedPin = Deno.env.get("ADMIN_PIN");

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabaseAnon.auth.getUser();
    if (!user) {
      return jsonResponse(req, { error: "unauthorized" }, 401);
    }

    const { data: isAdmin } = await supabaseAnon.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return jsonResponse(req, { error: "forbidden" }, 403);
    }

    if (!expectedPin || !pin || pin !== expectedPin) {
      return jsonResponse(req, { error: "invalid_pin" }, 403);
    }

    return jsonResponse(req, { ok: true });
  } catch (error) {
    console.error("verify-admin-pin error:", error);
    return jsonResponse(req, { error: "internal_error" }, 500);
  }
});
