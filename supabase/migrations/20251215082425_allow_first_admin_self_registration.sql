/*
  # Allow First Admin Self-Registration

  1. Changes
    - Drop the existing restrictive INSERT policy on admin_users
    - Create new INSERT policy that allows authenticated users to create admin records ONLY when the table is empty
    - This enables the first admin to bootstrap themselves without edge functions
    - Once at least one admin exists, self-registration is blocked for security

  2. Security
    - After first admin is created, all future admin creation must go through proper channels
    - Existing SELECT, UPDATE, and DELETE policies remain unchanged
    - All other security measures remain in place
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Service role can manage admins" ON admin_users;

-- Create new policy that allows first admin self-registration
CREATE POLICY "Allow first admin self-registration"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow insert only if:
    -- 1. User is creating their own admin record (user_id matches auth.uid())
    -- 2. AND the admin_users table is currently empty (no admins exist yet)
    auth.uid() = user_id 
    AND (SELECT COUNT(*) FROM admin_users) = 0
  );

-- Keep the service role policy for DELETE operations
CREATE POLICY "Service role can delete admins"
  ON admin_users
  FOR DELETE
  TO service_role
  USING (true);

-- Keep the service role policy for UPDATE operations  
CREATE POLICY "Service role can update admins"
  ON admin_users
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
