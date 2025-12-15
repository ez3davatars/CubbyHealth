/*
  # Add Index for Member User ID in Affiliate Clicks

  ## Overview
  This migration adds an index on the member_user_id column in the affiliate_clicks
  table to improve query performance when filtering and joining on member data.

  ## Changes
  1. Add index on affiliate_clicks.member_user_id for better query performance
*/

-- Create index for member_user_id in affiliate_clicks
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_member_user_id ON affiliate_clicks(member_user_id);
