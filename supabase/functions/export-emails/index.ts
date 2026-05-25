import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse, preflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflightResponse(req);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    // Validate PIN
    const body = await req.json().catch(() => ({}));
    const pin = body?.pin;
    const expectedPin = Deno.env.get("EXPORT_PIN");

    if (!expectedPin || !pin || pin !== expectedPin) {
      return jsonResponse(req, { error: "invalid_pin" }, 403);
    }

    // Verify the caller is an admin
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabaseAnon.auth.getUser();
    if (!user) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    const { data: isAdmin } = await supabaseAnon.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    // Use service role to list all users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const allUsers: { email: string; name: string; created: string }[] = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) throw error;
      if (!users || users.length === 0) break;

      for (const u of users) {
        if (u.email) {
          allUsers.push({
            email: u.email,
            name: u.user_metadata?.display_name || u.user_metadata?.full_name ||
              u.user_metadata?.name || "",
            created: u.created_at || "",
          });
        }
      }

      if (users.length < perPage) break;
      page++;
    }

    // Build CSV
    const csvRows = ["Email,Nome,Data de Registo"];
    for (const u of allUsers) {
      const escapedName = u.name.replace(/"/g, '""');
      const date = u.created ? new Date(u.created).toLocaleDateString("pt-PT") : "";
      csvRows.push(`${u.email},"${escapedName}",${date}`);
    }

    // CSV response — get CORS headers manually since we're not returning JSON
    return new Response(csvRows.join("\n"), {
      status: 200,
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="utilizadores.csv"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return jsonResponse(req, { error: "Internal error" }, 500);
  }
});
