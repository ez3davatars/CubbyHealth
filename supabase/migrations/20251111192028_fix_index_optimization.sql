/*
  # Optimize Database Indexes Based on Query Usage

  ## Overview
  This migration corrects the index strategy based on actual query patterns observed in the database.

  ## Changes Made

  ### 1. Index Optimizations

  #### Added Required Index
  - **`idx_conversions_click_id`** on `affiliate_conversions(click_id)` - This index is required to cover the foreign key constraint `affiliate_conversions_click_id_fkey` and is actively used by queries that join conversions with clicks data

  #### Removed Unused Index
  - **`idx_clicks_partner_id`** on `affiliate_clicks(partner_id)` - Analysis shows this index is not being utilized by any queries. The partner_id foreign key exists but queries don't access affiliate_clicks via partner_id frequently enough to justify the index overhead on writes

  ### 2. Security Enhancements

  #### Password Protection
  **IMPORTANT:** The "Leaked Password Protection" setting must be enabled manually in Supabase Dashboard:
  
  **Steps to Enable:**
  1. Navigate to your Supabase project dashboard
  2. Go to: **Authentication** → **Settings** → **Security and Protection**
  3. Toggle ON: **"Leaked Password Protection"**
  4. This prevents users from using passwords found in the HaveIBeenPwned.org database of compromised credentials

  ## Performance Impact
  - Adding the click_id index on affiliate_conversions improves JOIN performance when analyzing conversion funnels
  - Removing the unused partner_id index from affiliate_clicks reduces write overhead
  - Queries joining conversions to clicks (common in analytics) will be faster

  ## Query Patterns Optimized
  - Conversion tracking queries that need to trace back to original click data
  - Analytics queries that aggregate conversions by click metadata
  - Funnel analysis queries joining clicks to conversions

  ## Important Notes
  1. Index selection based on actual query usage patterns
  2. All foreign key constraints remain intact - indexes are for performance only
  3. Password protection requires manual dashboard configuration
  4. Monitor query performance to ensure optimization goals are met
*/

-- Add the required index for affiliate_conversions.click_id foreign key
CREATE INDEX IF NOT EXISTS idx_conversions_click_id ON affiliate_conversions(click_id);

-- Remove the unused index that hasn't been utilized by queries
DROP INDEX IF EXISTS idx_clicks_partner_id;
