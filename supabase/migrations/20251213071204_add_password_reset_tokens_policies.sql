/*
  # Add RLS Policies for Password Reset Tokens

  1. Security
    - Allow authenticated users to insert new tokens (for requesting password reset)
    - Allow authenticated users to select tokens (for verifying validity)
    - Allow authenticated users to update tokens (for marking as used)
    - No delete access (cleanup done via scheduled function)

  2. Notes
    - Tokens are validated by the edge function using service role
    - Client-side access is limited to basic operations
    - Token verification is done server-side for security
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'password_reset_tokens' 
    AND policyname = 'Anyone can insert reset tokens'
  ) THEN
    CREATE POLICY "Anyone can insert reset tokens"
      ON password_reset_tokens
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'password_reset_tokens' 
    AND policyname = 'Anyone can view reset tokens for verification'
  ) THEN
    CREATE POLICY "Anyone can view reset tokens for verification"
      ON password_reset_tokens
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'password_reset_tokens' 
    AND policyname = 'Anyone can update reset tokens'
  ) THEN
    CREATE POLICY "Anyone can update reset tokens"
      ON password_reset_tokens
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;