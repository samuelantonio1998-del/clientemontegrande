import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate PIN
    const body = await req.json().catch(() => ({}))
    const pin = body?.pin
    const expectedPin = Deno.env.get('EXPORT_PIN')

    if (!expectedPin || !pin || pin !== expectedPin) {
      return new Response(JSON.stringify({ error: 'invalid_pin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the caller is an admin
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseAnon.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: isAdmin } = await supabaseAnon.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    })

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to list all users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const allUsers: { email: string; name: string; created: string }[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (error) throw error
      if (!users || users.length === 0) break

      for (const u of users) {
        if (u.email) {
          allUsers.push({
            email: u.email,
            name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || '',
            created: u.created_at || '',
          })
        }
      }

      if (users.length < perPage) break
      page++
    }

    // Build CSV
    const csvRows = ['Email,Nome,Data de Registo']
    for (const u of allUsers) {
      const escapedName = u.name.replace(/"/g, '""')
      const date = u.created ? new Date(u.created).toLocaleDateString('pt-PT') : ''
      csvRows.push(`${u.email},"${escapedName}",${date}`)
    }

    return new Response(csvRows.join('\n'), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="utilizadores.csv"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
