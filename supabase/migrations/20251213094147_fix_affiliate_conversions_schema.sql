/*
  # Fix Affiliate Conversions Schema

  ## Overview
  This migration adds missing columns to the affiliate_conversions table that are required
  by the analytics system but were not created in previous migrations.

  ## Changes Made

  ### New Columns Added
  - `conversion_value` (decimal) - Value of the conversion in dollars
  - `conversion_type` (text) - Type of conversion: 'sale', 'signup', 'lead', 'other'
  - `notes` (text) - Additional notes about the conversion

  ## Important Notes
  1. All new columns are nullable to support existing data
  2. conversion_type defaults to 'sale' for new records
  3. conversion_value defaults to 0.00 for new records
*/

-- Add missing columns to affiliate_conversions table
DO $$
BEGIN
  -- Add conversion_value if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_conversions' AND column_name = 'conversion_value'
  ) THEN
    ALTER TABLE affiliate_conversions 
    ADD COLUMN conversion_value decimal(10, 2) DEFAULT 0.00;
  END IF;

  -- Add conversion_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_conversions' AND column_name = 'conversion_type'
  ) THEN
    ALTER TABLE affiliate_conversions 
    ADD COLUMN conversion_type text DEFAULT 'sale' 
    CHECK (conversion_type IN ('sale', 'signup', 'lead', 'other'));
  END IF;

  -- Add notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_conversions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE affiliate_conversions 
    ADD COLUMN notes text;
  END IF;
END $$;
