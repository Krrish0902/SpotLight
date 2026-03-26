-- Phase 8: Platform Benchmarks Seed + Test Analytics Seed
-- Run this in your Supabase SQL Editor.
-- This does TWO things:
--  1. Seeds platform_benchmarks so "How You Compare" works
--  2. Inserts real test analytics events for YOUR artist account

-- =============================================
-- STEP 1: Seed Platform Benchmarks (for BenchmarkGauge "How You Compare")
-- =============================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_benchmarks (
  id          SERIAL PRIMARY KEY,
  genre       TEXT    NOT NULL DEFAULT 'general',
  metric      TEXT    NOT NULL,
  p25         NUMERIC NOT NULL DEFAULT 0,
  p50         NUMERIC NOT NULL DEFAULT 0,
  p75         NUMERIC NOT NULL DEFAULT 0,
  p90         NUMERIC NOT NULL DEFAULT 0
);

-- Upsert global benchmarks
INSERT INTO public.platform_benchmarks (genre, metric, p25, p50, p75, p90)
VALUES
  ('general', 'engagement_rate',         1.0,  3.0,  7.0,  12.0),
  ('general', 'booking_conversion_rate', 0.5,  1.5,  3.5,   6.0)
ON CONFLICT DO NOTHING;


-- =============================================
-- STEP 2: Seed Test Analytics Events for YOUR Account
-- Replace 'YOUR-ARTIST-ID-HERE' with your actual user_id from the profiles table.
-- To find your ID, run: SELECT user_id FROM profiles WHERE role = 'artist' LIMIT 5;
-- =============================================
DO $$
DECLARE
  -- Auto-detect artist: find the user who has the most recently uploaded video
  v_artist_id UUID := (SELECT artist_id FROM public.videos ORDER BY upload_date DESC LIMIT 1);
  v_video_id  UUID := (SELECT video_id FROM public.videos WHERE artist_id = v_artist_id LIMIT 1);
  v_viewer1   UUID := gen_random_uuid();
  v_viewer2   UUID := gen_random_uuid();
  i           INT;
BEGIN
  IF v_artist_id IS NULL THEN
    RAISE NOTICE 'No artist profile found. Skipping seed.';
    RETURN;
  END IF;
  IF v_video_id IS NULL THEN
    RAISE NOTICE 'No video found for artist %. Skipping seed.', v_artist_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding analytics for artist: %, video: %', v_artist_id, v_video_id;

  -- Insert 10 video view events across the last 7 days
  FOR i IN 0..9 LOOP
    INSERT INTO public.analytics_events (
      event_type, target_user_id, target_video_id, viewer_id,
      city, created_at
    ) VALUES (
      'video_view', v_artist_id, v_video_id,
      CASE WHEN i % 2 = 0 THEN v_viewer1 ELSE v_viewer2 END,
      CASE WHEN i % 3 = 0 THEN 'New York' WHEN i % 3 = 1 THEN 'London' ELSE 'Mumbai' END,
      NOW() - ((i % 7) || ' days')::INTERVAL
    );
  END LOOP;

  -- Insert 3 likes
  FOR i IN 0..2 LOOP
    INSERT INTO public.analytics_events (
      event_type, target_user_id, target_video_id, viewer_id, created_at
    ) VALUES (
      'like', v_artist_id, v_video_id,
      CASE WHEN i % 2 = 0 THEN v_viewer1 ELSE v_viewer2 END,
      NOW() - ((i % 5) || ' days')::INTERVAL
    );
  END LOOP;

  -- Insert 2 follows
  INSERT INTO public.analytics_events (event_type, target_user_id, viewer_id, source_video_id, created_at)
  VALUES ('follow', v_artist_id, v_viewer1, v_video_id, NOW() - '2 days'::INTERVAL);
  INSERT INTO public.analytics_events (event_type, target_user_id, viewer_id, source_video_id, created_at)
  VALUES ('follow', v_artist_id, v_viewer2, v_video_id, NOW() - '1 day'::INTERVAL);

  -- Insert 1 profile view
  INSERT INTO public.analytics_events (event_type, target_user_id, viewer_id, created_at)
  VALUES ('profile_view', v_artist_id, v_viewer1, NOW() - '3 days'::INTERVAL);

  -- Insert 1 booking request
  INSERT INTO public.analytics_events (event_type, target_user_id, viewer_id, created_at)
  VALUES ('booking_request', v_artist_id, v_viewer1, NOW() - '1 day'::INTERVAL);

  RAISE NOTICE 'Done! Seeded analytics events for artist %', v_artist_id;
END;
$$;
