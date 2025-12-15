/*
  # Fix Circular Policy Dependency

  ## Problem
  Current setup has circular dependency:
  - partner_companies policies check admin_users
  - admin_users policies check member_users  
  - member_users admin policies check admin_users
  This creates infinite recursion even though data exists correctly.

  ## Solution
  Create a SECURITY DEFINER function that bypasses RLS to check admin status.
  This breaks the circular dependency by providing a direct admin check.

  ## Changes
  1. Create is_current_user_admin() function that bypasses RLS
  2. Update partner_companies policies to use the function
  3. Update partner_images policies to use the function
  4. Keep admin_users policies checking member_users (this is correct)
  5. Update member_users admin policy to use the function

  ## Security
  - Function uses SECURITY DEFINER to bypass RLS safely
  - Only checks if current authenticated user is an active admin
  - Returns boolean, no sensitive data exposed
*/

-- Create helper function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Update partner_companies policies to use the function
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partner_companies;

CREATE POLICY "Admins can manage partners"
  ON public.partner_companies FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Update partner_images policies to use the function
DROP POLICY IF EXISTS "Admins can manage partner images" ON public.partner_images;

CREATE POLICY "Admins can manage partner images"
  ON public.partner_images FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Update member_users admin policy to use the function
DROP POLICY IF EXISTS "Admins can manage all members" ON public.member_users;

CREATE POLICY "Admins can manage all members"
  ON public.member_users FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Update member_sessions admin policy to use the function
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.member_sessions;

CREATE POLICY "Admins can manage all sessions"
  ON public.member_sessions FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Update affiliate_clicks admin policy to use the function
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.affiliate_clicks;

CREATE POLICY "Admins can view all clicks"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (is_current_user_admin());

-- Update affiliate_conversions admin policy to use the function
DROP POLICY IF EXISTS "Admins can manage conversions" ON public.affiliate_conversions;

CREATE POLICY "Admins can manage conversions"
  ON public.affiliate_conversions FOR ALL
  TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());
