import nodemailer from 'npm:nodemailer@6.9.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface InvitationRequest {
  email: string;
  full_name: string;
  setup_link: string;
  token_expires_at: string;
}

function getInvitationEmail(fullName: string, setupLink: string, expiresAt: string): string {
  const expirationDate = new Date(expiresAt);
  const formattedDate = expirationDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
                        <td style='background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 32px 40px; text-align: center;'>
                            <div style='font-size: 48px; margin-bottom: 8px;'>🔐</div>
                            <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;'>Admin Invitation</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding: 40px;'>
                            <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                Dear ${fullName},
                            </p>
                            <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                You've been invited to join the Cubby Health admin team! You now have access to the administrative dashboard to manage the platform.
                            </p>
                            <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 24px; margin: 24px 0; border-radius: 12px;'>
                                <p style='margin: 0 0 16px; color: #1e40af; font-size: 15px; font-weight: 600; text-align: center;'>Complete Your Setup</p>
                                <p style='margin: 0 0 16px; color: #334155; font-size: 14px; text-align: center;'>Click the button below to set your password and activate your admin account.</p>
                                <div style='text-align: center;'>
                                    <a href='${setupLink}' style='display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;'>
                                        Set Up Your Account
                                    </a>
                                </div>
                            </div>
                            <p style='margin: 0 0 16px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                <strong>Important Information:</strong>
                            </p>
                            <ul style='margin: 0 0 24px; padding-left: 24px; color: #334155; font-size: 15px; line-height: 1.8;'>
                                <li>This invitation link expires on <strong>${formattedDate}</strong></li>
                                <li>You must set your password before the link expires</li>
                                <li>After setting your password, you can sign in at the admin portal</li>
                                <li>Keep your credentials secure and do not share them</li>
                            </ul>
                            <div style='background-color: #fef3c7; border: 1px solid #fde047; padding: 16px; margin: 24px 0; border-radius: 8px;'>
                                <p style='margin: 0; color: #92400e; font-size: 13px;'>
                                    <strong>Security Note:</strong> If you didn't expect this invitation or believe it was sent in error, please ignore this email and contact the admin team.
                                </p>
                            </div>
                            <p style='margin: 24px 0 0; color: #334155; font-size: 16px; line-height: 1.6;'>
                                Welcome to the team!<br>
                                <strong>The Cubby Health Admin Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style='background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;'>
                            <p style='margin: 0 0 8px; color: #64748b; font-size: 13px;'>
                                Having trouble with the button? Copy and paste this link into your browser:
                            </p>
                            <p style='margin: 0 0 16px; color: #0ea5e9; font-size: 12px; word-break: break-all;'>
                                ${setupLink}
                            </p>
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
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME') || 'Cubby Health Admin';

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
    const requestData: InvitationRequest = await req.json();
    const { email, full_name, setup_link, token_expires_at } = requestData;

    if (!email || !full_name || !setup_link || !token_expires_at) {
      return new Response(
        JSON.stringify({ error: 'Email, full name, setup link, and expiration date are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const invitationEmailHtml = getInvitationEmail(full_name, setup_link, token_expires_at);

    const emailResult = await sendEmail(
      email,
      full_name,
      'Admin Invitation - Set Up Your Cubby Health Account',
      invitationEmailHtml
    );

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      return new Response(
        JSON.stringify({
          error: 'Failed to send invitation email',
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
        message: 'Invitation email sent successfully',
        email,
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