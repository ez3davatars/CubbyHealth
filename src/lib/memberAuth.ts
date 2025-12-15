import { supabase } from './supabase';

export interface MemberUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  is_approved: boolean;
  approved_at?: string;
  approved_by?: string;
  is_active: boolean;
  created_at: string;
}

export async function checkEmailExists(email: string): Promise<{ exists: boolean; hasProfile: boolean }> {
  const { data: members } = await supabase
    .from('member_users')
    .select('id, user_id')
    .limit(1);

  if (!members || members.length === 0) {
    return { exists: false, hasProfile: false };
  }

  const { data: existingUser } = await supabase
    .from('member_users')
    .select('id, is_active, is_approved')
    .eq('user_id', email)
    .maybeSingle();

  return {
    exists: !!existingUser,
    hasProfile: !!existingUser
  };
}

export async function registerMember(
  email: string,
  password: string,
  fullName: string,
  companyName?: string,
  phone?: string
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
      const { data: { user: existingAuthUser } } = await supabase.auth.getUser();

      if (existingAuthUser) {
        const existingMember = await getMemberProfile(existingAuthUser.id);
        if (existingMember) {
          throw new Error('This email is already registered. Please sign in or reset your password if you forgot it.');
        }

        const { data: memberData, error: memberError } = await supabase
          .from('member_users')
          .insert([
            {
              user_id: existingAuthUser.id,
              email: email,
              full_name: fullName,
              company_name: companyName,
              phone: phone,
              is_approved: false,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (memberError) {
          console.error('Error creating member record for existing user:', memberError);
          throw new Error('Failed to create member profile. Please contact support.');
        }

        return { user: existingAuthUser, member: memberData };
      }

      throw new Error('This email is already registered. Please contact support at support@cubbyhealth.com if you need assistance.');
    }
    throw authError;
  }

  if (!authData.user) throw new Error('Failed to create user account');

  const existingMember = await getMemberProfile(authData.user.id);
  if (existingMember) {
    return { user: authData.user, member: existingMember };
  }

  const { data: memberData, error: memberError } = await supabase
    .from('member_users')
    .insert([
      {
        user_id: authData.user.id,
        email: email,
        full_name: fullName,
        company_name: companyName,
        phone: phone,
        is_approved: false,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (memberError) {
    console.error('Error creating member record:', memberError);
    throw new Error('Failed to create member profile. Please contact support.');
  }

  return { user: authData.user, member: memberData };
}

export async function getMemberProfile(userId: string): Promise<MemberUser | null> {
  const { data, error } = await supabase
    .from('member_users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching member profile:', error);
    return null;
  }

  return data;
}

export async function createMemberSession(memberUserId: string, ipAddress: string, userAgent: string) {
  const { error } = await supabase
    .from('member_sessions')
    .insert([
      {
        member_user_id: memberUserId,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    ]);

  if (error) {
    console.error('Error creating member session:', error);
  }
}

export async function updateMemberProfile(
  userId: string,
  updates: {
    full_name?: string;
    company_name?: string;
    phone?: string;
  }
) {
  const { data, error } = await supabase
    .from('member_users')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllMembers(): Promise<MemberUser[]> {
  const { data, error } = await supabase
    .from('member_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  return data || [];
}

export async function approveMember(memberId: string, adminUserId: string) {
  const { data, error } = await supabase
    .from('member_users')
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleMemberActive(memberId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('member_users')
    .update({ is_active: isActive })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMemberClickActivity(memberId: string) {
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select(`
      id,
      clicked_at,
      ip_address,
      session_id,
      user_agent,
      partner_companies!affiliate_clicks_company_id_fkey (
        name,
        category
      )
    `)
    .eq('member_user_id', memberId)
    .order('clicked_at', { ascending: false });

  if (error) {
    console.error('Error fetching member click activity:', error);
    return [];
  }

  return data || [];
}

export async function getAllMemberClickActivity() {
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select(`
      id,
      clicked_at,
      ip_address,
      session_id,
      user_agent,
      company_id,
      member_user_id,
      partner_companies!affiliate_clicks_company_id_fkey (
        name,
        category
      ),
      member_users!affiliate_clicks_member_user_id_fkey (
        full_name,
        company_name
      )
    `)
    .not('member_user_id', 'is', null)
    .order('clicked_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching all member click activity:', error);
    return [];
  }

  return data || [];
}

export async function deleteMember(memberId: string, userId: string) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    console.error('deleteMember: No active session or access token');
    throw new Error('Not authenticated');
  }

  console.log('deleteMember: Calling edge function with:', { memberId, userId });

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-member-user`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: memberId,
          user_id: userId,
        }),
      }
    );

    console.log('deleteMember: Response status:', response.status);

    let result;
    try {
      result = await response.json();
      console.log('deleteMember: Response body:', result);
    } catch (jsonError) {
      console.error('deleteMember: Failed to parse response as JSON:', jsonError);
      const text = await response.text();
      console.error('deleteMember: Response text:', text);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      console.error('deleteMember: Request failed with status', response.status);
      console.error('deleteMember: Error details:', result);

      const errorMessage = result.error || result.details || 'Failed to delete member';
      throw new Error(errorMessage);
    }

    console.log('deleteMember: Successfully deleted member');
    return result;
  } catch (error) {
    console.error('deleteMember: Exception caught:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while deleting the member');
  }
}

export interface AdminCreateMemberData {
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  auto_approve?: boolean;
}

export interface AdminCreateMemberResult {
  success: boolean;
  member: MemberUser;
  temporary_password?: string;
  password_note: string;
}

export async function adminCreateMember(data: AdminCreateMemberData): Promise<AdminCreateMemberResult> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-member-user`,
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
    throw new Error(result.error || 'Failed to create member');
  }

  return result;
}

export async function bulkApprovePending(adminUserId: string): Promise<number> {
  const { data, error } = await supabase
    .from('member_users')
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
    })
    .eq('is_approved', false)
    .select();

  if (error) throw error;
  return data?.length || 0;
}
