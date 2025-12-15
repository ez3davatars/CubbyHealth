import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export interface AdminCreateData {
  email: string;
  full_name: string;
}

export interface AdminCreateResult {
  success: boolean;
  admin: AdminUser;
  invitation_token: string;
  token_expires_at: string;
  email_sent: boolean;
  email_error?: string;
  setup_link: string;
}

export interface AdminInvitationDetails {
  has_token: boolean;
  token?: string;
  setup_link?: string;
  expires_at?: string;
  created_at?: string;
  admin_email?: string;
  admin_name?: string;
  message?: string;
}

export async function getAllAdmins(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });

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

export async function getAdminInvitationLink(adminUserId: string): Promise<AdminInvitationDetails> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-invitation`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ admin_user_id: adminUserId }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to get invitation link');
  }

  return result;
}

export interface RegenerateInvitationResult {
  success: boolean;
  token: string;
  setup_link: string;
  expires_at: string;
  email_sent: boolean;
  email_error?: string;
}

export async function regenerateAdminInvitation(adminUserId: string, sendEmail: boolean = false): Promise<RegenerateInvitationResult> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-admin-invitation`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        admin_user_id: adminUserId,
        send_email: sendEmail
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to regenerate invitation link');
  }

  return result;
}
