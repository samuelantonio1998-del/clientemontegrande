import { createClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse, preflightResponse } from "../_shared/cors.ts";
import { createHmac } from "node:crypto";

const UNSUB_BASE = "https://pfasftcqkgloxmvgwkfl.supabase.co/functions/v1/unsubscribe?token=";
const generateUnsubToken = (userId: string): string => {
  const secret = Deno.env.get("UNSUBSCRIBE_SECRET");
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET not configured");
  return `${userId}.${createHmac("sha256", secret).update(userId).digest("hex")}`;
};

const CTA_HTML = `<div style="text-align:center;margin:24px 0 8px;">
  <a href="https://quintamontegrande.com" class="mg-cta" style="display:inline-block;background-color:#5d4632;color:#ede7d9 !important;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:600;font-family:'Aaux Next','Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;letter-spacing:0.3px;">Fazer Reserva</a>
</div>`;

type Vars = Record<string, unknown>;
interface Template {
  subject: (v: Vars) => string;
  html: (v: Vars, unsubscribeUrl: string) => string;
  text: (v: Vars, unsubscribeUrl: string) => string;
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

const BODY_FONT = "font-family:'Aaux Next','Inter','Helvetica Neue',Arial,sans-serif;line-height:1.6;";
const HEADER_IMG =
  `<img src="https://clientequintamontegrande.com/email-header.png" alt="Monte Grande Restaurante" width="450" style="display:block;margin:0 auto 16px;max-width:100%;height:auto;" />`;

const layout = (paragraphs: string[], unsubscribeUrl: string) =>
  wrapEmail(paragraphs.map((p) => `<p style="font-size:16px;margin:0 0 14px;">${escapeHtml(p)}</p>`).join("\n    ") + "\n    " + CTA_HTML, unsubscribeUrl);

const textLayout = (paragraphs: string[], unsubscribeUrl: string) =>
  ["MONTE GRANDE RESTAURANTE", "", ...paragraphs.flatMap((p) => [p, ""]), "Fazer Reserva: https://quintamontegrande.com", "", "--", FOOTER_TEXT, "Deixar de receber estes emails: " + unsubscribeUrl].join("\n");

const simple = (subject: (v: Vars) => string, body: (v: Vars) => string[]): Template => ({
  subject,
  html: (v, u) => layout(body(v), u),
  text: (v, u) => textLayout(body(v), u),
});

const wrapEmail = (bodyHtml: string, unsubscribeUrl = "#"): string => `<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>Monte Grande</title>
<style>
  :root { color-scheme: light only; supported-color-schemes: light; }
  body { margin:0; padding:0; background-color:#ede7d9 !important; }
  .mg-container {
    background-color:#ede7d9 !important;
    color:#5d4632 !important;
    max-width:600px; margin:0 auto; padding:24px; border-radius:8px;
    font-family:'Aaux Next','Inter','Helvetica Neue',Arial,sans-serif;
    line-height:1.6;
  }
  .mg-container p, .mg-container a, .mg-container span,
  .mg-container div, .mg-container td { color:#5d4632 !important; }
  .mg-container h1, .mg-container h2, .mg-container h3 {
    font-family:'IvyMode','Playfair Display',Georgia,serif;
    color:#5d4632 !important;
  }
  .mg-footer, .mg-footer a { color:#8a7a5e !important; }
  .mg-cta { background-color:#5d4632 !important; color:#ede7d9 !important; }
  [data-ogsc] .mg-cta, [data-ogsb] .mg-cta { background-color:#5d4632 !important; color:#ede7d9 !important; }
  @media (prefers-color-scheme: dark) { .mg-cta { background-color:#5d4632 !important; color:#ede7d9 !important; } }
  [data-ogsc] body, [data-ogsb] body { background-color:#ede7d9 !important; }
  [data-ogsc] .mg-container, [data-ogsb] .mg-container {
    background-color:#ede7d9 !important; color:#5d4632 !important;
  }
  [data-ogsc] .mg-container *, [data-ogsb] .mg-container * {
    color:#5d4632 !important;
  }
  [data-ogsc] .mg-footer, [data-ogsc] .mg-footer a,
  [data-ogsb] .mg-footer, [data-ogsb] .mg-footer a {
    color:#8a7a5e !important;
  }
  @media (prefers-color-scheme: dark) {
    body { background-color:#ede7d9 !important; }
    .mg-container { background-color:#ede7d9 !important; color:#5d4632 !important; }
    .mg-container * { color:#5d4632 !important; }
    .mg-footer, .mg-footer a { color:#8a7a5e !important; }
  }
</style>
</head>
<body>
  <div class="mg-container">
    <img src="https://clientequintamontegrande.com/email-header.png"
         alt="Monte Grande Restaurante" width="450"
         style="display:block;margin:0 auto 16px;max-width:100%;height:auto;" />
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #c9bfa8;margin:24px 0 16px;" />
    <p class="mg-footer" style="font-size:12px;text-align:center;margin:0;">
      Restaurante Monte Grande, Albergaria, Marinha Grande<br>
      <a href="${escapeHtml(unsubscribeUrl)}" style="text-decoration:underline;">Deixar de receber estes emails</a>
    </p>
  </div>
</body>
</html>`;

const TEMPLATES: Record<string, Template> = {
  test: {
    subject: () => "Teste do Monte Grande",
    text: (v) => testMessage(v),
    html: (v, u) => wrapEmail(`<p>${escapeHtml(testMessage(v))}</p>`, u),
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
      "Para festejar, faz uma reserva no mínimo de 10 pessoas e oferecemos-te uma garrafa de espumante quando nos visitares este mês.",
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
    const uuidReU = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let unsubscribeUrl = "#";
    if (typeof body?.user_id === "string" && uuidReU.test(body.user_id)) {
      try {
        unsubscribeUrl = UNSUB_BASE + encodeURIComponent(generateUnsubToken(body.user_id));
      } catch (e) {
        console.error("unsubscribe token generation failed", e);
      }
    }
    const extraHeaders: Record<string, string> = unsubscribeUrl !== "#"
      ? {
        "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:quintamontegrande@hotmail.com?subject=Cancelar%20subscri%C3%A7%C3%A3o>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
      : {};
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Monte Grande <noreply@clientequintamontegrande.com>",
        to,
        subject: tpl.subject(vars),
        html: tpl.html(vars, unsubscribeUrl),
        text: tpl.text(vars, unsubscribeUrl),
        headers: extraHeaders,
      }),
    });

    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return jsonResponse(req, { error: "resend_error" }, 502);
    }

    const data = await res.json();

    // Log successful send (service role). Optional body.user_id links to a user.
    try {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const logUserId = typeof body?.user_id === "string" && uuidRe.test(body.user_id) ? body.user_id : null;
      const admin = createClient(supabaseUrl, serviceKey);
      const { error: logErr } = await admin.from("email_log").insert({
        user_id: logUserId,
        template,
        resend_id: data.id ?? null,
        status: "sent",
      });
      if (logErr) console.error("email_log insert failed", logErr);
    } catch (logEx) {
      console.error("email_log insert exception", logEx);
    }

    return jsonResponse(req, { success: true, resendId: data.id }, 200);
  } catch (e) {
    console.error("send-email failure", e);
    return jsonResponse(req, { error: "internal_error" }, 500);
  }
});
