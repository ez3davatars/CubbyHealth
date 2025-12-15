/*
  # Fix Password Change Requirements for Existing Admins

  1. Changes
    - Set `must_change_password = false` for all existing admin users
    - This corrects the issue where existing admins were incorrectly flagged to change passwords
    - Only newly invited admins with temporary passwords should have this flag enabled
  
  2. Important Notes
    - This migration fixes existing admin records to restore normal access
    - New admins created via the invitation system will still be required to change their temporary password
    - The `must_change_password` flag should only be `true` for admins with temporary passwords
*/

-- Update all existing admin users to not require password change
-- This fixes the issue where existing admins were incorrectly flagged
UPDATE admin_users 
SET must_change_password = false
WHERE must_change_password = true;
