/*
  # Add quota tracking to youtube_cache

  1. Changes
    - Add `stale_ok` boolean column to youtube_cache — marks rows that should be served
      even when expired (i.e. a fresh fetch failed due to quota exhaustion)
    - Add a dedicated `quota_state` row type so the app can persist quota exhaustion
      status across server restarts without burning another API call to probe it

  2. Notes
    - Existing rows are unaffected; stale_ok defaults to false
    - The quota_state key stores { exhausted: boolean, reset_at: ISO string }
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_cache' AND column_name = 'stale_ok'
  ) THEN
    ALTER TABLE youtube_cache ADD COLUMN stale_ok boolean NOT NULL DEFAULT false;
  END IF;
END $$;
