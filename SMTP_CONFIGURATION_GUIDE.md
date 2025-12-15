# Custom SMTP Configuration Guide for Cubby Health

This guide will walk you through configuring custom SMTP settings and branded email templates for your Cubby Health member portal.

---

## Phase 1: Configure Gmail SMTP Settings

### Step 1: Create Gmail App Password

Before configuring Supabase, you need to create an App Password for your Gmail account:

1. Go to your Google Account: https://myaccount.google.com
2. Select **Security** from the left menu
3. Under "How you sign in to Google," ensure **2-Step Verification** is enabled
4. Once 2-Step Verification is enabled, go back to Security
5. Under "How you sign in to Google," select **App passwords**
6. Select app: **Mail**
7. Select device: **Other (Custom name)** and enter "Cubby Health SMTP"
8. Click **Generate**
9. **Copy the 16-character password** - you'll need this in the next step

### Step 2: Configure SMTP in Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ouojzmcajmfsobazqhbc

2. Navigate to **Authentication** → **Email Templates** (left sidebar)

3. Scroll down to **SMTP Settings** section

4. Click **Enable Custom SMTP**

5. Enter the following settings:
   - **Sender name:** `Cubby Health`
   - **Sender email:** Your Gmail address (e.g., `noreply@cubbyhealth.com` or your Gmail)
   - **Host:** `smtp.gmail.com`
   - **Port number:** `587`
   - **Minimum interval between emails being sent:** `60` (seconds)
   - **Username:** Your full Gmail address
   - **Password:** The 16-character App Password you generated in Step 1

6. Click **Save** to apply the SMTP settings

---

## Phase 2: Configure Email Templates

### Email Template Settings

Navigate to **Authentication** → **Email Templates** in your Supabase dashboard.

You'll configure three email templates:

### 1. Confirmation Email (Welcome Email)

**Note:** Email confirmation is currently disabled for immediate member access. This template will be used if you enable it in the future.

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Cubby Health!</h1>
  </div>

  <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1e293b; margin-top: 0;">Hi there!</h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Thank you for registering with Cubby Health. We're excited to have you join our community!
    </p>

    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Your account has been successfully created and is now pending approval from our team. You'll receive another email once your account has been approved.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .SiteURL }}"
         style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                display: inline-block;">
        Visit Cubby Health
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>© 2024 Cubby Health. All rights reserved.</p>
  </div>
</div>
```

### 2. Password Reset Email

This is the most important template for your member portal:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
  </div>

  <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password for your Cubby Health member account.
    </p>

    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Click the button below to reset your password. This link will expire in 1 hour.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery"
         style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                display: inline-block;">
        Reset Your Password
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #2563eb; font-size: 12px; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 6px;">
      {{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery
    </p>

    <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>© 2024 Cubby Health. All rights reserved.</p>
    <p>This link will expire in 1 hour for security purposes.</p>
  </div>
</div>
```

### 3. Magic Link Email

**Note:** This is not currently used but good to have configured:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Sign In to Cubby Health</h1>
  </div>

  <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1e293b; margin-top: 0;">Quick Sign In</h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Click the button below to securely sign in to your Cubby Health account.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                display: inline-block;">
        Sign In Now
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      If you didn't request this sign-in link, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p>© 2024 Cubby Health. All rights reserved.</p>
  </div>
</div>
```

---

## Phase 3: Configure URL Redirects

In the Supabase Dashboard, go to **Authentication** → **URL Configuration**:

1. **Site URL:** Enter your production domain
   - Example: `https://yourdomain.com` or `https://cubbyhealth.netlify.app`

2. **Redirect URLs:** Add these allowed redirect URLs (one per line):
   ```
   http://localhost:5173/reset-password
   http://localhost:5173/member-login
   https://yourdomain.com/reset-password
   https://yourdomain.com/member-login
   ```

   Replace `yourdomain.com` with your actual domain.

---

## Phase 4: Disable Email Confirmation (Already Done in Code)

For immediate member access, email confirmation is disabled in the authentication flow. However, you can verify this in Supabase:

1. Go to **Authentication** → **Providers** → **Email**
2. Ensure **"Confirm email"** is set to **OFF**
3. This allows members to log in immediately after registration without email verification

---

## Phase 5: Testing

### Test Password Reset Flow

1. Go to your member login page
2. Click "Forgot Password?"
3. Enter a registered member email address
4. Check the email inbox for the branded password reset email
5. Click the "Reset Your Password" button
6. Verify you're redirected to `/reset-password` with the token
7. Enter a new password and confirm
8. Verify successful password update and redirect to login

### Test Registration Flow

1. Go to the member registration page
2. Fill out the registration form with a new email
3. Submit the form
4. Verify immediate access (no email confirmation required)
5. Verify the confirmation email is sent with the branded template

---

## Troubleshooting

### Emails Not Sending

1. Verify your Gmail App Password is correct (16 characters, no spaces)
2. Ensure 2-Step Verification is enabled on your Google account
3. Check Supabase logs: **Authentication** → **Logs**
4. Verify SMTP settings are saved and enabled

### Password Reset Links Not Working

1. Check that redirect URLs are properly configured in Supabase
2. Verify the Site URL matches your domain
3. Ensure the token is not expired (1-hour expiry)
4. Check browser console for any JavaScript errors

### Emails Going to Spam

1. Set up SPF, DKIM, and DMARC records for your domain
2. Consider using a custom domain email instead of Gmail
3. Warm up your sending domain gradually
4. Use a professional email service like SendGrid or AWS SES for production

---

## Production Recommendations

For production use, consider:

1. **Custom Domain Email**: Use a professional email service with your domain
   - Example: `noreply@cubbyhealth.com`

2. **Transactional Email Service**: Switch from Gmail to:
   - SendGrid
   - AWS SES
   - Postmark
   - Mailgun

3. **Email Deliverability**: Set up proper DNS records:
   - SPF (Sender Policy Framework)
   - DKIM (DomainKeys Identified Mail)
   - DMARC (Domain-based Message Authentication)

4. **Monitor Email Logs**: Regularly check Supabase authentication logs for email delivery issues

---

## Support

If you need assistance:
- Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-smtp
- Contact Cubby Health support: support@cubbyhealth.com

---

**Last Updated:** December 2024
