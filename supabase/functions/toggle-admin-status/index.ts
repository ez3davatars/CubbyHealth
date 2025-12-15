import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ToggleStatusRequest {
  admin_id: string;
  is_active: boolean;
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
        JSON.stringify({ error: 'Only active admin users can toggle admin status' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const requestData: ToggleStatusRequest = await req.json();
    const { admin_id, is_active } = requestData;

    if (!admin_id || typeof is_active !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Admin ID and is_active status are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: targetAdmin } = await supabaseClient
      .from('admin_users')
      .select('user_id')
      .eq('id', admin_id)
      .maybeSingle();

    if (!targetAdmin) {
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

    if (targetAdmin.user_id === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot change your own active status' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { error: updateError } = await supabaseClient
      .from('admin_users')
      .update({ is_active })
      .eq('id', admin_id);

    if (updateError) {
      console.error('Error updating admin status:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update admin status',
          details: updateError.message
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
        message: `Admin status updated to ${is_active ? 'active' : 'inactive'}`,
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
