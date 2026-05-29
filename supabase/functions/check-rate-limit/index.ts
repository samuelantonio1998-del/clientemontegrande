import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://clientemontegrande.lovable.app',
  'https://clientequintamontegrande.com',
  'https://www.clientequintamontegrande.com',
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin === o) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
};

// Rate limit configurations per action
const LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  login:    { maxRequests: 5,  windowSeconds: 60 },
  signup:   { maxRequests: 3,  windowSeconds: 300 },
  reset:    { maxRequests: 3,  windowSeconds: 300 },
  scan:     { maxRequests: 30, windowSeconds: 60 },
  review:   { maxRequests: 5,  windowSeconds: 60 },
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: { action: string; identifier: string }
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { action, identifier } = body

  if (!action || !identifier) {
    return new Response(
      JSON.stringify({ error: 'Missing action or identifier' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Sanitize inputs
  const cleanAction = action.replace(/[^a-z_]/g, '').slice(0, 20)
  const cleanIdentifier = identifier.slice(0, 255).toLowerCase().trim()

  const config = LIMITS[cleanAction]
  if (!config) {
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'

  const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: `${ip}:${cleanIdentifier}`,
    p_action: cleanAction,
    p_max_requests: config.maxRequests,
    p_window_seconds: config.windowSeconds,
  })

  if (error) {
    console.error('Rate limit check failed', { error })
    return new Response(
      JSON.stringify({ allowed: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!allowed) {
    return new Response(
      JSON.stringify({
        allowed: false,
        error: 'Too many requests. Please try again later.',
        retry_after: config.windowSeconds,
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ allowed: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
