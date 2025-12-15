import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  practice: string;
  visitorType: string;
  message: string;
  _gotcha?: string;
  a?: number;
  b?: number;
  answer?: number;
}

function generateTicketId(): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(2)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `CH-${yy}${mm}${dd}-${randomHex}`;
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function nl2br(str: string): string {
  return htmlEscape(str).replace(/\n/g, '<br>');
}

function buildAdminEmail(data: ContactFormData, ticketId: string, timestamp: string, ip: string, referer: string): string {
  const brand = {
    bg: '#F3F8FF',
    card: '#FFFFFF',
    border: '#E6EEF8',
    text: '#0F2747',
    muted: '#5E728C',
    primary: '#2A7FD1',
    primary2: '#61B5FF',
  };

  const siteUrl = 'https://cubbyhealth.com';
  const logoUrl = 'https://cubbyhealth.com/CubbyHealthWhite.png';

  return `
  <div style="margin:0;padding:24px;background:${brand.bg};font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;color:${brand.text}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:${brand.card};border-radius:16px;overflow:hidden;border:1px solid ${brand.border};box-shadow:0 6px 24px rgba(20,60,120,0.08)">
      <tr><td style="padding:0">
        <div style="background:linear-gradient(90deg, ${brand.primary} 0%, ${brand.primary2} 100%);padding:16px 24px;color:#fff;font-weight:700;letter-spacing:.5px;font-size:18px;text-align:center;">
          <a href="${htmlEscape(siteUrl)}" style="display:inline-flex;align-items:center;gap:10px;color:#fff;text-decoration:none;">
            <img src="${htmlEscape(logoUrl)}" alt="Cubby Health" style="height:40px;width:auto;border:none;outline:none;">
            <span style="font-size:20px;font-weight:600;">New Inquiry</span>
          </a>
        </div>
      </td></tr>
      <tr><td style="padding:24px">
        <div style="text-align:right; padding-top:8px; color:${brand.muted}; font-size:12px">
          Ticket ID: <strong style="color:${brand.text}">${htmlEscape(ticketId)}</strong>
        </div>
        <h2 style="margin:8px 0 12px 0;font-size:20px;color:${brand.text}">Contact Details</h2>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;width:220px;color:${brand.muted}"><strong style="color:${brand.text}">Full Name:</strong></td><td style="padding:8px 0">${htmlEscape(data.name)}</td></tr>
          <tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">Email Address:</strong></td><td style="padding:8px 0"><a href="mailto:${htmlEscape(data.email)}" style="color:${brand.primary};text-decoration:underline">${htmlEscape(data.email)}</a></td></tr>
          ${data.phone ? `<tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">Phone Number:</strong></td><td style="padding:8px 0">${htmlEscape(data.phone)}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">I am a:</strong></td><td style="padding:8px 0">${htmlEscape(data.visitorType)}</td></tr>
          <tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">Practice/Company Name:</strong></td><td style="padding:8px 0">${htmlEscape(data.practice)}</td></tr>
          <tr>
            <td style="padding:8px 0;color:${brand.muted};vertical-align:top"><strong style="color:${brand.text}">Message:</strong></td>
            <td style="padding:8px 0">${nl2br(data.message)}</td>
          </tr>
        </table>
        <div style="height:1px;background:linear-gradient(90deg,transparent,${brand.border},transparent);margin:18px 0"></div>
        <p style="margin:0;color:${brand.muted};font-size:12px">
          <strong style="color:${brand.text}">Submitted:</strong> ${htmlEscape(timestamp)} •
          <strong style="color:${brand.text}">IP:</strong> ${htmlEscape(ip)}${referer ? ` • <strong style="color:${brand.text}">From:</strong> ${htmlEscape(referer)}` : ''}
        </p>
      </td></tr>
      <tr><td style="padding:14px 24px;background:#F7FAFF;border-top:1px solid ${brand.border};color:${brand.muted};font-size:12px">
        © ${new Date().getFullYear()} Cubby Health • Form submission
      </td></tr>
    </table>
  </div>
  `;
}

function buildConfirmationEmail(data: ContactFormData, ticketId: string): string {
  const brand = {
    bg: '#F3F8FF',
    card: '#FFFFFF',
    border: '#E6EEF8',
    text: '#0F2747',
    muted: '#5E728C',
    primary: '#2A7FD1',
    primary2: '#61B5FF',
  };

  const siteUrl = 'https://cubbyhealth.com';
  const logoUrl = 'https://cubbyhealth.com/CubbyHealthWhite.png';

  return `
  <div style="margin:0;padding:24px;background:${brand.bg};font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;color:${brand.text}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:${brand.card};border-radius:16px;overflow:hidden;border:1px solid ${brand.border};box-shadow:0 6px 24px rgba(20,60,120,0.08)">
      <tr><td style="padding:0">
        <div style="background:linear-gradient(90deg, ${brand.primary} 0%, ${brand.primary2} 100%);padding:16px 24px;color:#fff;font-weight:700;letter-spacing:.5px;font-size:18px;text-align:center;">
          <a href="${htmlEscape(siteUrl)}" style="display:inline-flex;align-items:center;gap:10px;color:#fff;text-decoration:none;">
            <img src="${htmlEscape(logoUrl)}" alt="Cubby Health" style="height:40px;width:auto;border:none;outline:none;">
            <span style="font-size:20px;font-weight:600;">Confirmation</span>
          </a>
        </div>
      </td></tr>
      <tr><td style="padding:24px">
        <div style="text-align:right; padding-top:8px; color:${brand.muted}; font-size:12px">
          Ticket ID: <strong style="color:${brand.text}">${htmlEscape(ticketId)}</strong>
        </div>
        <h2 style="margin:8px 0 12px 0;font-size:20px;color:${brand.text}">Thanks, ${htmlEscape(data.name)}</h2>
        <p style="margin:0 0 16px 0; color:${brand.muted}">We'll review it and reply within <strong style="color:${brand.text}">24–48 hours</strong>.</p>
        <h3 style="margin:16px 0 8px 0;color:${brand.text};font-size:16px">Summary</h3>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;width:220px;color:${brand.muted}"><strong style="color:${brand.text}">Full Name:</strong></td><td style="padding:8px 0;color:${brand.text}">${htmlEscape(data.name)}</td></tr>
          <tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">Email Address:</strong></td><td style="padding:8px 0;color:${brand.text}"><a href="mailto:${htmlEscape(data.email)}" style="color:${brand.primary};text-decoration:underline">${htmlEscape(data.email)}</a></td></tr>
          ${data.phone ? `<tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">Phone Number:</strong></td><td style="padding:8px 0;color:${brand.text}">${htmlEscape(data.phone)}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">I am a:</strong></td><td style="padding:8px 0;color:${brand.text}">${htmlEscape(data.visitorType)}</td></tr>
          <tr><td style="padding:8px 0;color:${brand.muted}"><strong style="color:${brand.text}">Practice/Company Name:</strong></td><td style="padding:8px 0;color:${brand.text}">${htmlEscape(data.practice)}</td></tr>
          <tr>
            <td style="padding:8px 0;color:${brand.muted};vertical-align:top"><strong style="color:${brand.text}">Message:</strong></td>
            <td style="padding:8px 0;color:${brand.text}">${nl2br(data.message)}</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:14px 24px;background:#F7FAFF;border-top:1px solid ${brand.border};color:${brand.muted};font-size:12px">
        © ${new Date().getFullYear()} Cubby Health
      </td></tr>
    </table>
  </div>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: ContactFormData = await req.json();

    if (data._gotcha && data._gotcha.trim() !== '') {
      return new Response(JSON.stringify({ ok: true, ticketId: 'CH-HONEY' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.a !== undefined && data.b !== undefined && data.answer !== undefined) {
      if ((data.a + data.b) !== data.answer) {
        return new Response(JSON.stringify({ ok: true, ticketId: 'CH-SPAM' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const ticketId = generateTicketId();
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const referer = req.headers.get('referer') || '';

    const adminHtml = buildAdminEmail(data, ticketId, timestamp, ip, referer);
    const confirmHtml = buildConfirmationEmail(data, ticketId);

    const smtpHost = Deno.env.get('SMTP_HOST') || 'mail.supremecluster.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER') || 'customercare@cubbyhealth.com';
    const smtpPassword = Deno.env.get('SMTP_PASSWORD') || '';

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
      from: `"Cubby Health" <${smtpUser}>`,
      to: 'customercare@cubbyhealth.com',
      replyTo: data.email,
      subject: `Cubby Health — New Inquiry #${ticketId}`,
      html: adminHtml,
    });

    if (data.email && data.email.trim() !== '') {
      try {
        await transporter.sendMail({
          from: `"Cubby Health" <${smtpUser}>`,
          to: data.email,
          subject: `Cubby Health — Confirmation #${ticketId}`,
          html: confirmHtml,
        });
      } catch (e) {
        console.error('Failed to send confirmation email:', e);
      }
    }

    return new Response(JSON.stringify({ ok: true, ticketId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Error in send-contact-email function:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
