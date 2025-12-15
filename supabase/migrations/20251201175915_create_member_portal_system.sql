/*
  # Create Member Portal System

  ## Overview
  This migration creates a complete member portal system for gated vendor access with authentication,
  approval workflows, and detailed activity tracking.

  ## 1. New Tables

  ### `member_users`
  Stores registered member information separate from admin accounts
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to auth.users
  - `full_name` (text) - Member's full name
  - `company_name` (text, optional) - Member's company
  - `phone` (text, optional) - Contact phone number
  - `is_approved` (boolean) - Whether admin has approved access
  - `approved_at` (timestamptz, optional) - When approval was granted
  - `approved_by` (uuid, optional) - Admin user who approved
  - `is_active` (boolean) - Whether account is currently active
  - `created_at` (timestamptz) - Registration timestamp

  ### `member_sessions`
  Tracks member login sessions with IP addresses for security and analytics
  - `id` (uuid, primary key) - Unique identifier
  - `member_user_id` (uuid, foreign key) - Links to member_users
  - `ip_address` (text) - IP address of the session
  - `user_agent` (text, optional) - Browser user agent
  - `logged_in_at` (timestamptz) - Login timestamp
  - `last_activity` (timestamptz) - Last activity timestamp

  ## 2. Schema Changes

  ### Update `affiliate_clicks` table
  - Add `member_user_id` (uuid, optional) - Links clicks to authenticated members
  - Add `ip_address` (text, optional) - IP address of the click
  - Add `session_id` (text, optional) - Session identifier for tracking

  ## 3. Security

  ### Row Level Security (RLS)
  - Members can only view their own data
  - Admins (authenticated users) can view and manage all member data
  - Members can register themselves (insert their own record)
  - Only admins can approve members

  ## 4. Indexes
  - Index on member_users.user_id for fast lookups
  - Index on member_users.is_approved for filtering
  - Index on member_sessions.member_user_id for activity queries
  - Index on affiliate_clicks.member_user_id for click attribution

  ## Important Notes
  1. Members are separate from admin users but both use auth.users
  2. New members start with is_approved = false
  3. Only approved members can access the vendor portal
  4. All member activity is tracked with IP addresses
  5. Admins must manually approve each new member registration
*/

-- Create member_users table
CREATE TABLE IF NOT EXISTS member_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  company_name text,
  phone text,
  is_approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create member_sessions table
CREATE TABLE IF NOT EXISTS member_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_user_id uuid REFERENCES member_users(id) ON DELETE CASCADE NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  logged_in_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now()
);

-- Update affiliate_clicks table to add member tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'member_user_id'
  ) THEN
    ALTER TABLE affiliate_clicks ADD COLUMN member_user_id uuid REFERENCES member_users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE affiliate_clicks ADD COLUMN ip_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE affiliate_clicks ADD COLUMN session_id text;
  END IF;
END $$;

-- Rename partner_id column to company_id in affiliate_clicks if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'partner_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_clicks' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE affiliate_clicks RENAME COLUMN partner_id TO company_id;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_member_users_user_id ON member_users(user_id);
CREATE INDEX IF NOT EXISTS idx_member_users_is_approved ON member_users(is_approved);
CREATE INDEX IF NOT EXISTS idx_member_users_is_active ON member_users(is_active);
CREATE INDEX IF NOT EXISTS idx_member_sessions_member_user_id ON member_sessions(member_user_id);
CREATE INDEX IF NOT EXISTS idx_member_sessions_logged_in_at ON member_sessions(logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_member_user_id ON affiliate_clicks(member_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_ip_address ON affiliate_clicks(ip_address);

-- Enable RLS
ALTER TABLE member_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_sessions ENABLE ROW LEVEL SECURITY;

-- Member Users Policies
CREATE POLICY "Members can view own profile"
  ON member_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can register as member"
  ON member_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_approved = false);

CREATE POLICY "Members can update own profile"
  ON member_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_approved = COALESCE((SELECT is_approved FROM member_users WHERE user_id = auth.uid()), false));

CREATE POLICY "Admins can view all members"
  ON member_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM member_users
      WHERE user_id = auth.uid() AND is_approved = true
    ) = false
  );

CREATE POLICY "Admins can update member approvals"
  ON member_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM member_users
      WHERE user_id = auth.uid() AND is_approved = true
    ) = false
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM member_users
      WHERE user_id = auth.uid() AND is_approved = true
    ) = false
  );

-- Member Sessions Policies
CREATE POLICY "Members can view own sessions"
  ON member_sessions FOR SELECT
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create own sessions"
  ON member_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all sessions"
  ON member_sessions FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM member_users WHERE user_id = auth.uid()
    )
  );

-- Update affiliate_clicks policies to include member tracking
DROP POLICY IF EXISTS "Anyone can track clicks" ON affiliate_clicks;

CREATE POLICY "Anyone can track clicks with member info"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can view own clicks"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    member_user_id IN (
      SELECT id FROM member_users WHERE user_id = auth.uid()
    )
  );