/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses multiple security and performance issues identified by Supabase linter.

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  Foreign keys without indexes can cause poor query performance:
  - Add index on `affiliate_clicks.company_id` (formerly partner_id)
  - Add index on `member_users.approved_by`

  ### 2. Drop Unused Indexes
  Remove indexes that are not being used to reduce storage and maintenance overhead:
  - Drop `idx_member_users_is_approved`
  - Drop `idx_member_users_is_active`
  - Drop `idx_member_sessions_logged_in_at`
  - Drop `idx_affiliate_clicks_ip_address`

  ### 3. Optimize RLS Policies for Performance
  Replace `auth.uid()` with `(select auth.uid())` to prevent re-evaluation per row.
  This significantly improves query performance at scale by evaluating auth once per query
  instead of once per row.

  ### 4. Consolidate Multiple Permissive Policies
  Multiple permissive policies can create confusion and performance issues.
  Merge duplicate policies into single comprehensive policies:
  - Consolidate affiliate_clicks INSERT policies
  - Consolidate affiliate_clicks SELECT policies (keep separate for admins vs members)
  - Consolidate member_sessions policies
  - Consolidate member_users policies

  ### 5. Fix Function Search Path
  Update is_admin function to have stable, secure search path to prevent
  search_path injection attacks.
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Note: partner_id was renamed to company_id in migration 20251201175915
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_company_id
  ON affiliate_clicks(company_id);

CREATE INDEX IF NOT EXISTS idx_member_users_approved_by
  ON member_users(approved_by);

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_member_users_is_approved;
DROP INDEX IF EXISTS idx_member_users_is_active;
DROP INDEX IF EXISTS idx_member_sessions_logged_in_at;
DROP INDEX IF EXISTS idx_affiliate_clicks_ip_address;

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES FOR PERFORMANCE
-- ============================================================================

-- Optimize member_users policies
DROP POLICY IF EXISTS "Members can view own profile" ON member_users;
CREATE POLICY "Members can view own profile"
  ON member_users
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can register as members" ON member_users;
CREATE POLICY "Users can register as members"
  ON member_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Members can update own basic info" ON member_users;
CREATE POLICY "Members can update own basic info"
  ON member_users
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (
    (user_id = (select auth.uid())) AND 
    (is_approved = (SELECT is_approved FROM member_users WHERE user_id = (select auth.uid()))) AND 
    (approved_at = (SELECT approved_at FROM member_users WHERE user_id = (select auth.uid()))) AND 
    (approved_by = (SELECT approved_by FROM member_users WHERE user_id = (select auth.uid())))
  );

-- Optimize affiliate_clicks policies
DROP POLICY IF EXISTS "Members can view own clicks" ON affiliate_clicks;
CREATE POLICY "Members can view own clicks"
  ON affiliate_clicks
  FOR SELECT
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = (select auth.uid())
    )
  );

-- Optimize member_sessions policies
DROP POLICY IF EXISTS "Members can view own sessions" ON member_sessions;
CREATE POLICY "Members can view own sessions"
  ON member_sessions
  FOR SELECT
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can create own sessions" ON member_sessions;
CREATE POLICY "Members can create own sessions"
  ON member_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 4. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- Consolidate affiliate_clicks INSERT policies
DROP POLICY IF EXISTS "Anyone can insert clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can track clicks with member info" ON affiliate_clicks;

CREATE POLICY "Track affiliate clicks"
  ON affiliate_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Consolidate affiliate_clicks SELECT policies
-- Keep "Members can view own clicks" separate, but consolidate admin view
DROP POLICY IF EXISTS "Authenticated users can view all clicks" ON affiliate_clicks;

CREATE POLICY "Admins can view all clicks"
  ON affiliate_clicks
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Consolidate member_sessions admin policies
DROP POLICY IF EXISTS "Admins can view all sessions" ON member_sessions;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON member_sessions;

CREATE POLICY "Admins can manage sessions"
  ON member_sessions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Consolidate member_users admin policies
DROP POLICY IF EXISTS "Admins can view all member profiles" ON member_users;
DROP POLICY IF EXISTS "Admins can update all member profiles" ON member_users;
DROP POLICY IF EXISTS "Admins can delete member profiles" ON member_users;

CREATE POLICY "Admins can manage members"
  ON member_users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 5. FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Recreate is_admin function with SECURITY DEFINER and stable search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM member_users WHERE user_id = auth.uid()
  );
END;
$$;