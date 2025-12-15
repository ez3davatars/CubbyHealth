/*
  # Ensure Partner Images Storage Bucket Exists

  ## Overview
  This migration ensures the partner-images storage bucket exists with proper configuration.

  ## Changes
  1. Creates or updates the partner-images bucket
  2. Ensures it's public and configured correctly
  3. Recreates all storage policies to ensure they work

  ## Security
  - Public read access for viewing images
  - Authenticated write access for managing images
*/

-- Ensure the bucket exists (using DO block to handle if it already exists)
DO $$
BEGIN
  -- Try to insert the bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'partner-images',
    'partner-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
END $$;

-- Drop and recreate all storage policies to ensure they're correct
DROP POLICY IF EXISTS "Public can view partner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload partner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update partner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete partner images" ON storage.objects;

-- Create fresh policies
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
