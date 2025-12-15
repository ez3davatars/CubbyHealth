/*
  # Fix Admin List Visibility

  ## Problem
  The current RLS policy on admin_users only allows users to view their own record.
  This prevents admins from seeing the full list of admin users in the dashboard.

  ## Solution
  Create a secure PostgreSQL function that:
  - Checks if the calling user is an active admin
  - If yes, returns all admin records (bypassing RLS with SECURITY DEFINER)
  - If no, returns only the caller's own record
  - Avoids circular recursion by using SECURITY DEFINER privileges

  ## Security
  - Function uses SECURITY DEFINER to bypass RLS
  - Validates caller is an active admin before returning all records
  - Only exposes data to authenticated, active admins
*/

-- Create function to get all admin users (secure, no recursion)
CREATE OR REPLACE FUNCTION public.get_all_admin_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  is_active boolean,
  created_at timestamptz,
  created_by uuid,
  must_change_password boolean,
  password_expires_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an active admin
  -- Using SECURITY DEFINER, this check bypasses RLS without recursion
  IF EXISTS (
    SELECT 1 
    FROM public.admin_users au
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  ) THEN
    -- User is an active admin, return all admin records
    RETURN QUERY
    SELECT 
      au.id,
      au.user_id,
      au.email,
      au.full_name,
      au.is_active,
      au.created_at,
      au.created_by,
      au.must_change_password,
      au.password_expires_at
    FROM public.admin_users au
    ORDER BY au.created_at DESC;
  ELSE
    -- User is not an active admin, return only their own record
    RETURN QUERY
    SELECT 
      au.id,
      au.user_id,
      au.email,
      au.full_name,
      au.is_active,
      au.created_at,
      au.created_by,
      au.must_change_password,
      au.password_expires_at
    FROM public.admin_users au
    WHERE au.user_id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_admin_users() TO authenticated;
