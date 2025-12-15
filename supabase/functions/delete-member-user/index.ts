import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DeleteMemberRequest {
  member_id: string;
  user_id: string;
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

    const requestData: DeleteMemberRequest = await req.json();
    const { member_id, user_id } = requestData;

    if (!member_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing member_id or user_id' }),
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
      .select('id')
      .eq('id', member_id)
      .maybeSingle();

    const { data: { user: existingAuthUser } } = await supabaseClient.auth.admin.getUserById(user_id);

    if (!existingMember && !existingAuthUser) {
      return new Response(
        JSON.stringify({
          error: 'Member not found',
          details: 'Neither the member record nor the auth user exists'
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

    let memberDeleted = false;
    let authDeleted = false;
    const warnings = [];

    if (existingMember) {
      const { error: memberDeleteError } = await supabaseClient
        .from('member_users')
        .delete()
        .eq('id', member_id);

      if (memberDeleteError) {
        console.error('Error deleting member record:', memberDeleteError);
        return new Response(
          JSON.stringify({
            error: 'Failed to delete member record',
            details: memberDeleteError.message
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
      memberDeleted = true;
    } else {
      warnings.push('Member record was already deleted from the database');
    }

    if (existingAuthUser) {
      const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(user_id, false);

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);

        if (memberDeleted) {
          return new Response(
            JSON.stringify({
              error: 'Partial deletion: Member record deleted but auth user deletion failed',
              details: authDeleteError.message,
              memberDeleted: true,
              authDeleted: false
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
      authDeleted = true;
    } else {
      warnings.push('Auth user was already deleted from Supabase');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Member successfully deleted',
        memberDeleted,
        authDeleted,
        warnings: warnings.length > 0 ? warnings : undefined
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