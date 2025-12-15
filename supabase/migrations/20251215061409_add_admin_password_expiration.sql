/*
  # Add Password Expiration Tracking for Admin Users

  1. Changes
    - Add `password_expires_at` column to track when temporary passwords expire
    - Add `must_change_password` flag to force password change on first login
    - Add `last_password_change` to track password change history

  2. Security
    - These fields help enforce secure password practices
    - Temporary passwords expire after 7 days
    - Admins must change password on first login
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'password_expires_at'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN password_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN must_change_password boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'last_password_change'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN last_password_change timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_users_password_expires ON admin_users(password_expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_must_change_password ON admin_users(must_change_password);
