-- Public User Role Migration
-- Run this in Supabase SQL Editor

-- 1. Add 'public' to the user_role enum (safe online migration - no lock)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'public';

-- 2. Allow authenticated users to read their own tickets
-- (check if RLS is enabled on tickets first; add policy if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tickets'
      AND policyname = 'users_read_own_tickets'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "users_read_own_tickets"
        ON public.tickets FOR SELECT
        USING (auth.uid() = user_id)
    $pol$;
  END IF;
END $$;

-- 3. Allow authenticated users to read reviews they wrote
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'artist_reviews'
      AND policyname = 'users_read_own_reviews'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "users_read_own_reviews"
        ON public.artist_reviews FOR SELECT
        USING (auth.uid() = user_id)
    $pol$;
  END IF;
END $$;
