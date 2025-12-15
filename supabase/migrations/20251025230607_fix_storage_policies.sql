/*
  # Fix Storage Policies for Partner Images

  ## Overview
  This migration creates the necessary storage policies for the partner-images bucket.
  The previous migration SQL was not applied correctly.

  ## Changes
  1. Creates public SELECT policy for viewing images
  2. Creates authenticated INSERT policy for uploading images
  3. Creates authenticated UPDATE policy for modifying images
  4. Creates authenticated DELETE policy for removing images

  ## Security
  - Public users can view all images in the partner-images bucket
  - Only authenticated users can upload, update, or delete images
*/

-- Drop existing policies if they exist (in case of conflicts)
DROP POLICY IF EXISTS "Public can view partner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload partner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update partner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete partner images" ON storage.objects;

-- Create policies for the partner-images bucket
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
