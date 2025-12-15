import nodemailer from 'npm:nodemailer@6.9.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface InvitationRequest {
  email: string;
  fullName: string;
  invitationToken: string;
  tokenExpiresAt: string;
}

function getAdminInvitationEmail(fullName: string, email: string, invitationToken: string, tokenExpiresAt: string): string {
  const expiryDate = new Date(tokenExpiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const setupUrl = `https://cubbyhealth.com/admin-setup/${invitationToken}`;

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
                        <td style='background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 32px 40px; text-align: center;'>
                            <h1 style='margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;'>Welcome to Cubby Health</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding: 40px;'>
                            <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                Dear ${fullName},
                            </p>
                            <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                You have been invited to join the Cubby Health Admin Dashboard! To complete your account setup, please create a secure password by clicking the button below.
                            </p>
                            <div style='background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;'>
                                <p style='margin: 0; color: #1e40af; font-size: 15px; font-weight: 600;'>Your Account Information</p>
                                <table role='presentation' style='width: 100%; margin-top: 16px;'>
                                    <tr>
                                        <td style='padding: 8px 0;'>
                                            <span style='color: #1e40af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Email:</span><br>
                                            <span style='color: #1e293b; font-size: 15px; font-weight: 600; font-family: monospace;'>${email}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div style='text-align: center; margin: 32px 0;'>
                                <a href='${setupUrl}' style='display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;'>
                                    Set Up Your Password
                                </a>
                            </div>
                            <div style='background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;'>
                                <p style='margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;'>Important Security Information:</p>
                                <ul style='margin: 8px 0 0; padding-left: 20px; color: #7f1d1d; font-size: 14px; line-height: 1.6;'>
                                    <li>This invitation link will expire on <strong>${expiryDate}</strong></li>
                                    <li>You will create your own secure password during setup</li>
                                    <li>Your password must be at least 12 characters long</li>
                                    <li>If you did not expect this invitation, please contact us immediately</li>
                                </ul>
                            </div>
                            <p style='margin: 24px 0 0; color: #334155; font-size: 16px; line-height: 1.6;'>
                                If the button above doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style='margin: 8px 0 0; color: #64748b; font-size: 13px; word-break: break-all; font-family: monospace;'>
                                ${setupUrl}
                            </p>
                            <p style='margin: 24px 0 0; color: #334155; font-size: 16px; line-height: 1.6;'>
                                If you have any questions or need assistance, please don't hesitate to reach out to our team.
                            </p>
                            <p style='margin: 24px 0 0; color: #334155; font-size: 16px; line-height: 1.6;'>
                                Best regards,<br>
                                <strong>The Cubby Health Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style='background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;'>
                            <p style='margin: 0; color: #64748b; font-size: 13px;'>
                                Questions? Contact us at <a href='mailto:care@cubbyhealth.com' style='color: #0ea5e9; text-decoration: none;'>care@cubbyhealth.com</a>
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
    const requestData: InvitationRequest = await req.json();
    const { email, fullName, invitationToken, tokenExpiresAt } = requestData;

    if (!email || !fullName || !invitationToken || !tokenExpiresAt) {
      return new Response(
        JSON.stringify({ error: 'Email, full name, invitation token, and expiration date are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const emailHtml = getAdminInvitationEmail(fullName, email, invitationToken, tokenExpiresAt);

    const result = await sendEmail(
      email,
      fullName,
      'Welcome to Cubby Health Admin Dashboard',
      emailHtml
    );

    if (!result.success) {
      console.error('Failed to send admin invitation email:', result.error);
      return new Response(
        JSON.stringify({
          error: 'Failed to send invitation email',
          details: result.error,
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