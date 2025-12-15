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
      .select('id')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    if (memberCheck) {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete admin account through member account. Please use member account deletion instead.'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: requestingAdmin, error: adminCheckError } = await supabaseClient
      .from('admin_users')
      .select('id, is_active, full_name')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    if (adminCheckError || !requestingAdmin) {
      return new Response(
        JSON.stringify({
          error: 'Admin authorization required',
          details: 'You must be an admin to perform this action'
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!requestingAdmin.is_active) {
      return new Response(
        JSON.stringify({
          error: 'Account inactive',
          details: 'Your admin account is not active'
        }),
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
    let isSelfDeletion = true;

    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.text();
      if (body && body.trim()) {
        const requestData: DeleteAdminRequest = JSON.parse(body);
        if (requestData.user_id) {
          targetUserId = requestData.user_id;
          isSelfDeletion = targetUserId === requestingUser.id;
        }
      }
    }

    if (!isSelfDeletion) {
      const { data: targetMemberCheck } = await supabaseClient
        .from('member_users')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (targetMemberCheck) {
        return new Response(
          JSON.stringify({
            error: 'Target user is a member, not an admin. Use member deletion instead.'
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    const { data: targetAdminRecord, error: targetAdminError } = await supabaseClient
      .from('admin_users')
      .select('id, full_name, email')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (targetAdminError) {
      console.error('Error checking target admin:', targetAdminError);
      return new Response(
        JSON.stringify({
          error: 'Database error',
          details: 'Failed to verify target admin account'
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

    if (!targetAdminRecord) {
      return new Response(
        JSON.stringify({
          error: 'Admin not found',
          details: 'The specified admin account does not exist'
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Deleting admin account: ${targetAdminRecord.email} (${targetUserId})`);
    console.log(`Requested by: ${requestingAdmin.full_name} (${requestingUser.id})`);
    console.log(`Self deletion: ${isSelfDeletion}`);

    const { error: adminDeleteError } = await supabaseClient
      .from('admin_users')
      .delete()
      .eq('user_id', targetUserId);

    if (adminDeleteError) {
      console.error('Error deleting admin record:', adminDeleteError);
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

    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(targetUserId, false);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete admin account from authentication system',
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

    console.log(`Successfully deleted admin account: ${targetAdminRecord.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: isSelfDeletion ? 'Your admin account has been deleted' : `Successfully deleted admin account for ${targetAdminRecord.full_name}`,
        deleted_admin: {
          email: targetAdminRecord.email,
          full_name: targetAdminRecord.full_name
        }
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