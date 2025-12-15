/*
  # Fix Admin Users Infinite Recursion (Final Fix)

  ## Root Cause
  The admin_users policies were still self-referential, causing infinite recursion.
  When code checks "is user an admin?" by querying admin_users:
  1. Query: SELECT * FROM admin_users WHERE user_id = auth.uid()
  2. Policy triggers: checks if user_id IN (SELECT FROM admin_users...)
  3. Inner query triggers same policy again → infinite loop

  ## Solution
  Remove ALL self-referential queries from admin_users policies:
  - SELECT: Simply allow users to view where user_id = auth.uid() (no subquery)
  - INSERT/UPDATE/DELETE: Use service_role only (managed by edge functions)

  ## Why This Works
  - No policy on admin_users references admin_users
  - Other tables can safely check admin_users without causing recursion
  - Admin management done through edge functions with service_role access
*/

-- Drop all existing admin_users policies
DROP POLICY IF EXISTS "Users can view own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins can view all admins" ON public.admin_users;
DROP POLICY IF EXISTS "Service role can insert admins" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins can update admins" ON public.admin_users;
DROP POLICY IF EXISTS "Active admins can delete admins" ON public.admin_users;

-- Simple, non-recursive SELECT policy
-- Authenticated users can ONLY view their own admin record
CREATE POLICY "Users can view own admin record"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- All modifications handled by service_role (via edge functions)
CREATE POLICY "Service role can manage admins"
  ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
