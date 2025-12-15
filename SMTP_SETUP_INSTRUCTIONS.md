# SMTP Email Setup Instructions

Your email system has been updated to use direct SMTP instead of PHP endpoints. Follow these steps to complete the setup:

## 1. Configure SMTP Secrets in Supabase

You need to add the following environment variables to your Supabase Edge Functions:

```bash
# Required
SMTP_PASSWORD=your_actual_password_here

# Optional (defaults are set in code)
SMTP_HOST=mail.supremecluster.com
SMTP_PORT=465
SMTP_USER=customercare@cubbyhealth.com
SMTP_FROM_EMAIL=customercare@cubbyhealth.com
SMTP_FROM_NAME=Customer Care
```

### How to Add Secrets:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** > **Edge Functions**
3. Under **Secrets**, add each environment variable
4. Click **Save** after adding each one

**Important:** The `SMTP_PASSWORD` is required. Without it, the email functions will not work.

## 2. Deploy the Edge Functions

After configuring the secrets, deploy both email functions:

### Using Supabase CLI:

```bash
supabase functions deploy send-registration-email
supabase functions deploy send-approval-email
```

### Using the MCP Tool (if available):

The functions can also be deployed through the Supabase MCP integration.

## 3. What Changed

### Before:
- Edge functions called external PHP endpoints
- Emails were sent via PHP/PHPMailer
- Dependency on cubbyhealth.com server

### After:
- Edge functions send emails directly using nodemailer
- All email logic is self-contained in Supabase
- No external dependencies
- Same beautiful HTML email templates
- Better error handling and logging

## 4. Email Templates

The system sends three types of emails:

1. **Member Welcome Email** - Sent to new registrants confirming receipt
2. **Admin Notification Email** - Alerts admins of new registrations
3. **Account Approval Email** - Confirms member account activation

All templates use responsive HTML with your Cubby Health branding (cyan/teal gradients for welcome, amber for admin notifications, green for approvals).

## 5. Testing

To test the email system:

1. Register a new member through your member portal
2. Check that both the member and admin (care@cubbyhealth.com) receive emails
3. Approve the member from the admin dashboard
4. Verify the member receives the approval email

## 6. Troubleshooting

### If emails are not sending:

1. Check Supabase Edge Function logs for errors
2. Verify SMTP_PASSWORD is correctly set
3. Confirm SMTP server (mail.supremecluster.com) is accessible
4. Test SMTP credentials using a tool like Telnet or an SMTP testing tool

### Common Issues:

- **"SMTP password not configured"** - Add the SMTP_PASSWORD secret
- **Connection timeout** - Check firewall/network settings for port 465
- **Authentication failed** - Verify SMTP credentials are correct

## 7. Security Notes

- SMTP credentials are stored as encrypted Supabase secrets
- Never commit SMTP passwords to code
- Edge functions use SSL/TLS (port 465) for secure email transmission
- Admin authorization required for approval emails

## 8. Next Steps

After deployment and testing:

1. Monitor email delivery rates in the first few days
2. Check spam folder placement
3. Consider setting up SPF, DKIM, and DMARC records for better deliverability
4. Update PHP files can be kept as backup or removed once stable

---

**Need Help?** Check the Supabase documentation or contact support if you encounter issues.
