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
    const { email, password } = await req.json()

    // Admin client (service_role_key) for secure updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    if (userError) throw userError

    const user = users.users.find(u => u.email === email)
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), {
      headers: ...corsHeaders,
      status: 404,
    })

    // Update user password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    )

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: 'Password reset successfully' }), {
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
