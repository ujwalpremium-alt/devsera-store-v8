import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AdminPermissions, AdminRole } from '@/types';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  admin_role: AdminRole | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  last_login: string | null;
  permissions?: AdminPermissions;
}

const defaultPermissions: Omit<AdminPermissions, 'id' | 'admin_id' | 'created_at' | 'updated_at'> = {
  // Products
  can_view_products: false,
  can_edit_products: false,
  can_delete_products: false,
  // Bundles
  can_view_bundles: false,
  can_edit_bundles: false,
  can_delete_bundles: false,
  // Flash Sales
  can_view_flash_sales: false,
  can_edit_flash_sales: false,
  can_delete_flash_sales: false,
  // Orders
  can_view_orders: false,
  can_edit_orders: false,
  can_delete_orders: false,
  // Customers
  can_view_customers: false,
  can_edit_customers: false,
  can_delete_customers: false,
  // Tickets
  can_view_tickets: false,
  can_edit_tickets: false,
  can_delete_tickets: false,
  // Premium
  can_view_premium: false,
  can_edit_premium: false,
  can_delete_premium: false,
  // Rewards
  can_view_rewards: false,
  can_edit_rewards: false,
  can_delete_rewards: false,
  // Community
  can_view_community: false,
  can_edit_community: false,
  can_delete_community: false,
  // Settings
  can_view_settings: false,
  can_edit_settings: false,
  // Admin Management
  can_manage_admins: false,
};

export function useAdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setAdmins([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          admin_role,
          is_active,
          created_by,
          created_at,
          last_login
        `)
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch permissions for each admin
      const adminsWithPermissions = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: permData } = await supabase
            .from('admin_permissions')
            .select('*')
            .eq('admin_id', admin.id)
            .single();

          return {
            ...admin,
            permissions: permData || undefined,
          };
        })
      );

      setAdmins(adminsWithPermissions);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admins');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const createAdmin = async (
    email: string,
    password: string,
    fullName: string,
    adminRole: AdminRole,
    permissions: Partial<AdminPermissions>
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      // Use edge function to create admin user (bypasses email verification)
      const { data, error } = await supabase.functions.invoke('supabase-functions-create-admin-user', {
        body: {
          email,
          password,
          fullName,
          adminRole,
          permissions: {
            ...defaultPermissions,
            ...permissions,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create admin');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create admin user');
      }

      await fetchAdmins();
      return { success: true, userId: data.userId };
    } catch (err) {
      console.error('Error creating admin:', err);
      throw err;
    }
  };

  const updateAdminPermissions = async (
    adminId: string,
    permissions: Partial<AdminPermissions>
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from('admin_permissions')
        .upsert({
          admin_id: adminId,
          ...permissions,
        }, { onConflict: 'admin_id' });

      if (error) throw error;
      await fetchAdmins();
    } catch (err) {
      console.error('Error updating permissions:', err);
      throw err;
    }
  };

  const updateAdminRole = async (adminId: string, adminRole: AdminRole) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_role: adminRole })
        .eq('id', adminId);

      if (error) throw error;
      await fetchAdmins();
    } catch (err) {
      console.error('Error updating admin role:', err);
      throw err;
    }
  };

  const toggleAdminStatus = async (adminId: string, isActive: boolean) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', adminId);

      if (error) throw error;
      await fetchAdmins();
    } catch (err) {
      console.error('Error toggling admin status:', err);
      throw err;
    }
  };

  const deleteAdmin = async (adminId: string, deleteCompletely: boolean = false) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-delete-admin-user', {
        body: { adminId, deleteCompletely },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete admin');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete admin');
      }

      await fetchAdmins();
    } catch (err) {
      console.error('Error deleting admin:', err);
      throw err;
    }
  };

  const resetAdminPassword = async (adminId: string, newPassword: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-reset-admin-password', {
        body: { adminId, newPassword },
      });

      if (error) {
        throw new Error(error.message || 'Failed to reset password');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to reset password');
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (err) {
      console.error('Error resetting password:', err);
      throw err;
    }
  };

  return {
    admins,
    isLoading,
    error,
    fetchAdmins,
    createAdmin,
    updateAdminPermissions,
    updateAdminRole,
    toggleAdminStatus,
    deleteAdmin,
    resetAdminPassword,
    defaultPermissions,
  };
}

export function useCurrentAdminPermissions() {
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isSupabaseConfigured) {
        // Mock mode - check localStorage for user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.role === 'admin') {
            setAdminRole('super_admin');
            setPermissions({
              id: '',
              admin_id: user.id,
              can_view_products: true,
              can_edit_products: true,
              can_delete_products: true,
              can_view_bundles: true,
              can_edit_bundles: true,
              can_delete_bundles: true,
              can_view_flash_sales: true,
              can_edit_flash_sales: true,
              can_delete_flash_sales: true,
              can_view_orders: true,
              can_edit_orders: true,
              can_delete_orders: true,
              can_view_customers: true,
              can_edit_customers: true,
              can_delete_customers: true,
              can_view_tickets: true,
              can_edit_tickets: true,
              can_delete_tickets: true,
              can_view_premium: true,
              can_edit_premium: true,
              can_delete_premium: true,
              can_view_rewards: true,
              can_edit_rewards: true,
              can_delete_rewards: true,
              can_view_community: true,
              can_edit_community: true,
              can_delete_community: true,
              can_view_settings: true,
              can_edit_settings: true,
              can_manage_admins: true,
              created_at: '',
              updated_at: '',
            });
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get profile with admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('admin_role')
          .eq('id', user.id)
          .single();

        if (profile?.admin_role) {
          setAdminRole(profile.admin_role);

          // Super admins have all permissions
          if (profile.admin_role === 'super_admin') {
            setPermissions({
              id: '',
              admin_id: user.id,
              can_view_products: true,
              can_edit_products: true,
              can_delete_products: true,
              can_view_bundles: true,
              can_edit_bundles: true,
              can_delete_bundles: true,
              can_view_flash_sales: true,
              can_edit_flash_sales: true,
              can_delete_flash_sales: true,
              can_view_orders: true,
              can_edit_orders: true,
              can_delete_orders: true,
              can_view_customers: true,
              can_edit_customers: true,
              can_delete_customers: true,
              can_view_tickets: true,
              can_edit_tickets: true,
              can_delete_tickets: true,
              can_view_premium: true,
              can_edit_premium: true,
              can_delete_premium: true,
              can_view_rewards: true,
              can_edit_rewards: true,
              can_delete_rewards: true,
              can_view_community: true,
              can_edit_community: true,
              can_delete_community: true,
              can_view_settings: true,
              can_edit_settings: true,
              can_manage_admins: true,
              created_at: '',
              updated_at: '',
            });
          } else {
            // Fetch actual permissions
            const { data: permData } = await supabase
              .from('admin_permissions')
              .select('*')
              .eq('admin_id', user.id)
              .single();

            setPermissions(permData);
          }
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (permission: keyof Omit<AdminPermissions, 'id' | 'admin_id' | 'created_at' | 'updated_at'>) => {
    if (adminRole === 'super_admin') return true;
    return permissions?.[permission] ?? false;
  };

  const isSuperAdmin = adminRole === 'super_admin';

  return {
    permissions,
    adminRole,
    isLoading,
    hasPermission,
    isSuperAdmin,
  };
}
