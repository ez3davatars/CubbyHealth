/*
  # Fix Admin Users RLS Policies

  ## Overview
  Updates RLS policies on admin_users table to check the is_admin flag in member_users
  instead of blocking all users who exist in member_users.

  ## Changes
  - Drop existing restrictive policies
  - Create new policies that check for is_admin=true in member_users
  - Allows admins who are in member_users with is_admin=true to manage admin_users table

  ## Security
  - Only users with is_admin=true in member_users can access admin_users
  - Regular members (is_admin=false) are blocked
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON admin_users;

-- Create new policies that check is_admin flag
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM member_users 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM member_users 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update admin users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM member_users 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM member_users 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete admin users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM member_users 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );
