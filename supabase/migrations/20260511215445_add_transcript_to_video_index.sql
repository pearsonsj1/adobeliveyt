/*
  # Add transcript column to video_index

  Adds a nullable `transcript` column to store plain-text YouTube captions
  for each video. Used for SEO-friendly per-video detail pages and full-text
  crawling.

  1. Changes
    - `video_index`: new `transcript` column (text, nullable, default null)
    - `transcript_fetched_at`: timestamp so we know when it was last attempted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'transcript'
  ) THEN
    ALTER TABLE video_index ADD COLUMN transcript text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'transcript_fetched_at'
  ) THEN
    ALTER TABLE video_index ADD COLUMN transcript_fetched_at timestamptz DEFAULT NULL;
  END IF;
END $$;
