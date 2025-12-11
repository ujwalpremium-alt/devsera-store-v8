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

    // Create client with user's token to verify they're a super admin
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

    if (profileError || !profile || (profile.admin_role !== 'super_admin' && profile.admin_role !== 'admin')) {
      throw new Error('Only super admins can create admin users')
    }

    // Check if admin role users can only create moderators
    const { email, password, fullName, adminRole, permissions } = await req.json()

    if (profile.admin_role === 'admin' && adminRole !== 'moderator') {
      throw new Error('Admins can only create moderator accounts')
    }

    // Use service role client to create user without email verification
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create the user with admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: fullName,
        role: 'admin',
      }
    })

    if (createError) {
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Failed to create user')
    }

    // Create profile for the new admin
    const { error: insertProfileError } = await adminClient
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email,
        full_name: fullName,
        role: 'admin',
        admin_role: adminRole,
        is_active: true,
        created_by: requestingUser.id,
      })

    if (insertProfileError) {
      // Rollback: delete the created user
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      throw insertProfileError
    }

    // Create permissions
    const { error: permError } = await adminClient
      .from('admin_permissions')
      .insert({
        admin_id: newUser.user.id,
        // Products
        can_view_products: permissions?.can_view_products ?? false,
        can_edit_products: permissions?.can_edit_products ?? false,
        can_delete_products: permissions?.can_delete_products ?? false,
        // Bundles
        can_view_bundles: permissions?.can_view_bundles ?? false,
        can_edit_bundles: permissions?.can_edit_bundles ?? false,
        can_delete_bundles: permissions?.can_delete_bundles ?? false,
        // Flash Sales
        can_view_flash_sales: permissions?.can_view_flash_sales ?? false,
        can_edit_flash_sales: permissions?.can_edit_flash_sales ?? false,
        can_delete_flash_sales: permissions?.can_delete_flash_sales ?? false,
        // Orders
        can_view_orders: permissions?.can_view_orders ?? false,
        can_edit_orders: permissions?.can_edit_orders ?? false,
        can_delete_orders: permissions?.can_delete_orders ?? false,
        // Customers
        can_view_customers: permissions?.can_view_customers ?? false,
        can_edit_customers: permissions?.can_edit_customers ?? false,
        can_delete_customers: permissions?.can_delete_customers ?? false,
        // Tickets
        can_view_tickets: permissions?.can_view_tickets ?? false,
        can_edit_tickets: permissions?.can_edit_tickets ?? false,
        can_delete_tickets: permissions?.can_delete_tickets ?? false,
        // Premium
        can_view_premium: permissions?.can_view_premium ?? false,
        can_edit_premium: permissions?.can_edit_premium ?? false,
        can_delete_premium: permissions?.can_delete_premium ?? false,
        // Rewards
        can_view_rewards: permissions?.can_view_rewards ?? false,
        can_edit_rewards: permissions?.can_edit_rewards ?? false,
        can_delete_rewards: permissions?.can_delete_rewards ?? false,
        // Community
        can_view_community: permissions?.can_view_community ?? false,
        can_edit_community: permissions?.can_edit_community ?? false,
        can_delete_community: permissions?.can_delete_community ?? false,
        // Settings
        can_view_settings: permissions?.can_view_settings ?? false,
        can_edit_settings: permissions?.can_edit_settings ?? false,
        // Admin Management
        can_manage_admins: permissions?.can_manage_admins ?? false,
      })

    if (permError) {
      console.error('Permission creation error:', permError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: 'Admin user created successfully'
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
