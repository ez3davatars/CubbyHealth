import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface InvitationRequest {
  admin_user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError || !adminUser || !adminUser.is_active) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin privileges required' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const requestData: InvitationRequest = await req.json();
    const { admin_user_id } = requestData;

    if (!admin_user_id) {
      return new Response(
        JSON.stringify({ error: 'admin_user_id is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: invitationToken, error: tokenError } = await supabase
      .from('admin_invitation_tokens')
      .select(`
        id,
        token,
        expires_at,
        used,
        created_at,
        admin_users!inner(id, email, full_name)
      `)
      .eq('admin_user_id', admin_user_id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (tokenError) {
      console.error('Error fetching invitation token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch invitation token' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!invitationToken) {
      return new Response(
        JSON.stringify({
          has_token: false,
          message: 'No valid invitation token found for this admin',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const frontendUrl = Deno.env.get('FRONTEND_URL') || supabaseUrl.replace(/\.supabase\.co$/, '.vercel.app');
    const setupLink = `${frontendUrl}/admin-setup?token=${invitationToken.token}`;

    return new Response(
      JSON.stringify({
        has_token: true,
        token: invitationToken.token,
        setup_link: setupLink,
        expires_at: invitationToken.expires_at,
        created_at: invitationToken.created_at,
        admin_email: invitationToken.admin_users.email,
        admin_name: invitationToken.admin_users.full_name,
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
        details: error instanceof Error ? error.message : 'Unknown error',
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