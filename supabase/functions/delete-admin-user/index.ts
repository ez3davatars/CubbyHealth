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

    console.log('[DELETE-ADMIN] Authenticating user...');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      console.error('[DELETE-ADMIN] Authentication failed:', authError);
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

    console.log(`[DELETE-ADMIN] User authenticated: ${requestingUser.email} (${requestingUser.id})`);
    console.log('[DELETE-ADMIN] Checking admin authorization...');

    const { data: requestingAdmin, error: adminCheckError } = await supabaseClient
      .from('admin_users')
      .select('id, is_active, full_name')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    if (adminCheckError || !requestingAdmin) {
      console.error('[DELETE-ADMIN] Admin check failed:', adminCheckError);
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

    console.log(`[DELETE-ADMIN] Admin verified: ${requestingAdmin.full_name} (active: ${requestingAdmin.is_active})`);

    if (!requestingAdmin.is_active) {
      console.error('[DELETE-ADMIN] Admin account is inactive');
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

    const { data: targetMemberRecord } = await supabaseClient
      .from('member_users')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const hasMemberAccount = !!targetMemberRecord;

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

    console.log(`[DELETE-ADMIN] Starting deletion process`);
    console.log(`[DELETE-ADMIN] Target: ${targetAdminRecord.email} (${targetUserId})`);
    console.log(`[DELETE-ADMIN] Requested by: ${requestingAdmin.full_name} (${requestingUser.id})`);
    console.log(`[DELETE-ADMIN] Self deletion: ${isSelfDeletion}`);
    console.log(`[DELETE-ADMIN] Has member account: ${hasMemberAccount}`);

    console.log(`[DELETE-ADMIN] Step 1: Deleting admin_users record...`);
    const { error: adminDeleteError, count } = await supabaseClient
      .from('admin_users')
      .delete({ count: 'exact' })
      .eq('user_id', targetUserId);

    if (adminDeleteError) {
      console.error('[DELETE-ADMIN] Error deleting admin record:', {
        message: adminDeleteError.message,
        details: adminDeleteError.details,
        hint: adminDeleteError.hint,
        code: adminDeleteError.code
      });
      return new Response(
        JSON.stringify({
          error: 'Failed to delete admin record',
          details: adminDeleteError.message,
          hint: adminDeleteError.hint,
          code: adminDeleteError.code
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

    console.log(`[DELETE-ADMIN] Step 1 complete: Deleted ${count} admin records`);

    if (!hasMemberAccount) {
      console.log(`[DELETE-ADMIN] Step 2: Deleting auth user (no member account)...`);
      const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(targetUserId, false);

      if (authDeleteError) {
        console.error('[DELETE-ADMIN] Error deleting auth user:', {
          message: authDeleteError.message,
          status: authDeleteError.status,
          name: authDeleteError.name
        });
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
      console.log(`[DELETE-ADMIN] Step 2 complete: Auth user deleted`);
      console.log(`[DELETE-ADMIN] SUCCESS: Fully deleted admin account: ${targetAdminRecord.email}`);
    } else {
      console.log(`[DELETE-ADMIN] Step 2: Skipping auth user deletion (member account exists)`);
      console.log(`[DELETE-ADMIN] SUCCESS: Removed admin privileges (kept member account): ${targetAdminRecord.email}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: hasMemberAccount
          ? (isSelfDeletion ? 'Your admin privileges have been removed' : `Successfully removed admin privileges for ${targetAdminRecord.full_name}`)
          : (isSelfDeletion ? 'Your admin account has been deleted' : `Successfully deleted admin account for ${targetAdminRecord.full_name}`),
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