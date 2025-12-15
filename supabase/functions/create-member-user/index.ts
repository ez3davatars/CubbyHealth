import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateMemberRequest {
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  auto_approve?: boolean;
  send_welcome_email?: boolean;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
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

    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !adminUser) {
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

    const requestData: CreateMemberRequest = await req.json();
    const { email, full_name, company_name, phone, auto_approve, send_welcome_email } = requestData;

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

    const { data: existingMember } = await supabaseClient
      .from('member_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'A member with this email already exists' }),
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

    const memberData: Record<string, unknown> = {
      user_id: authData.user.id,
      email,
      full_name,
      is_active: true,
      is_approved: auto_approve || false,
    };

    if (company_name) memberData.company_name = company_name;
    if (phone) memberData.phone = phone;

    if (auto_approve) {
      memberData.approved_at = new Date().toISOString();
      memberData.approved_by = adminUser.id;
    }

    const { data: member, error: memberError } = await supabaseClient
      .from('member_users')
      .insert([memberData])
      .select()
      .single();

    if (memberError) {
      console.error('Error creating member record:', memberError);
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create member record',
          details: memberError.message 
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Member created successfully',
        member,
        temporary_password: send_welcome_email ? undefined : temporaryPassword,
        password_note: send_welcome_email 
          ? 'Welcome email sent with login instructions' 
          : 'Share this temporary password with the member securely. They should change it after first login.',
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