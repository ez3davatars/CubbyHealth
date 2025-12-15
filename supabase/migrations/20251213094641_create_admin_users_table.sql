/*
  # Create Admin Users Table

  ## Overview
  This migration creates a table to track admin user metadata, enabling admin management 
  from the dashboard including adding new admins, viewing all admins, and deactivating accounts.

  ## 1. New Tables

  ### `admin_users`
  Stores metadata for admin users (separate from auth.users)
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `email` (text) - Admin's email address
  - `full_name` (text) - Admin's display name
  - `is_active` (boolean) - Whether admin account is active
  - `created_at` (timestamptz) - When the admin was added
  - `created_by` (uuid, optional) - Which admin created this account

  ## 2. Security

  ### Row Level Security (RLS)
  - Only authenticated admins can view admin list
  - Only authenticated admins can manage other admins

  ## Important Notes
  1. Admin users are users in auth.users who are NOT in member_users
  2. This table tracks metadata only - auth is still via Supabase Auth
  3. Existing admins will need to be manually added to this table
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM member_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM member_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update admin users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM member_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM member_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete admin users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM member_users WHERE user_id = auth.uid()
    )
  );
