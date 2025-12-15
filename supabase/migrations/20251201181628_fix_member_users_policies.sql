/*
  # Fix Member Users RLS Policies

  ## Overview
  This migration fixes the infinite recursion issue in member_users policies by simplifying
  the admin access logic. We distinguish between admin users and member users by assuming
  that authenticated users without a member_users record are admins.

  ## Changes
  1. Drop existing problematic policies on member_users table
  2. Create new simplified policies that avoid recursion
  3. Admin users are identified as authenticated users WITHOUT a member_users record

  ## Security
  - Members can only view and update their own profile
  - Members can register themselves (insert)
  - Admins (authenticated users not in member_users) can view and manage all members
  - Only admins can approve members
*/

-- Drop all existing policies on member_users
DROP POLICY IF EXISTS "Members can view own profile" ON member_users;
DROP POLICY IF EXISTS "Anyone can register as member" ON member_users;
DROP POLICY IF EXISTS "Members can update own profile" ON member_users;
DROP POLICY IF EXISTS "Admins can view all members" ON member_users;
DROP POLICY IF EXISTS "Admins can update member approvals" ON member_users;

-- Create new simplified policies

-- Allow authenticated users to insert their own member profile
CREATE POLICY "Users can register as members"
  ON member_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow members to view their own profile only
CREATE POLICY "Members can view own profile"
  ON member_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow members to update their own basic info (not approval status)
CREATE POLICY "Members can update own basic info"
  ON member_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND is_approved = (SELECT is_approved FROM member_users WHERE user_id = auth.uid())
    AND approved_at = (SELECT approved_at FROM member_users WHERE user_id = auth.uid())
    AND approved_by = (SELECT approved_by FROM member_users WHERE user_id = auth.uid())
  );

-- Note: Admin access will be handled by service role key in the backend
-- The admin dashboard uses the authenticated admin user, but we need to grant broader access

-- Create a function to check if a user is an admin (not in member_users table)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM member_users WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies using the function
CREATE POLICY "Admins can view all member profiles"
  ON member_users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all member profiles"
  ON member_users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete member profiles"
  ON member_users FOR DELETE
  TO authenticated
  USING (is_admin());
