/*
  # Fix Admin Access to Member Activity Data

  ## Overview
  This migration adds the missing RLS policy that allows admins to view all member click activity
  in the affiliate_clicks table. Previously, only members could view their own clicks, but admins
  had no way to view the data for the Member Activity dashboard.

  ## Changes

  ### New Policies
  - **"Admins can view all member clicks"** - Allows admin users (non-members) to SELECT all rows
    from affiliate_clicks table for reporting and analytics purposes

  ## Security
  - The policy checks that the requesting user is NOT in the member_users table, meaning they are
    an admin user
  - This follows the same security pattern used for admin access to member_sessions

  ## Important Notes
  1. Members can still only view their own clicks (existing policy)
  2. Anyone can still track clicks (existing policy for inserts)
  3. Only admins get full visibility across all member activity
*/

-- Add policy for admins to view all member click activity
CREATE POLICY "Admins can view all member clicks"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM member_users WHERE user_id = auth.uid()
    )
  );