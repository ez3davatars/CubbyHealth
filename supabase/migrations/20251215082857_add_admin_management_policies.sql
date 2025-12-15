/*
  # Add Admin Management Policies

  1. Problem
    - Users can view their own admin record
    - But active admins can't view all admin records (for dashboard)
    - Active admins can't update other admins (for toggling active status)
    - Active admins can't delete other admins (for user management)

  2. Solution
    - Add SELECT policy for active admins to view all admin records
    - Add UPDATE policy for active admins to manage admin records
    - Add DELETE policy for active admins to remove admin records

  3. Security
    - Only users with is_active=true can manage other admins
    - Regular users can still only view their own record
    - First admin self-registration still works
*/

-- SELECT: Active admins can view all admin records
CREATE POLICY "Active admins can view all admin records"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- UPDATE: Active admins can update any admin record
CREATE POLICY "Active admins can update admin records"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- DELETE: Active admins can delete admin records (except themselves)
CREATE POLICY "Active admins can delete other admins"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    -- User must be an active admin
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
    -- Can't delete their own record
    AND user_id != auth.uid()
  );
