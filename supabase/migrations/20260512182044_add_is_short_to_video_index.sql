/*
  # Add is_short column to video_index

  1. Changes
    - Adds `is_short` boolean column (DEFAULT false) to video_index
    - Backfills from the `duration` column: videos with duration matching `0:XX`
      (i.e. under 60 seconds, formatted as "0:SS" by parseDuration) are marked as shorts
    - Adds index on is_short for fast filtering

  2. Notes
    - The parseDuration function stores durations as "M:SS" or "H:MM:SS".
      A video under 60 seconds is stored as "0:XX" (0 minutes, XX seconds).
    - This is a non-destructive migration — no data is deleted.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'is_short'
  ) THEN
    ALTER TABLE video_index ADD COLUMN is_short boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Backfill: mark as short if duration is "0:XX" (0 minutes, under 60 seconds)
UPDATE video_index
SET is_short = true
WHERE duration ~ '^0:\d{2}$' AND is_short = false;

CREATE INDEX IF NOT EXISTS video_index_is_short_idx ON video_index (is_short);
