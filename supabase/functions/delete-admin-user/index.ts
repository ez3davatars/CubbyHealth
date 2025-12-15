import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DeleteAdminRequest {
  admin_id?: string;
  user_id?: string;
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

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user: requestingUser }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !requestingUser) {
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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: requestingAdmin, error: adminCheckError } = await adminClient
      .from('admin_users')
      .select('id, is_active, full_name')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    if (adminCheckError || !requestingAdmin || !requestingAdmin.is_active) {
      return new Response(
        JSON.stringify({ error: 'Admin authorization required' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let targetUserId = requestingUser.id;
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.text();
      if (body && body.trim()) {
        const requestData: DeleteAdminRequest = JSON.parse(body);
        if (requestData.user_id) {
          targetUserId = requestData.user_id;
        }
      }
    }

    const { data: targetMemberRecord } = await adminClient
      .from('member_users')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const hasMemberAccount = !!targetMemberRecord;

    const { data: targetAdminRecord } = await adminClient
      .from('admin_users')
      .select('id, full_name, email')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetAdminRecord) {
      return new Response(
        JSON.stringify({ error: 'Admin not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { error: adminDeleteError } = await adminClient
      .from('admin_users')
      .delete()
      .eq('user_id', targetUserId);

    if (adminDeleteError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to delete admin record',
          details: adminDeleteError.message
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

    if (!hasMemberAccount) {
      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(targetUserId, false);

      if (authDeleteError) {
        return new Response(
          JSON.stringify({
            error: 'Failed to delete auth user',
            details: authDeleteError.message
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
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: hasMemberAccount
          ? `Successfully removed admin privileges for ${targetAdminRecord.full_name}`
          : `Successfully deleted admin account for ${targetAdminRecord.full_name}`,
        deleted_admin: {
          email: targetAdminRecord.email,
          full_name: targetAdminRecord.full_name
        },
        member_account_preserved: hasMemberAccount
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