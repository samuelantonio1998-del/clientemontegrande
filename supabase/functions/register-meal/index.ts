import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse, preflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflightResponse(req);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Not authenticated" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Identificar o admin a partir do JWT
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: admin },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !admin) {
      return jsonResponse(req, { error: "Invalid token" }, 401);
    }

    // 2. Parse e validar body
    let body: { client_user_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: "Invalid JSON" }, 400);
    }

    const { client_user_id } = body;
    if (!client_user_id || typeof client_user_id !== "string") {
      return jsonResponse(req, { error: "Missing client_user_id" }, 400);
    }

    // 3. Chamar a função SQL atómica.
    //    Toda a lógica (autorização admin, cooldown, lock, insert, update)
    //    corre dentro de uma única transação PostgreSQL.
    const { data, error } = await supabase.rpc("register_meal_atomic", {
      _client_user_id: client_user_id,
      _admin_id: admin.id,
    });

    if (error) {
      console.error("register_meal_atomic RPC error:", error);
      return jsonResponse(req, { error: "internal", details: error.message }, 500);
    }

    // 4. Traduzir códigos de erro do SQL em HTTP status codes apropriados.
    const result = data as Record<string, unknown>;
    if (result.error) {
      const errCode = result.error as string;
      switch (errCode) {
        case "forbidden":
          return jsonResponse(req, { error: errCode }, 403);
        case "client_not_found":
          return jsonResponse(req, { error: errCode }, 404);
        case "cooldown_active":
          return jsonResponse(req, { error: errCode }, 429);
        default:
          return jsonResponse(req, { error: errCode }, 400);
      }
    }

    return jsonResponse(req, result, 200);
  } catch (e) {
    console.error("register-meal error:", e);
    return jsonResponse(req, { error: "An unexpected error occurred" }, 500);
  }
});
