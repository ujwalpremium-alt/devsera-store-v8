import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the requesting user is a super admin
    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !requestingUser) {
      throw new Error('Unauthorized')
    }

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('admin_role')
      .eq('id', requestingUser.id)
      .single()

    if (profileError || !profile || profile.admin_role !== 'super_admin') {
      throw new Error('Only super admins can reset passwords')
    }

    const { adminId, newPassword } = await req.json()

    if (!adminId || !newPassword) {
      throw new Error('Admin ID and new password are required')
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Use service role client to update password
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      adminId,
      { password: newPassword }
    )

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
