import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  must_change_password?: boolean;
  password_expires_at?: string;
}

export interface AdminCreateData {
  email: string;
  full_name: string;
}

export interface AdminCreateResult {
  success: boolean;
  admin: AdminUser;
  temporary_password: string;
  password_note: string;
}

export async function getAllAdmins(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .rpc('get_all_admin_users');

  if (error) {
    console.error('Error fetching admins:', error);
    return [];
  }

  return data || [];
}

export async function createAdmin(data: AdminCreateData): Promise<AdminCreateResult> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create admin');
  }

  return result;
}

export async function deleteAdmin(userId: string): Promise<{ success: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-admin-user`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to delete admin');
  }

  return result;
}

export async function toggleAdminActive(adminId: string, isActive: boolean): Promise<AdminUser> {
  const { data, error } = await supabase
    .from('admin_users')
    .update({ is_active: isActive })
    .eq('id', adminId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCurrentAdminProfile(userId: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching admin profile:', error);
    return null;
  }

  return data;
}

export async function isUserAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return data.is_active === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function ensureCurrentAdminExists(): Promise<{ exists: boolean; created: boolean; admin?: AdminUser }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { exists: false, created: false };
    }

    const existingAdmin = await getCurrentAdminProfile(user.id);

    if (existingAdmin) {
      return { exists: true, created: false, admin: existingAdmin };
    }

    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        is_active: true,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin profile:', error);
      return { exists: false, created: false };
    }

    return { exists: true, created: true, admin: newAdmin };
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
    return { exists: false, created: false };
  }
}

export async function checkMustChangePassword(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('must_change_password, password_expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    if (data.must_change_password) {
      return true;
    }

    if (data.password_expires_at) {
      const expiryDate = new Date(data.password_expires_at);
      const now = new Date();
      if (now > expiryDate) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking password change requirement:', error);
    return false;
  }
}

export async function updateAdminPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: dbError } = await supabase
      .from('admin_users')
      .update({
        must_change_password: false,
        password_expires_at: null,
        last_password_change: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Error updating admin password flags:', dbError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
