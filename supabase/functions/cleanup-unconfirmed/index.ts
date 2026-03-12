import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find unconfirmed users created more than 24 hours ago
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return new Response(JSON.stringify({ error: listError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const unconfirmed = users.users.filter(
    (u) => !u.email_confirmed_at && u.created_at && new Date(u.created_at) < new Date(cutoff)
  );

  let deleted = 0;
  for (const u of unconfirmed) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (!error) deleted++;
  }

  return new Response(JSON.stringify({ success: true, deleted, checked: users.users.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
