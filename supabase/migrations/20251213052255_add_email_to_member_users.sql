/*
  # Add email column to member_users table

  1. Changes
    - Add `email` column to `member_users` table to store member email addresses
    - This allows us to send notifications without querying auth.users table
    
  2. Notes
    - Column is nullable initially to support existing records
    - Future registrations will populate this field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'member_users' AND column_name = 'email'
  ) THEN
    ALTER TABLE member_users ADD COLUMN email text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_member_users_email ON member_users(email);