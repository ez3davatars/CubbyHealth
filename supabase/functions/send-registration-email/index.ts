import nodemailer from 'npm:nodemailer@6.9.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RegistrationRequest {
  email: string;
  fullName: string;
  companyName?: string;
  phone?: string;
}

function getMemberWelcomeEmail(fullName: string): string {
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
                                Thank you for registering for the Cubby Health Member Portal! We're excited to have you join our community of healthcare practices.
                            </p>
                            <div style='background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;'>
                                <p style='margin: 0; color: #0369a1; font-size: 15px; font-weight: 600;'>What happens next?</p>
                                <p style='margin: 10px 0 0; color: #334155; font-size: 14px; line-height: 1.6;'>
                                    Our team will review your registration and verify your information. Once approved, you'll receive another email with instructions to access our exclusive vendor portal and special member pricing.
                                </p>
                            </div>
                            <p style='margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                The approval process typically takes 1-2 business days. If you have any questions in the meantime, please don't hesitate to reach out to us.
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

function getAdminNotificationEmail(fullName: string, email: string, companyName?: string, phone?: string): string {
  const companyInfo = companyName || 'Not provided';
  const phoneInfo = phone || 'Not provided';

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
                        <td style='background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 40px; text-align: center;'>
                            <h1 style='margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;'>New Member Registration</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding: 40px;'>
                            <p style='margin: 0 0 24px; color: #334155; font-size: 16px; line-height: 1.6;'>
                                A new member has registered and is awaiting approval:
                            </p>
                            <table role='presentation' style='width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; overflow: hidden;'>
                                <tr>
                                    <td style='padding: 16px 20px; border-bottom: 1px solid #e2e8f0;'>
                                        <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Full Name</span><br>
                                        <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>${fullName}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 16px 20px; border-bottom: 1px solid #e2e8f0;'>
                                        <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Email</span><br>
                                        <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>${email}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 16px 20px; border-bottom: 1px solid #e2e8f0;'>
                                        <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Company</span><br>
                                        <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>${companyInfo}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 16px 20px;'>
                                        <span style='color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;'>Phone</span><br>
                                        <span style='color: #1e293b; font-size: 16px; font-weight: 600;'>${phoneInfo}</span>
                                    </td>
                                </tr>
                            </table>
                            <div style='text-align: center; margin-top: 32px;'>
                                <a href='https://cubbyhealth.com/admin' style='display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;'>
                                    Review in Admin Panel
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style='background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;'>
                            <p style='margin: 0; color: #94a3b8; font-size: 12px;'>
                                This is an automated notification from Cubby Health
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
    const requestData: RegistrationRequest = await req.json();
    const { email, fullName, companyName, phone } = requestData;

    if (!email || !fullName) {
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

    const memberEmailHtml = getMemberWelcomeEmail(fullName);
    const adminEmailHtml = getAdminNotificationEmail(fullName, email, companyName, phone);

    const [memberResult, adminResult] = await Promise.allSettled([
      sendEmail(
        email,
        fullName,
        'Welcome to Cubby Health - Registration Received',
        memberEmailHtml
      ),
      sendEmail(
        'customercare@cubbyhealth.com',
        'Cubby Health Admin',
        `New Member Registration - ${fullName}`,
        adminEmailHtml
      ),
    ]);

    const results = {
      memberEmail: { success: false, error: '' },
      adminEmail: { success: false, error: '' },
    };

    if (memberResult.status === 'fulfilled') {
      results.memberEmail.success = memberResult.value.success;
      results.memberEmail.error = memberResult.value.error || '';
    } else {
      results.memberEmail.error = memberResult.reason?.message || 'Failed to send member email';
    }

    if (adminResult.status === 'fulfilled') {
      results.adminEmail.success = adminResult.value.success;
      results.adminEmail.error = adminResult.value.error || '';
    } else {
      results.adminEmail.error = adminResult.reason?.message || 'Failed to send admin email';
    }

    const overallSuccess = results.memberEmail.success || results.adminEmail.success;

    if (!overallSuccess) {
      console.error('Both email notifications failed:', results);
      return new Response(
        JSON.stringify({
          error: 'Failed to send registration emails',
          details: results,
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
        message: 'Registration emails sent',
        results,
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