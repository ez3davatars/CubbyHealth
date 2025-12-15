/*
  # Fix Member Sessions RLS Policies

  ## Overview
  This migration fixes any potential recursion issues in member_sessions policies
  by using the same admin detection approach.

  ## Changes
  1. Drop existing policies on member_sessions
  2. Create new simplified policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view own sessions" ON member_sessions;
DROP POLICY IF EXISTS "Members can create own sessions" ON member_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON member_sessions;

-- Members can view their own sessions
CREATE POLICY "Members can view own sessions"
  ON member_sessions FOR SELECT
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = auth.uid()
    )
  );

-- Members can create their own sessions
CREATE POLICY "Members can create own sessions"
  ON member_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = auth.uid()
    )
  );

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON member_sessions FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
  ON member_sessions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
