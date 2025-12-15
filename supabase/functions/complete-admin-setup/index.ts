import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CompleteSetupRequest {
  token: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: CompleteSetupRequest = await req.json();
    const { token, password } = requestData;

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token and password are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (password.length < 12) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 12 characters long' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: invitationToken, error: tokenError } = await supabaseClient
      .from('admin_invitation_tokens')
      .select('*, admin_users!inner(user_id, email, full_name)')
      .eq('token', token)
      .eq('used', false)
      .maybeSingle();

    if (tokenError || !invitationToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid invitation token' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(invitationToken.expires_at);

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Invitation token has expired' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const adminUser = invitationToken.admin_users;

    const { error: updatePasswordError } = await supabaseClient.auth.admin.updateUserById(
      adminUser.user_id,
      { password }
    );

    if (updatePasswordError) {
      console.error('Error updating password:', updatePasswordError);
      return new Response(
        JSON.stringify({
          error: 'Failed to set password',
          details: updatePasswordError.message
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { error: updateAdminError } = await supabaseClient
      .from('admin_users')
      .update({
        must_change_password: false,
        password_expires_at: null,
        last_password_change: new Date().toISOString(),
      })
      .eq('user_id', adminUser.user_id);

    if (updateAdminError) {
      console.error('Error updating admin record:', updateAdminError);
    }

    const { error: markTokenUsedError } = await supabaseClient
      .from('admin_invitation_tokens')
      .update({ used: true })
      .eq('id', invitationToken.id);

    if (markTokenUsedError) {
      console.error('Error marking token as used:', markTokenUsedError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password set successfully. You can now log in with your credentials.',
        email: adminUser.email,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
