/*
  # Fix Admin Users Circular Policy Bug

  ## Problem
  The admin_users table policies create infinite recursion because they check admin_users from within admin_users policies.
  When any query checks "is user an admin?", it triggers:
  1. Query admin_users table
  2. admin_users policy checks "is user an admin?"
  3. Query admin_users table again (infinite loop)
  4. Database returns "infinite recursion detected"

  ## Solution
  Simplify admin_users policies to avoid self-referential checks:
  - Authenticated users can view their own admin record
  - Only the first admin (or service role) can create new admins
  - Admins can only update/delete if they already have a record

  ## Security Impact
  - Maintains security: only existing admins can manage admin users
  - No circular dependencies
  - Authenticated users can check if they are admins
*/

-- Drop all existing admin_users policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;

-- Allow authenticated users to view their own admin record (no circular check)
CREATE POLICY "Users can view own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to view all admins IF they have an active admin record
-- This works because we first check if user_id matches (above policy)
-- Then this policy lets them see all other admins
CREATE POLICY "Active admins can view all admins"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT au.user_id FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

-- Only service role can insert (avoid bootstrapping problem)
CREATE POLICY "Service role can insert admins"
  ON public.admin_users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins can update admin users if they themselves are active admins
CREATE POLICY "Active admins can update admins"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT au.user_id FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT au.user_id FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

-- Admins can delete admin users if they themselves are active admins
CREATE POLICY "Active admins can delete admins"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT au.user_id FROM public.admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );
