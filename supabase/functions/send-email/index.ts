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

const nomeOf = (v: Vars) => (typeof v.nome === "string" && v.nome.trim() ? v.nome.trim().slice(0, 100) : "cliente");
const numOf = (x: unknown) => {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN;
  return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "";
};

const FOOTER_TEXT = "Restaurante Monte Grande, Albergaria, Marinha Grande";

const layout = (paragraphs: string[]) =>
  `<div style="background:#ede7d9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#5d4632">` +
  `<div style="max-width:560px;margin:0 auto;background:#ede7d9;border-radius:16px;padding:28px 24px">` +
  `<div style="text-align:center;font-family:Georgia,'Playfair Display',serif;font-size:20px;letter-spacing:3px;font-weight:bold;color:#5d4632;border-bottom:1px solid #5d463233;padding-bottom:16px;margin-bottom:20px">MONTE GRANDE RESTAURANTE</div>` +
  paragraphs.map((p) => `<p style="font-size:16px;line-height:1.6;margin:0 0 14px">${escapeHtml(p)}</p>`).join("") +
  `<div style="border-top:1px solid #5d463233;margin-top:24px;padding-top:14px;text-align:center;font-size:12px;color:#5d4632b3">${escapeHtml(FOOTER_TEXT)}<br/><a href="#" style="color:#5d4632b3">Deixar de receber estes emails</a></div>` +
  `</div></div>`;

const textLayout = (paragraphs: string[]) =>
  ["MONTE GRANDE RESTAURANTE", "", ...paragraphs.flatMap((p) => [p, ""]), "--", FOOTER_TEXT, "Deixar de receber estes emails: #"].join("\n");

const simple = (subject: (v: Vars) => string, body: (v: Vars) => string[]): Template => ({
  subject,
  html: (v) => layout(body(v)),
  text: (v) => textLayout(body(v)),
});

const TEMPLATES: Record<string, Template> = {
  test: {
    subject: () => "Teste do Monte Grande",
    text: (v) => testMessage(v),
    html: (v) =>
      `<div style='font-family:sans-serif;color:#5d4632;background:#ede7d9;padding:24px;border-radius:8px'><h2>Monte Grande</h2><p>${escapeHtml(testMessage(v))}</p></div>`,
  },
  buffet_available: simple(
    (v) => `O teu buffet grátis está à espera, ${nomeOf(v)}!`,
    (v) => [
      `Olá ${nomeOf(v)},`,
      `Já tens ${numOf(v.pontos) || "200"} pontos acumulados — o teu buffet grátis está pronto para ser levantado!`,
      "Passa por cá num dia útil e pede ao balcão para usar a tua oferta. Bebidas não incluídas.",
      "Até já!",
    ],
  ),
  discount_available: simple(
    (v) => `Tens 10€ de desconto à espera, ${nomeOf(v)}!`,
    (v) => [
      `Olá ${nomeOf(v)},`,
      "Fizeste a tua 4.ª refeição desta semana (4/4) e ganhaste 10€ de desconto!",
      "Podes usá-lo na tua próxima visita — é só mostrares o teu QR code ao balcão.",
      "Obrigado pela preferência!",
    ],
  ),
  points_milestone: simple(
    (v) => `Faltam-te só ${numOf(v.faltam) || "alguns"} pontos para o buffet, ${nomeOf(v)}!`,
    (v) => [
      `Olá ${nomeOf(v)},`,
      `Estás quase lá! Faltam-te só ${numOf(v.faltam) || "alguns"} pontos para o teu buffet grátis.`,
      "Cada refeição conta — mais umas visitas e o buffet é teu.",
      "Esperamos por ti!",
    ],
  ),
  birthday: simple(
    (v) => `Parabéns ${nomeOf(v)}! Vem festejar connosco`,
    (v) => [
      `Olá ${nomeOf(v)},`,
      "Toda a equipa do Monte Grande deseja-te um feliz aniversário!",
      "Para festejar, oferecemos-te uma sobremesa grátis quando nos visitares este mês.",
      "Vem celebrar connosco!",
    ],
  ),
  inactive: simple(
    (v) => `Já há tempos que não te vemos, ${nomeOf(v)}`,
    (v) => [
      `Olá ${nomeOf(v)},`,
      "Temos saudades tuas! Já há algum tempo que não passas pelo Monte Grande.",
      "Volta para uma refeição — os teus pontos continuam à tua espera.",
      "Até breve!",
    ],
  ),
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
