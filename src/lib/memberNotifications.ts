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
