import { supabase } from '@/lib/supabase';

export async function createAdminUser() {
  try {
    const { data, error } = await supabase.functions.invoke('supabase-functions-create-admin', {
      body: {},
    });

    if (error) {
      console.error('Error creating admin:', error);
      return { success: false, error: error.message };
    }

    console.log('Admin created:', data);
    return { success: true, data };
  } catch (err: unknown) {
    console.error('Exception creating admin:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
