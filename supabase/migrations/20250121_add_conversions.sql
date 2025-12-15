/*
  # Add Conversion Tracking

  ## Overview
  This migration adds conversion tracking capabilities to the affiliate system.

  ## 1. New Tables

  ### `affiliate_conversions`
  Tracks successful conversions/sales from affiliate clicks
  - `id` (uuid, primary key) - Unique identifier
  - `partner_id` (uuid, foreign key) - References partner_companies
  - `click_id` (uuid, foreign key, optional) - References affiliate_clicks if linked
  - `conversion_value` (decimal) - Value of the conversion in dollars
  - `commission_amount` (decimal) - Commission earned from this conversion
  - `conversion_type` (text) - Type: 'sale', 'signup', 'lead', etc.
  - `status` (text) - Status: 'pending', 'confirmed', 'cancelled'
  - `converted_at` (timestamptz) - When conversion occurred
  - `notes` (text, optional) - Additional information
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security

  ### Row Level Security (RLS)
  - Authenticated users can view and manage conversions
  - Public cannot see conversion data

  ## 3. Indexes
  - Index on partner_id for fast filtering
  - Index on converted_at for time-based queries
  - Index on status for filtering by conversion status

  ## Important Notes
  1. Commission tracking for revenue reporting
  2. Status workflow for conversion lifecycle
  3. Optional link to original click for attribution
*/

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  click_id uuid REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
  conversion_value decimal(10, 2) DEFAULT 0.00,
  commission_amount decimal(10, 2) DEFAULT 0.00,
  conversion_type text DEFAULT 'sale' CHECK (conversion_type IN ('sale', 'signup', 'lead', 'other')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  converted_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversions_partner_id ON affiliate_conversions(partner_id);
CREATE INDEX IF NOT EXISTS idx_conversions_converted_at ON affiliate_conversions(converted_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON affiliate_conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_click_id ON affiliate_conversions(click_id);

ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view conversions"
  ON affiliate_conversions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert conversions"
  ON affiliate_conversions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update conversions"
  ON affiliate_conversions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete conversions"
  ON affiliate_conversions FOR DELETE
  TO authenticated
  USING (true);
