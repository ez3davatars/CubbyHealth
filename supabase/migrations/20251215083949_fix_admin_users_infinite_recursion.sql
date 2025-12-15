/*
  # Fix Infinite Recursion in Admin Policies

  ## Problem
  The admin_users table has policies that query admin_users to check admin status:
  - "Active admins can view all admin records" queries admin_users (infinite recursion!)
  - "Active admins can update admin records" queries admin_users (infinite recursion!)
  - "Active admins can delete other admins" queries admin_users (infinite recursion!)
  
  When partner_companies policy checks if user is admin, it triggers admin_users SELECT,
  which then checks if user is admin, creating an infinite loop.

  ## Solution
  1. Create a SECURITY DEFINER function that bypasses RLS to check admin status
  2. Replace all recursive admin checks with this function
  3. This breaks the circular dependency and allows policies to work correctly

  ## Security
  - Function uses SECURITY DEFINER to bypass RLS (safe - only checks auth.uid())
  - Function is STABLE (result doesn't change within transaction)
  - Uses explicit search_path for security
*/

-- ============================================================================
-- 1. CREATE SECURITY DEFINER FUNCTION TO CHECK ADMIN STATUS
-- ============================================================================

-- This function bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
$$;

-- ============================================================================
-- 2. FIX ADMIN_USERS POLICIES - REMOVE RECURSIVE CHECKS
-- ============================================================================

-- Drop the recursive policies
DROP POLICY IF EXISTS "Active admins can view all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins can update admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins can delete other admins" ON public.admin_users;

-- Recreate policies using the non-recursive function
CREATE POLICY "Active admins can view all admin records"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

CREATE POLICY "Active admins can update admin records"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

CREATE POLICY "Active admins can delete other admins"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin() AND user_id <> auth.uid());

-- ============================================================================
-- 3. FIX PARTNER_COMPANIES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anonymous can view active partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Authenticated can view active partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Public can view active partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can insert partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can update partners" ON public.partner_companies;
DROP POLICY IF EXISTS "Admins can delete partners" ON public.partner_companies;

CREATE POLICY "Anyone can view active partners"
  ON public.partner_companies
  FOR SELECT
  USING (is_active = true OR public.is_active_admin());

CREATE POLICY "Admins can insert partners"
  ON public.partner_companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins can update partners"
  ON public.partner_companies
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins can delete partners"
  ON public.partner_companies
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 4. FIX PARTNER_IMAGES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anonymous can view images of active partners" ON public.partner_images;
DROP POLICY IF EXISTS "Authenticated can view all partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Public can view images of active partners" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can manage partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can insert partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can update partner images" ON public.partner_images;
DROP POLICY IF EXISTS "Admins can delete partner images" ON public.partner_images;

CREATE POLICY "Anyone can view images of active partners"
  ON public.partner_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_companies
      WHERE partner_companies.id = partner_images.partner_id
      AND (partner_companies.is_active = true OR public.is_active_admin())
    )
  );

CREATE POLICY "Admins can insert partner images"
  ON public.partner_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins can update partner images"
  ON public.partner_images
  FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

CREATE POLICY "Admins can delete partner images"
  ON public.partner_images
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 5. FIX AFFILIATE_CLICKS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all clicks" ON public.affiliate_clicks;

CREATE POLICY "Admins can view all clicks"
  ON public.affiliate_clicks
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 6. FIX MEMBER_USERS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.member_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.member_users;
DROP POLICY IF EXISTS "Admins can delete member profiles" ON public.member_users;

CREATE POLICY "Users can view own profile"
  ON public.member_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_active_admin());

CREATE POLICY "Users can update own profile"
  ON public.member_users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_active_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_active_admin());

CREATE POLICY "Admins can delete member profiles"
  ON public.member_users
  FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ============================================================================
-- 7. FIX MEMBER_SESSIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.member_sessions;

CREATE POLICY "Users can manage own sessions"
  ON public.member_sessions
  FOR ALL
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM public.member_users WHERE user_id = auth.uid()
    )
    OR public.is_active_admin()
  )
  WITH CHECK (
    member_user_id IN (
      SELECT id FROM public.member_users WHERE user_id = auth.uid()
    )
    OR public.is_active_admin()
  );

-- ============================================================================
-- 8. FIX AFFILIATE_CONVERSIONS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_conversions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage conversions" ON public.affiliate_conversions';
    
    EXECUTE 'CREATE POLICY "Admins can manage conversions"
      ON public.affiliate_conversions
      FOR ALL
      TO authenticated
      USING (public.is_active_admin())
      WITH CHECK (public.is_active_admin())';
  END IF;
END $$;
