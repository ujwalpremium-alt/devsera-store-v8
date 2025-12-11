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
      throw new Error('Only super admins can delete admin users')
    }

    const { adminId, deleteCompletely } = await req.json()

    if (!adminId) {
      throw new Error('Admin ID is required')
    }

    // Prevent self-deletion
    if (adminId === requestingUser.id) {
      throw new Error('Cannot delete your own account')
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if the target is a super admin (can't delete super admins)
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('admin_role, full_name')
      .eq('id', adminId)
      .single()

    if (targetProfile?.admin_role === 'super_admin') {
      throw new Error('Cannot delete super admin accounts')
    }

    // Delete permissions first
    await adminClient
      .from('admin_permissions')
      .delete()
      .eq('admin_id', adminId)

    if (deleteCompletely) {
      // Completely delete the user from auth
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(adminId)
      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError)
      }

      // Delete profile
      await adminClient
        .from('profiles')
        .delete()
        .eq('id', adminId)
    } else {
      // Just demote to regular user
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ 
          role: 'user', 
          admin_role: null,
          is_active: true 
        })
        .eq('id', adminId)

      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: deleteCompletely ? 'Admin user deleted completely' : 'Admin demoted to regular user'
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
