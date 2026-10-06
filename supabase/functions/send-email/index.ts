import { createClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse, preflightResponse } from "../_shared/cors.ts";

type Vars = Record<string, unknown>;
interface Template {
  subject: (v: Vars) => string;
  html: (v: Vars) => string;
  text: (v: Vars) => string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const testMessage = (v: Vars) =>
  "Ola " + (typeof v.nome === "string" && v.nome ? v.nome : "cliente") +
  ", este e um email de teste do sistema de fidelidade do Restaurante Monte Grande.";

const TEMPLATES: Record<string, Template> = {
  test: {
    subject: () => "Teste do Monte Grande",
    text: (v) => testMessage(v),
    html: (v) =>
      `<div style='font-family:sans-serif;color:#5d4632;background:#ede7d9;padding:24px;border-radius:8px'><h2>Monte Grande</h2><p>${escapeHtml(testMessage(v))}</p></div>`,
  },
};

const isEmail = (s: unknown) =>
  typeof s === "string" && s.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function jwtRole(token: string): unknown {
  try {
    const p = token.split(".")[1];
    if (!p) return null;
    const json = atob(p.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(p.length / 4) * 4, "="));
    return JSON.parse(json).role;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(req, { error: "forbidden" }, 403);
    }
    const token = authHeader.slice(7).trim();

    // (a) service_role
    let authorized = token === serviceKey;
    if (!authorized && jwtRole(token) === "service_role") {
      const admin = createClient(supabaseUrl, token);
      // Validate signature by performing a trivial privileged call
      const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
      authorized = !error;
    }

    // (b) admin user JWT
    if (!authorized) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
      const userId = claimsData?.claims?.sub;
      if (!claimsErr && userId) {
        const { data: isAdmin } = await userClient.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });
        authorized = isAdmin === true;
      }
    }

    if (!authorized) return jsonResponse(req, { error: "forbidden" }, 403);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(req, { error: "invalid_body" }, 400);
    }

    const { to, template, variables } = body ?? {};
    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0 || recipients.length > 50 || !recipients.every(isEmail)) {
      return jsonResponse(req, { error: "invalid_to" }, 400);
    }
    if (variables !== undefined && (typeof variables !== "object" || variables === null || Array.isArray(variables))) {
      return jsonResponse(req, { error: "invalid_variables" }, 400);
    }

    const tpl = typeof template === "string" && Object.prototype.hasOwnProperty.call(TEMPLATES, template)
      ? TEMPLATES[template]
      : null;
    if (!tpl) return jsonResponse(req, { error: "template_not_found" }, 400);

    const vars: Vars = variables ?? {};
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@clientequintamontegrande.com",
        to,
        subject: tpl.subject(vars),
        html: tpl.html(vars),
        text: tpl.text(vars),
      }),
    });

    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return jsonResponse(req, { error: "resend_error" }, 502);
    }

    const data = await res.json();
    return jsonResponse(req, { success: true, resendId: data.id }, 200);
  } catch (e) {
    console.error("send-email failure", e);
    return jsonResponse(req, { error: "internal_error" }, 500);
  }
});
