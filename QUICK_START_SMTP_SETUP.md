# Quick Start: SMTP Setup for Cubby Health

## What Was Updated

Your Cubby Health application has been configured to support custom SMTP email with branded templates. Here's what changed:

### 1. Project Configuration
- **Updated `.env`**: Corrected Supabase project ID to `ouojzmcajmfsobazqhbc`
- **Enhanced Supabase Client**: Added proper authentication options including PKCE flow and session detection
- **Ready for Email**: All code is now ready to send branded emails through your custom SMTP server

### 2. Email Templates Ready
- Password Reset Email (with branded styling)
- Welcome/Confirmation Email (for future use)
- Magic Link Email (for future use)

---

## Next Steps (Manual Configuration Required)

To complete the SMTP setup, you need to configure settings in your Supabase Dashboard. Follow these steps:

### Step 1: Create Gmail App Password (5 minutes)

1. Go to https://myaccount.google.com
2. Click **Security** → Ensure **2-Step Verification** is enabled
3. Go to **App passwords**
4. Create a new app password:
   - App: **Mail**
   - Device: **Other** → Enter "Cubby Health SMTP"
5. **Copy the 16-character password** (you'll need this next)

### Step 2: Configure SMTP in Supabase (3 minutes)

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/ouojzmcajmfsobazqhbc/settings/auth

2. Navigate to **Authentication** → **Email Templates**

3. Scroll to **SMTP Settings** and click **Enable Custom SMTP**

4. Enter these settings:
   - **Sender name:** `Cubby Health`
   - **Sender email:** Your Gmail address
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** Your Gmail address
   - **Password:** The 16-character App Password from Step 1

5. Click **Save**

### Step 3: Configure Email Templates (10 minutes)

In the same **Email Templates** section, update these three templates:

#### A. Password Reset Email
Copy the branded HTML template from `SMTP_CONFIGURATION_GUIDE.md` (Section: Password Reset Email)

#### B. Confirmation Email
Copy the branded HTML template from `SMTP_CONFIGURATION_GUIDE.md` (Section: Confirmation Email)

#### C. Magic Link Email
Copy the branded HTML template from `SMTP_CONFIGURATION_GUIDE.md` (Section: Magic Link Email)

### Step 4: Configure Redirect URLs (2 minutes)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**

2. Set **Site URL** to your domain:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

3. Add these **Redirect URLs** (one per line):
   ```
   http://localhost:5173/reset-password
   http://localhost:5173/member-login
   https://yourdomain.com/reset-password
   https://yourdomain.com/member-login
   ```
   (Replace `yourdomain.com` with your actual domain)

---

## Testing Your Setup

Once configured, test the password reset flow:

1. Start your dev server (if not running)
2. Go to http://localhost:5173/member-login
3. Click "Forgot password?"
4. Enter a registered member email
5. Check your email inbox for the branded password reset email
6. Click the reset link and verify it redirects to `/reset-password`
7. Complete the password reset

---

## Complete Documentation

For detailed instructions, troubleshooting, and production recommendations, see:
**`SMTP_CONFIGURATION_GUIDE.md`**

---

## Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ouojzmcajmfsobazqhbc
- **Auth Settings**: https://supabase.com/dashboard/project/ouojzmcajmfsobazqhbc/settings/auth
- **Google App Passwords**: https://myaccount.google.com/apppasswords

---

## Support

Need help? Contact support@cubbyhealth.com or check the full guide in `SMTP_CONFIGURATION_GUIDE.md`.

**Total Setup Time: ~20 minutes**
