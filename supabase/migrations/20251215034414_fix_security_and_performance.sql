/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **Add Missing Foreign Key Indexes**
    - Add index on `admin_users.created_by`
    - Add index on `affiliate_clicks.company_id`
    - Add index on `partner_companies.created_by`
    - Add index on `partner_images.created_by`

  2. **Optimize RLS Policies (Auth Function Caching)**
    - Update `affiliate_clicks` policies to cache auth.uid()
    - Update `member_users` policies to cache auth.uid()
    - Update `member_sessions` policies to cache auth.uid()

  3. **Remove Unused Index**
    - Drop `idx_affiliate_conversions_company_id` (not being used)

  4. **Consolidate Multiple Permissive Policies**
    - Merge duplicate SELECT policies on `partner_companies`
    - Merge duplicate SELECT policies on `partner_images`

  ## Performance Impact
  - Foreign key indexes improve JOIN performance
  - RLS optimization reduces redundant auth function calls
  - Removing unused index reduces write overhead
  - Consolidated policies simplify query planning
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_users_created_by
  ON public.admin_users(created_by);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_company_id
  ON public.affiliate_clicks(company_id);

CREATE INDEX IF NOT EXISTS idx_partner_companies_created_by
  ON public.partner_companies(created_by);

CREATE INDEX IF NOT EXISTS idx_partner_images_created_by
  ON public.partner_images(created_by);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES (Auth Function Caching)
-- ============================================================================

-- Fix affiliate_clicks policies
DROP POLICY IF EXISTS "Users can view relevant clicks" ON public.affiliate_clicks;
CREATE POLICY "Users can view relevant clicks"
  ON public.affiliate_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

-- Fix member_users policies
DROP POLICY IF EXISTS "Users can create profiles" ON public.member_users;
CREATE POLICY "Users can create profiles"
  ON public.member_users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update relevant profiles" ON public.member_users;
CREATE POLICY "Users can update relevant profiles"
  ON public.member_users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.member_users;
CREATE POLICY "Users can view relevant profiles"
  ON public.member_users
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

-- Fix member_sessions policies
DROP POLICY IF EXISTS "Users can manage relevant sessions" ON public.member_sessions;
CREATE POLICY "Users can manage relevant sessions"
  ON public.member_sessions
  FOR ALL
  TO authenticated
  USING (member_user_id = (SELECT auth.uid()))
  WITH CHECK (member_user_id = (SELECT auth.uid()));

-- ============================================================================
-- 3. REMOVE UNUSED INDEX
-- ============================================================================

DROP INDEX IF EXISTS public.idx_affiliate_conversions_company_id;

-- ============================================================================
-- 4. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- Consolidate partner_companies SELECT policies
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Public can view active partners" ON public.partner_companies;

CREATE POLICY "View active partners or admin access"
  ON public.partner_companies
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can insert partners"
  ON public.partner_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can update partners"
  ON public.partner_companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can delete partners"
  ON public.partner_companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

-- Consolidate partner_images SELECT policies
DROP POLICY IF EXISTS "Admins can manage partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Public can view partner images" ON public.partner_images;

CREATE POLICY "Anyone can view partner images"
  ON public.partner_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert partner images"
  ON public.partner_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can update partner images"
  ON public.partner_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can delete partner images"
  ON public.partner_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );
