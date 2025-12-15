/*
  # Emergency Fix for Broken Policies

  ## Critical Issues Fixed

  1. **Admin Authentication Bug**
     - Previous migration checked `admin_users.id = auth.uid()` (WRONG - id is primary key)
     - Should check `admin_users.user_id = auth.uid()` (CORRECT - user_id links to auth.users)
     - This bug prevented ALL admin access

  2. **Missing Public Access**
     - Restore anonymous (anon) role access to view active partners
     - Restore anonymous access to view partner images
     - Required for public homepage Partners section

  3. **Policy Consolidation**
     - Fix all tables with the admin column bug
     - Ensure public can view active partners
     - Ensure admins can manage all partner data

  ## Tables Fixed
  - partner_companies: Restore anon SELECT + fix admin checks
  - partner_images: Restore anon SELECT + fix admin checks
  - affiliate_clicks: Fix admin checks
  - member_users: Fix admin checks
  - member_sessions: Fix admin checks
  - affiliate_conversions: Fix admin checks
  - admin_users: Fix self-referential admin checks

  ## Security Notes
  - Anonymous users can only VIEW active partners (is_active = true)
  - Anonymous users can only VIEW images of active partners
  - All write operations require authenticated admin users
  - Admin verification now uses correct user_id column
*/

-- ============================================================================
-- 1. FIX PARTNER_COMPANIES POLICIES
-- ============================================================================

-- Drop broken policies
DROP POLICY IF EXISTS "View active partners or admin access" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can insert partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can update partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can delete partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Public can view active partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partner_companies;

-- Create corrected policies with anon access + fixed admin checks
CREATE POLICY "Anonymous can view active partners"
  ON public.partner_companies
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view active partners"
  ON public.partner_companies
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert partners"
  ON public.partner_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update partners"
  ON public.partner_companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete partners"
  ON public.partner_companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- 2. FIX PARTNER_IMAGES POLICIES
-- ============================================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Anyone can view partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can insert partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can update partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can delete partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Public can view partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can manage partner images" ON public.partner_images;

-- Create corrected policies with anon access + fixed admin checks
CREATE POLICY "Anonymous can view images of active partners"
  ON public.partner_images
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_companies
      WHERE partner_companies.id = partner_images.partner_id
      AND partner_companies.is_active = true
    )
  );

CREATE POLICY "Authenticated can view all partner images"
  ON public.partner_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_companies
      WHERE partner_companies.id = partner_images.partner_id
      AND partner_companies.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert partner images"
  ON public.partner_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update partner images"
  ON public.partner_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete partner images"
  ON public.partner_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- 3. FIX AFFILIATE_CLICKS POLICIES
-- ============================================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view relevant clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can track clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Members can view own clicks" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.affiliate_clicks;

-- Create corrected policies
CREATE POLICY "Anyone can track clicks"
  ON public.affiliate_clicks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all clicks"
  ON public.affiliate_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- 4. FIX MEMBER_USERS POLICIES
-- ============================================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can create profiles" ON public.member_users;
DROP POLICY IF EXISTS "Users can update relevant profiles" ON public.member_users;
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.member_users;
DROP POLICY IF EXISTS "Members can view own profile" ON public.member_users;
DROP POLICY IF EXISTS "Members can register" ON public.member_users;
DROP POLICY IF EXISTS "Members can update own profile" ON public.member_users;
DROP POLICY IF EXISTS "Admins can manage all members" ON public.member_users;

-- Create corrected policies
CREATE POLICY "Users can view own profile"
  ON public.member_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Users can create own profile"
  ON public.member_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.member_users
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can delete member profiles"
  ON public.member_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- 5. FIX MEMBER_SESSIONS POLICIES
-- ============================================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can manage relevant sessions" ON public.member_sessions;
DROP POLICY IF EXISTS "Members can manage own sessions" ON public.member_sessions;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.member_sessions;

-- Create corrected policies
CREATE POLICY "Users can manage own sessions"
  ON public.member_sessions
  FOR ALL
  TO authenticated
  USING (
    member_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    member_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- 6. FIX ADMIN_USERS POLICIES
-- ============================================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;

-- Create corrected policies
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_active = true
    )
  );

CREATE POLICY "Admins can insert admin users"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_active = true
    )
  );

CREATE POLICY "Admins can update admin users"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_active = true
    )
  );

CREATE POLICY "Admins can delete admin users"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users AS admin_check
      WHERE admin_check.user_id = auth.uid()
      AND admin_check.is_active = true
    )
  );

-- ============================================================================
-- 7. FIX AFFILIATE_CONVERSIONS POLICIES (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_conversions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage conversions" ON public.affiliate_conversions';

    EXECUTE 'CREATE POLICY "Admins can manage conversions"
      ON public.affiliate_conversions
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.user_id = auth.uid()
          AND admin_users.is_active = true
        )
      )';
  END IF;
END $$;