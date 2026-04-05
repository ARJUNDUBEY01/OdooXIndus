import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, name } = await req.json()
    
    // Admin client (service_role_key) to bypass email verification
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Bypass verification
      user_metadata: { name }
    })

    if (authError) throw authError

    // Insert into public.users
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        name,
        role: 'customer'
      })

    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: 'User created successfully', user: authUser.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
