import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, preflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflightResponse(req);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    // Verify the user's JWT
    const supabaseAnonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseAnonClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    // Use service role to delete user data and account
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Delete profile data (cascading will handle related records via foreign keys)
    await supabase.from("reviews").delete().eq("user_id", user.id);
    await supabase.from("transactions").delete().eq("user_id", user.id);
    await supabase.from("follow_claims").delete().eq("user_id", user.id);
    await supabase.from("referrals").delete().or(
      `referrer_id.eq.${user.id},referred_id.eq.${user.id}`,
    );
    await supabase.from("admin_actions").delete().eq("client_user_id", user.id);
    await supabase.from("profiles").delete().eq("user_id", user.id);
    await supabase.from("user_roles").delete().eq("user_id", user.id);

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return jsonResponse(req, { error: "Failed to delete account" }, 500);
    }

    return jsonResponse(req, { success: true }, 200);
  } catch (err) {
    console.error("delete-account error:", err);
    return jsonResponse(req, { error: "Internal server error" }, 500);
  }
});
