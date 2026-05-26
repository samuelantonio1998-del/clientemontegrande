/**
 * Lista única de origens permitidas para chamadas client-side.
 * Usada por todas as Edge Functions invocadas a partir do browser.
 *
 * Funções chamadas exclusivamente por cron (birthday-check, cleanup-unconfirmed,
 * weekly-reset, process-email-queue) NÃO precisam destes headers — não vêm de browser.
 */
export const ALLOWED_ORIGINS = [
  "https://clientemontegrande.lovable.app",
  "https://clientequintamontegrande.com",
  "https://www.clientequintamontegrande.com",
] as const;

const ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

/**
 * Devolve os headers CORS a aplicar à resposta. Reflete dinamicamente o Origin
 * do pedido, mas só se ele constar da lista — nunca devolve `*`.
 *
 * Se a origem for desconhecida, devolve a primeira da lista (efeito prático:
 * o browser do atacante rejeita a resposta, sem leak de info).
 */
export const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get("Origin");
  const isAllowed = !!origin && (
    ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number]) ||
    /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin)
  );
  const allowedOrigin = isAllowed ? origin! : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

/**
 * Helper para responder com JSON respeitando CORS e status corretos.
 */
export const jsonResponse = (
  req: Request,
  body: Record<string, unknown>,
  status = 200,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });

/**
 * Resposta para pedido OPTIONS (preflight CORS).
 */
export const preflightResponse = (req: Request): Response =>
  new Response(null, { headers: getCorsHeaders(req) });
