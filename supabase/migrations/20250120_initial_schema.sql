/*
  # Initial Database Schema for Cubby Health Admin Portal

  ## Overview
  This migration sets up the complete database schema for the dental affiliate partner management system.

  ## 1. New Tables

  ### `partner_companies`
  Stores information about partner dental companies
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Company name
  - `description` (text) - Company description
  - `category` (text) - Business category (e.g., "Practice Management", "Technology & Equipment")
  - `affiliate_url` (text) - Partner's affiliate/referral URL
  - `logo_url` (text, optional) - URL to company logo
  - `is_active` (boolean) - Whether to display on public website
  - `created_at` (timestamptz) - Record creation timestamp

  ### `partner_images`
  Stores product images and additional logos for partners
  - `id` (uuid, primary key) - Unique identifier
  - `partner_id` (uuid, foreign key) - References partner_companies
  - `image_url` (text) - URL to the image in storage
  - `image_type` (text) - Either 'logo' or 'product'
  - `caption` (text, optional) - Image description/caption
  - `display_order` (integer) - Order for displaying multiple images
  - `created_at` (timestamptz) - Record creation timestamp

  ### `affiliate_clicks`
  Tracks when users click on affiliate links
  - `id` (uuid, primary key) - Unique identifier
  - `partner_id` (uuid, foreign key) - References partner_companies
  - `clicked_at` (timestamptz) - When the click occurred
  - `user_agent` (text, optional) - Browser user agent for analytics
  - `referrer` (text, optional) - Page where click originated

  ## 2. Storage Buckets

  ### `partner-images`
  Public storage bucket for partner logos and product images

  ## 3. Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Public read access for active partners and their images
  - Authenticated admin users have full CRUD access
  - Click tracking allows anonymous inserts

  ### Policies Created
  For each table:
  - Public SELECT policies for website visitors
  - Authenticated INSERT/UPDATE/DELETE policies for admin users
  - Anonymous INSERT for click tracking

  ## 4. Indexes
  - Index on `partner_companies.is_active` for fast filtering
  - Index on `partner_images.partner_id` for efficient lookups
  - Index on `affiliate_clicks.partner_id` and `clicked_at` for analytics

  ## Important Notes
  1. All tables use UUID primary keys with automatic generation
  2. Timestamps default to current time
  3. RLS is restrictive by default - explicit policies grant access
  4. Storage bucket is public for easy image serving
  5. Foreign keys use CASCADE for clean deletions
*/

CREATE TABLE IF NOT EXISTS partner_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  affiliate_url text NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('logo', 'product')),
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  clicked_at timestamptz DEFAULT now(),
  user_agent text,
  referrer text
);

CREATE INDEX IF NOT EXISTS idx_partner_companies_is_active ON partner_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_images_partner_id ON partner_images(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_partner_id ON affiliate_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);

ALTER TABLE partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active partners"
  ON partner_companies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all partners"
  ON partner_companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert partners"
  ON partner_companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update partners"
  ON partner_companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete partners"
  ON partner_companies FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Public can view images of active partners"
  ON partner_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_companies
      WHERE partner_companies.id = partner_images.partner_id
      AND partner_companies.is_active = true
    )
  );

CREATE POLICY "Authenticated users can view all images"
  ON partner_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert images"
  ON partner_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update images"
  ON partner_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete images"
  ON partner_images FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can track clicks"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view clicks"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-images', 'partner-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view partner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-images');

CREATE POLICY "Authenticated users can upload partner images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'partner-images');

CREATE POLICY "Authenticated users can update partner images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'partner-images')
  WITH CHECK (bucket_id = 'partner-images');

CREATE POLICY "Authenticated users can delete partner images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'partner-images');
