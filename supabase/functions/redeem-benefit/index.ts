import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse, preflightResponse } from "../_shared/cors.ts";

const DISCOUNT_VALUE_EUR = 10;
const BUFFET_POINTS_COST = 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflightResponse(req);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Auth: identificar quem chama
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    // 2. Autorização: tem de ser admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    // 3. Parse e validar body
    let body: { benefit_type?: string; client_user_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: "Invalid JSON" }, 400);
    }

    const { benefit_type, client_user_id } = body;
    if (!benefit_type || !client_user_id) {
      return jsonResponse(req, { error: "Missing parameters" }, 400);
    }
    if (benefit_type !== "discount" && benefit_type !== "buffet") {
      return jsonResponse(req, { error: "Invalid benefit_type" }, 400);
    }

    // 4. Carregar perfil do cliente
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", client_user_id)
      .single();

    if (profileError || !profile) {
      return jsonResponse(req, { error: "Client not found" }, 404);
    }

    // 5. Validar regra "must_return_first": só pode resgatar se voltou após ganhar
    const checkReturnedSince = async (earnedAt: string | null): Promise<boolean> => {
      if (!earnedAt) return true;
      const { data: mealsAfter } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", client_user_id)
        .eq("type", "meal")
        .gt("created_at", earnedAt)
        .limit(1);
      return !!(mealsAfter && mealsAfter.length > 0);
    };

    if (benefit_type === "discount") {
      if (!profile.discount_available) {
        return jsonResponse(req, { error: "discount_not_available" }, 409);
      }
      if (!(await checkReturnedSince(profile.discount_earned_at))) {
        return jsonResponse(req, { error: "must_return_first" }, 409);
      }

      const newSavings = (Number(profile.total_savings) || 0) + DISCOUNT_VALUE_EUR;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          discount_available: false,
          total_savings: newSavings,
          discount_earned_at: null,
        })
        .eq("user_id", client_user_id);

      if (updErr) {
        console.error("redeem discount update error:", updErr);
        return jsonResponse(req, { error: "update_failed" }, 500);
      }

      // Histórico do cliente (transação informativa, sem pontos)
      await supabase.from("transactions").insert({
        user_id: client_user_id,
        amount: DISCOUNT_VALUE_EUR,
        points_earned: 0,
        type: "redeem_discount",
        description: "Desconto 10€ resgatado",
      });

      // Best-effort log (não falhar o resgate se o log falhar)
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        client_user_id,
        client_name: profile.display_name,
        client_code: profile.client_code,
        action_type: "redeem_discount",
        description: "Desconto resgatado",
        points_changed: 0,
      });

      return jsonResponse(req, { success: true, type: "discount" }, 200);
    }

    // benefit_type === "buffet"
    if (!profile.buffet_available) {
      return jsonResponse(req, { error: "buffet_not_available" }, 409);
    }
    const currentPoints = Number(profile.total_points) || 0;
    if (currentPoints < BUFFET_POINTS_COST) {
      return jsonResponse(req, { error: "insufficient_points" }, 409);
    }
    if (!(await checkReturnedSince(profile.buffet_earned_at))) {
      return jsonResponse(req, { error: "must_return_first" }, 409);
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        buffet_available: false,
        total_points: currentPoints - BUFFET_POINTS_COST,
        buffet_earned_at: null,
      })
      .eq("user_id", client_user_id);

    if (updErr) {
      console.error("redeem buffet update error:", updErr);
      return jsonResponse(req, { error: "update_failed" }, 500);
    }

    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      client_user_id,
      client_name: profile.display_name,
      client_code: profile.client_code,
      action_type: "redeem_buffet",
      description: "Buffet resgatado",
      points_changed: -BUFFET_POINTS_COST,
    });

    return jsonResponse(req, { success: true, type: "buffet" }, 200);
  } catch (err) {
    console.error("redeem-benefit error:", err);
    return jsonResponse(req, { error: "Internal server error" }, 500);
  }
});
