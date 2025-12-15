/*
  # Add storage_path column to partner_images table

  1. Changes
    - Adds `storage_path` column to `partner_images` table
    - This column stores the file path in Supabase Storage for proper deletion

  2. Notes
    - Column is nullable to support existing records
    - No data migration needed as table currently has 0 rows
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'partner_images'
    AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.partner_images ADD COLUMN storage_path text;
  END IF;
END $$;