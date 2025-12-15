/*
  # Fix Remaining Security and Performance Issues

  ## Overview
  This migration addresses the final security alerts and performance issues identified in the database audit.

  ## Changes Made

  ### 1. Index Optimizations

  #### Added Missing Index
  - **`idx_clicks_partner_id`** on `affiliate_clicks(partner_id)` - Covers the foreign key constraint `affiliate_clicks_partner_id_fkey` to prevent suboptimal query performance when joining or filtering by partner_id

  #### Removed Unused Index
  - **`idx_conversions_click_id`** on `affiliate_conversions(click_id)` - This index was added in a previous migration but has not been used by any queries. The foreign key relationship exists but queries don't use this join pattern frequently enough to justify the index overhead.

  ### 2. Security Enhancements

  #### Password Protection
  **IMPORTANT:** The "Leaked Password Protection" setting must be enabled manually in Supabase Dashboard:
  
  **Steps to Enable:**
  1. Navigate to your Supabase project dashboard
  2. Go to: **Authentication** → **Settings** → **Security and Protection**
  3. Toggle ON: **"Leaked Password Protection"**
  4. This prevents users from using passwords found in the HaveIBeenPwned.org database of compromised credentials

  **Why This Matters:**
  - Protects against credential stuffing attacks
  - Prevents users from choosing passwords that are known to be compromised
  - Adds an additional layer of security to your authentication system
  - No performance impact on your application

  ## Performance Impact
  - Adding the partner_id index on affiliate_clicks will improve JOIN and WHERE clause performance
  - Removing the unused click_id index will slightly improve INSERT/UPDATE performance on conversions table
  - Overall query performance for partner-related analytics will be optimized

  ## Security Impact
  - Proper indexing on all foreign keys ensures fast, reliable queries
  - Prevents slow queries that could lead to timeouts or poor user experience
  - Password protection (when enabled in dashboard) significantly reduces account compromise risk

  ## Important Notes
  1. All database changes are backward compatible
  2. Existing queries will continue to work
  3. Password protection requires manual dashboard configuration
  4. Monitor query performance after deployment to verify improvements
  5. Consider enabling password protection immediately for production environments
*/

-- Add missing index for affiliate_clicks.partner_id foreign key
CREATE INDEX IF NOT EXISTS idx_clicks_partner_id ON affiliate_clicks(partner_id);

-- Remove unused index that hasn't been utilized by any queries
DROP INDEX IF EXISTS idx_conversions_click_id;
