/*
  # Create Password Reset Tokens Table

  1. New Tables
    - `password_reset_tokens`
      - `id` (uuid, primary key)
      - `email` (text, not null) - email address for the reset
      - `token` (text, unique, not null) - secure random token
      - `expires_at` (timestamptz, not null) - token expiration time
      - `used` (boolean, default false) - whether token has been used
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `password_reset_tokens` table
    - No direct user access policies (tokens verified via service role or edge function)

  3. Functions
    - `cleanup_expired_tokens` - removes expired tokens

  4. Notes
    - Tokens expire after 1 hour
    - Once used, token cannot be reused
    - Old tokens for same email are invalidated when new one is created
*/

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < now() OR used = true;
END;
$$;

CREATE OR REPLACE FUNCTION invalidate_existing_reset_tokens(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE password_reset_tokens
  SET used = true
  WHERE email = user_email AND used = false;
END;
$$;