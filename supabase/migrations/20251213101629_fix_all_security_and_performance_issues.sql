/*
  # Fix All Security and Performance Issues

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
    - Add index on `admin_users.created_by`
    - Add index on `partner_companies.created_by`
    - Add index on `partner_images.created_by`

  ### 2. Drop Unused Indexes
    - Remove indexes that are not being used by queries

  ### 3. Drop Duplicate Indexes
    - Keep `idx_clicks_company_id`, drop `idx_affiliate_clicks_company_id`
    - Keep `member_users_user_id_idx`, drop `idx_member_users_user_id`

  ### 4. Optimize RLS Policies
    - Replace all `auth.uid()` calls with `(select auth.uid())`
    - Consolidate duplicate policies where possible
    - Improve policy performance at scale

  ### 5. Fix Function Search Paths
    - Make `is_admin` and `set_updated_at` functions immutable where possible
*/

-- ============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================

-- Index for admin_users.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON public.admin_users(created_by);

-- Index for partner_companies.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_partner_companies_created_by ON public.partner_companies(created_by);

-- Index for partner_images.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_partner_images_created_by ON public.partner_images(created_by);

-- ============================================
-- 2. DROP DUPLICATE INDEXES
-- ============================================

-- Drop duplicate index on affiliate_clicks
DROP INDEX IF EXISTS public.idx_affiliate_clicks_company_id;

-- Drop duplicate index on member_users
DROP INDEX IF EXISTS public.idx_member_users_user_id;

-- ============================================
-- 3. DROP UNUSED INDEXES
-- ============================================

DROP INDEX IF EXISTS public.idx_member_users_is_approved;
DROP INDEX IF EXISTS public.idx_conversions_company_id;
DROP INDEX IF EXISTS public.idx_conversions_status;
DROP INDEX IF EXISTS public.idx_conversions_click_id;
DROP INDEX IF EXISTS public.idx_member_users_is_active;
DROP INDEX IF EXISTS public.idx_member_sessions_logged_in_at;
DROP INDEX IF EXISTS public.idx_affiliate_clicks_ip_address;
DROP INDEX IF EXISTS public.idx_partner_companies_is_active;
DROP INDEX IF EXISTS public.idx_partner_images_partner_id;
DROP INDEX IF EXISTS public.idx_admin_users_email;
DROP INDEX IF EXISTS public.idx_admin_users_is_active;

-- ============================================
-- 4. FIX FUNCTION SEARCH PATHS
-- ============================================

-- Recreate is_admin function with stable search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Recreate set_updated_at function with stable search path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. OPTIMIZE RLS POLICIES - ADMIN_USERS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;

-- Recreate optimized policies
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Admins can insert admin users"
  ON public.admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update admin users"
  ON public.admin_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

CREATE POLICY "Admins can delete admin users"
  ON public.admin_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

-- ============================================
-- 6. OPTIMIZE RLS POLICIES - PARTNER_COMPANIES
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS partner_companies_select_own ON public.partner_companies;
DROP POLICY IF EXISTS partner_companies_insert_own ON public.partner_companies;
DROP POLICY IF EXISTS partner_insert_policy ON public.partner_companies;
DROP POLICY IF EXISTS partner_companies_insert_admin ON public.partner_companies;
DROP POLICY IF EXISTS partner_companies_update_admin ON public.partner_companies;
DROP POLICY IF EXISTS partner_companies_delete_admin ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can read partner companies" ON public.partner_companies;
DROP POLICY IF EXISTS "Public can view active partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Authenticated users can view all partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Authenticated users can insert partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Authenticated users can update partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Authenticated users can delete partners" ON public.partner_companies;
DROP POLICY IF EXISTS partner_companies_select_public ON public.partner_companies;
DROP POLICY IF EXISTS partner_select_policy ON public.partner_companies;

-- Create consolidated, optimized policies
CREATE POLICY "Public can view active partners"
  ON public.partner_companies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage partners"
  ON public.partner_companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

-- ============================================
-- 7. OPTIMIZE RLS POLICIES - PARTNER_IMAGES
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS pi_insert_auth ON public.partner_images;
DROP POLICY IF EXISTS pi_update_owner ON public.partner_images;
DROP POLICY IF EXISTS pi_delete_owner ON public.partner_images;
DROP POLICY IF EXISTS partner_images_insert_admin ON public.partner_images;
DROP POLICY IF EXISTS partner_images_update_admin ON public.partner_images;
DROP POLICY IF EXISTS partner_images_delete_admin ON public.partner_images;
DROP POLICY IF EXISTS "Public can view images of active partners" ON public.partner_images;
DROP POLICY IF EXISTS "Authenticated users can view all images" ON public.partner_images;
DROP POLICY IF EXISTS "Authenticated users can insert images" ON public.partner_images;
DROP POLICY IF EXISTS "Authenticated users can update images" ON public.partner_images;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON public.partner_images;
DROP POLICY IF EXISTS partner_images_select_public ON public.partner_images;
DROP POLICY IF EXISTS pi_select_all ON public.partner_images;

-- Create consolidated, optimized policies
CREATE POLICY "Public can view partner images"
  ON public.partner_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_companies
      WHERE id = partner_images.partner_id
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage partner images"
  ON public.partner_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

-- ============================================
-- 8. OPTIMIZE RLS POLICIES - MEMBER_USERS
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS member_users_update_self ON public.member_users;
DROP POLICY IF EXISTS member_users_all_admin ON public.member_users;
DROP POLICY IF EXISTS member_users_insert_self ON public.member_users;
DROP POLICY IF EXISTS member_users_select_self ON public.member_users;
DROP POLICY IF EXISTS "Users can register as members" ON public.member_users;
DROP POLICY IF EXISTS "Members can view own profile" ON public.member_users;
DROP POLICY IF EXISTS "Members can update own basic info" ON public.member_users;
DROP POLICY IF EXISTS "Admins can view all member profiles" ON public.member_users;
DROP POLICY IF EXISTS "Admins can update all member profiles" ON public.member_users;
DROP POLICY IF EXISTS "Admins can delete member profiles" ON public.member_users;

-- Create consolidated, optimized policies
CREATE POLICY "Members can view own profile"
  ON public.member_users FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Members can register"
  ON public.member_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Members can update own profile"
  ON public.member_users FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all members"
  ON public.member_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

-- ============================================
-- 9. OPTIMIZE RLS POLICIES - AFFILIATE_CLICKS
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can read affiliate clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Members can view own clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can track clicks with member info" ON public.affiliate_clicks;
DROP POLICY IF EXISTS ac_insert_anyone ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Authenticated users can view clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "allow authenticated inserts for affiliate_clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS ac_select_auth ON public.affiliate_clicks;

-- Create consolidated, optimized policies
CREATE POLICY "Anyone can track clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can view own clicks"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM public.member_users
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view all clicks"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

-- ============================================
-- 10. OPTIMIZE RLS POLICIES - MEMBER_SESSIONS
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Members can view own sessions" ON public.member_sessions;
DROP POLICY IF EXISTS "Members can create own sessions" ON public.member_sessions;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.member_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.member_sessions;

-- Create consolidated, optimized policies
CREATE POLICY "Members can manage own sessions"
  ON public.member_sessions FOR ALL
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM public.member_users
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    member_user_id IN (
      SELECT id FROM public.member_users
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage all sessions"
  ON public.member_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );

-- ============================================
-- 11. OPTIMIZE RLS POLICIES - AFFILIATE_CONVERSIONS
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can insert conversions" ON public.affiliate_conversions;
DROP POLICY IF EXISTS conv_insert_auth ON public.affiliate_conversions;
DROP POLICY IF EXISTS "Authenticated users can view conversions" ON public.affiliate_conversions;
DROP POLICY IF EXISTS conv_select_auth ON public.affiliate_conversions;

-- Create consolidated, optimized policies
CREATE POLICY "Admins can manage conversions"
  ON public.affiliate_conversions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = (select auth.uid())
      AND is_active = true
    )
  );