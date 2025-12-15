/*
  # Create Admin Invitation Tokens Table

  ## Overview
  This migration creates a secure token system for admin account password setup.
  When a new admin is invited, they receive a unique token link to set their password.

  ## Tables Created
  
  ### `admin_invitation_tokens`
  Stores secure tokens for admin account setup
  - `id` (uuid, primary key) - Unique identifier
  - `admin_user_id` (uuid, not null) - References admin_users.id
  - `token` (text, unique, not null) - Secure random token for password setup
  - `expires_at` (timestamptz, not null) - Token expiration time (7 days)
  - `used` (boolean, default false) - Whether token has been consumed
  - `created_at` (timestamptz, default now()) - Creation timestamp

  ## Indexes
  - `idx_admin_invitation_tokens_admin_user_id` - Fast lookup by admin user
  - `idx_admin_invitation_tokens_token` - Fast validation of tokens
  - `idx_admin_invitation_tokens_expires_at` - Efficient cleanup queries

  ## Security
  - RLS enabled with service_role only access
  - Tokens cannot be viewed by regular users
  - All token operations handled by edge functions

  ## Functions
  - `cleanup_expired_admin_invitation_tokens()` - Removes expired/used tokens
  - `invalidate_admin_invitation_tokens(uuid)` - Invalidates existing tokens for an admin

  ## Important Notes
  - Tokens are single-use only
  - Tokens expire after 7 days
  - Creating a new token for an admin invalidates previous tokens
  - This system replaces temporary password approach for better security
*/

CREATE TABLE IF NOT EXISTS admin_invitation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invitation_tokens_admin_user_id ON admin_invitation_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_invitation_tokens_token ON admin_invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_admin_invitation_tokens_expires_at ON admin_invitation_tokens(expires_at);

ALTER TABLE admin_invitation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage invitation tokens"
  ON admin_invitation_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION cleanup_expired_admin_invitation_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM admin_invitation_tokens
  WHERE expires_at < now() OR used = true;
END;
$$;

CREATE OR REPLACE FUNCTION invalidate_admin_invitation_tokens(target_admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_invitation_tokens
  SET used = true
  WHERE admin_user_id = target_admin_user_id AND used = false;
END;
$$;
