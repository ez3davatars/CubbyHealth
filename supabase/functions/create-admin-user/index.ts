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

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendInvitationEmail(
  email: string,
  fullName: string,
  temporaryPassword: string,
  passwordExpiresAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-admin-invitation-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email,
          fullName,
          temporaryPassword,
          passwordExpiresAt,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send invitation email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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

    const { data: adminCheck } = await supabaseClient
      .from('admin_users')
      .select('is_active')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    if (!adminCheck || !adminCheck.is_active) {
      return new Response(
        JSON.stringify({ error: 'Only active admin users can create new admins' }),
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

    const temporaryPassword = generatePassword();
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 7);

    const { data: authData, error: createUserError } = await supabaseClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
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
        password_expires_at: passwordExpiresAt.toISOString(),
        must_change_password: true,
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

    const emailResult = await sendInvitationEmail(
      email,
      full_name,
      temporaryPassword,
      passwordExpiresAt.toISOString()
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin created successfully',
        admin,
        temporary_password: temporaryPassword,
        password_expires_at: passwordExpiresAt.toISOString(),
        email_sent: emailResult.success,
        email_error: emailResult.error,
        password_note: 'Share this temporary password with the admin securely. They must change it after first login. An invitation email has been sent.',
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