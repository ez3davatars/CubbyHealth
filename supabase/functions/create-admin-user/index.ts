import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateAdminRequest {
  email: string;
  full_name: string;
}

function generateToken(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: memberCheck } = await supabaseClient
      .from('member_users')
      .select('is_admin')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    if (memberCheck && !memberCheck.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Only admin users can create new admins' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const requestData: CreateAdminRequest = await req.json();
    const { email, full_name } = requestData;

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email and full name are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: existingAdmin } = await supabaseClient
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'An admin with this email already exists' }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: existingMember } = await supabaseClient
      .from('member_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'This email is already registered as a member. Cannot create admin account.' }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const randomPassword = generateToken();

    const { data: authData, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
    });

    if (createUserError || !authData.user) {
      console.error('Error creating auth user:', createUserError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create user account',
          details: createUserError?.message
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

    const { data: admin, error: adminError } = await supabaseClient
      .from('admin_users')
      .insert([{
        user_id: authData.user.id,
        email,
        full_name,
        is_active: true,
        created_by: requestingUser.id,
        must_change_password: true,
        password_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }])
      .select()
      .single();

    if (adminError) {
      console.error('Error creating admin record:', adminError);
      await supabaseClient.auth.admin.deleteUser(authData.user.id);

      return new Response(
        JSON.stringify({
          error: 'Failed to create admin record',
          details: adminError.message
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

    const invitationToken = generateToken();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: tokenError } = await supabaseClient
      .from('admin_invitation_tokens')
      .insert([{
        admin_user_id: admin.id,
        token: invitationToken,
        expires_at: tokenExpiresAt.toISOString(),
        used: false,
      }]);

    if (tokenError) {
      console.error('Error creating invitation token:', tokenError);
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      await supabaseClient.from('admin_users').delete().eq('id', admin.id);

      return new Response(
        JSON.stringify({
          error: 'Failed to create invitation token',
          details: tokenError.message
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

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://cubbyhealth.com';
    const setupLink = `${frontendUrl}/admin-setup?token=${invitationToken}`;

    let emailSent = false;
    let emailError = undefined;

    try {
      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-admin-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            full_name,
            setup_link: setupLink,
            token_expires_at: tokenExpiresAt.toISOString(),
          }),
        }
      );

      if (emailResponse.ok) {
        emailSent = true;
      } else {
        const emailResult = await emailResponse.json();
        emailError = emailResult.error || 'Failed to send invitation email';
      }
    } catch (error) {
      console.error('Error sending email:', error);
      emailError = 'Failed to send invitation email';
    }

    return new Response(
      JSON.stringify({
        success: true,
        admin,
        invitation_token: invitationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        email_sent: emailSent,
        email_error: emailError,
        setup_link: setupLink,
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