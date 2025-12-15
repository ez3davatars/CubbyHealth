type NotificationType = 'registration_user' | 'registration_admin' | 'approval';

interface NotificationData {
  type: NotificationType;
  email: string;
  fullName: string;
  companyName?: string;
  phone?: string;
}

export async function sendMemberNotification(data: NotificationData): Promise<boolean> {
  try {
    const response = await fetch('/send-member-notification.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Failed to send member notification:', error);
    return false;
  }
}

export async function sendRegistrationNotifications(
  email: string,
  fullName: string,
  companyName?: string,
  phone?: string
): Promise<void> {
  await Promise.all([
    sendMemberNotification({
      type: 'registration_user',
      email,
      fullName,
      companyName,
      phone,
    }),
    sendMemberNotification({
      type: 'registration_admin',
      email,
      fullName,
      companyName,
      phone,
    }),
  ]);
}

export async function sendApprovalNotification(
  email: string,
  fullName: string
): Promise<boolean> {
  return sendMemberNotification({
    type: 'approval',
    email,
    fullName,
  });
}

export async function sendRegistrationEmailViaSupabase(
  email: string,
  fullName: string,
  companyName?: string,
  phone?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-registration-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        fullName,
        companyName,
        phone,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to send registration emails' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send registration email via Edge Function:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendApprovalEmailViaSupabase(
  memberId: string,
  authToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-approval-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to send approval email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send approval email via Edge Function:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
