/*
  # Create Missing Member Records

  ## Overview
  This migration creates member_users records for any auth.users who registered
  but couldn't create their member record due to the policy recursion issue.

  ## Changes
  1. Insert member_users records for existing auth users without member records
  2. Set basic defaults since we don't have their full registration data
*/

-- Insert member_users records for auth users that don't have them yet
-- Exclude the admin user (3dclonerep@gmail.com) by assuming first user is admin
INSERT INTO member_users (user_id, full_name, is_approved, is_active, created_at)
SELECT 
  au.id,
  COALESCE(au.email, 'Unknown User') as full_name,
  false as is_approved,
  true as is_active,
  au.created_at
FROM auth.users au
LEFT JOIN member_users mu ON au.id = mu.user_id
WHERE mu.id IS NULL
  AND au.email != '3dclonerep@gmail.com'  -- Exclude the admin user
ON CONFLICT (user_id) DO NOTHING;
