import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import nodemailer from 'npm:nodemailer@6.9.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ApprovalRequest {
  memberId: string;
}

function getApprovalEmail(fullName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f8fafc;'>
    <table role='presentation' style='width: 100%; border-collapse: collapse;'>
        <tr>
            <td style='padding: 40px 20px;'>
                <table role='presentation' style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;'>
                    <tr>
                        <td style='background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;'>
                            <div style='font-size: 48px; margin-bottom: 8px;'>&#10003;</div>
                            <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;'>Account Approved!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding: 40px;'>
                            <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                Dear ${fullName},
                            </p>
                            <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                Great news! Your Cubby Health member account has been approved. You now have full access to our exclusive vendor portal and special member pricing.
                            </p>
                            <div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;'>
                                <p style='margin: 0 0 16px; color: #166534; font-size: 15px; font-weight: 600;'>Ready to get started?</p>
                                <a href='https://cubbyhealth.com/member-login' style='display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;'>
                                    Access Member Portal
                                </a>
                            </div>
                            <p style='margin: 0 0 16px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                <strong>What you can do now:</strong>
                            </p>
                            <ul style='margin: 0 0 24px; padding-left: 24px; color: #334155; font-size: 15px; line-height: 1.8;'>
                                <li>Browse our curated list of preferred vendors</li>
                                <li>Access exclusive member discounts and pricing</li>
                                <li>Connect directly with trusted healthcare partners</li>
                            </ul>
                            <p style='margin: 24px 0 0; color: #334155; font-size: 16px; line-height: 1.6;'>
                                Welcome to the Cubby Health family!<br>
                                <strong>The Cubby Health Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style='background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;'>
                            <p style='margin: 0; color: #64748b; font-size: 13px;'>
                                Need help? Contact us at <a href='mailto:care@cubbyhealth.com' style='color: #0ea5e9; text-decoration: none;'>care@cubbyhealth.com</a>
                            </p>
                            <p style='margin: 12px 0 0; color: #94a3b8; font-size: 12px;'>
                                &copy; ${new Date().getFullYear()} Cubby Health. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/td>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpHost = Deno.env.get('SMTP_HOST') || 'mail.supremecluster.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER') || 'customercare@cubbyhealth.com';
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'customercare@cubbyhealth.com';
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME') || 'Customer Care';

    if (!smtpPassword) {
      throw new Error('SMTP password not configured');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `${smtpFromName} <${smtpFromEmail}>`,
      to: `${toName} <${to}>`,
      subject: subject,
      text: stripHtml(htmlBody),
      html: htmlBody,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
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
      .select('id')
      .eq('user_id', requestingUser.id)
      .eq('is_active', true)
      .maybeSingle();

    const { data: memberAdminCheck } = await supabaseClient
      .from('member_users')
      .select('is_admin')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    const isAdmin = adminCheck || (memberAdminCheck && memberAdminCheck.is_admin);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admin users can send approval emails' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const requestData: ApprovalRequest = await req.json();
    const { memberId } = requestData;

    if (!memberId) {
      return new Response(
        JSON.stringify({ error: 'Member ID is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: member, error: memberError } = await supabaseClient
      .from('member_users')
      .select('id, email, full_name, user_id')
      .eq('id', memberId)
      .maybeSingle();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const approvalEmailHtml = getApprovalEmail(member.full_name);

    const emailResult = await sendEmail(
      member.email,
      member.full_name,
      'Your Cubby Health Account Has Been Approved!',
      approvalEmailHtml
    );

    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error);
      return new Response(
        JSON.stringify({
          error: 'Failed to send approval email',
          details: emailResult.error || 'Unknown error'
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
        message: 'Approval email sent successfully',
        member: {
          id: member.id,
          email: member.email,
          full_name: member.full_name,
        },
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