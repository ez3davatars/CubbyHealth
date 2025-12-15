/*
  # Fix affiliate_clicks Index Name
  
  1. Changes
    - Drop old index `idx_affiliate_clicks_partner_id` (created with wrong name)
    - Create new index `idx_affiliate_clicks_company_id` with correct column reference
    
  2. Notes
    - The column was renamed from partner_id to company_id in migration 20251201175915
    - This migration corrects the index name to match the actual column name
    - Uses IF EXISTS/IF NOT EXISTS for safety
*/

-- Drop the old index with incorrect name
DROP INDEX IF EXISTS idx_affiliate_clicks_partner_id;

-- Create the correctly-named index
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_company_id
  ON affiliate_clicks(company_id);
