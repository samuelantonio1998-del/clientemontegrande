import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_RE = /^[0-9a-f]{64}$/i;

const page = (title: string, message: string, status = 200) =>
  new Response(
    `<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title} · Monte Grande</title>
<style>
  :root { color-scheme: light only; }
  body { margin:0; padding:40px 16px; background-color:#ede7d9; color:#5d4632;
    font-family:'Aaux Next','Inter','Helvetica Neue',Arial,sans-serif; line-height:1.6; }
  .mg-container { max-width:600px; margin:0 auto; padding:24px; border-radius:8px; text-align:center; }
  h1 { font-family:'IvyMode','Playfair Display',Georgia,serif; font-size:26px; margin:0 0 12px; }
  p { font-size:16px; margin:0 0 14px; }
  img { display:block; margin:0 auto 24px; max-width:100%; height:auto; }
</style>
</head>
<body>
  <div class="mg-container">
    <img src="https://clientequintamontegrande.com/email-header.png" alt="Monte Grande Restaurante" width="450" />
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

const invalid = () => page("Link inválido", "Este link de cancelamento não é válido ou está incompleto.", 400);

function verify(token: string, secret: string): string | null {
  const [userId, sig, ...rest] = token.split(".");
  if (rest.length || !userId || !sig || !UUID_RE.test(userId) || !HEX_RE.test(sig)) return null;
  const expected = createHmac("sha256", secret).update(userId).digest();
  const given = new Uint8Array(sig.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  if (given.length !== expected.length) return null;
  return timingSafeEqual(expected, given) ? userId : null;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const isPost = req.method === "POST";
  try {
    if (req.method !== "GET" && req.method !== "POST") return invalid();
    const secret = Deno.env.get("UNSUBSCRIBE_SECRET");
    if (!secret) {
      console.error("unsubscribe: UNSUBSCRIBE_SECRET not configured");
      if (isPost) return json({ error: "not_configured" });
      return page("Erro temporário", "Não foi possível processar o pedido. Tenta novamente mais tarde.", 500);
    }
    let token = new URL(req.url).searchParams.get("token") ?? "";
    if (isPost && !token) {
      try { token = String((await req.json())?.token ?? ""); } catch { /* one-click form body */ }
    }
    const userId = verify(token, secret);
    if (!userId) {
      console.warn("unsubscribe: invalid token");
      return isPost ? json({ error: "invalid_token" }) : invalid();
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await supabase.from("profiles").update({ email_opted_out: true }).eq("user_id", userId);
    if (error) {
      console.error("unsubscribe: update failed", error);
      if (isPost) return json({ error: "update_failed" });
      return page("Erro temporário", "Não foi possível processar o pedido. Tenta novamente mais tarde.", 500);
    }
    console.log("unsubscribe: opted out", userId);
    if (isPost) return json({ success: true });
    return page("Subscrição cancelada", "Subscrição cancelada. Já não vais receber mais emails do Monte Grande.");
  } catch (e) {
    console.error("unsubscribe failure", e);
    return isPost ? json({ error: "internal_error" }) : invalid();
  }
});
