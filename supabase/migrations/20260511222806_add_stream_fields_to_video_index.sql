/*
  # Add stream metadata fields to video_index

  Adds columns needed to distinguish live streams from regular videos,
  store scheduled times, and serve the schedule from the DB without
  hitting the YouTube API on every page load.

  1. Changes to video_index
    - `is_live_stream` (boolean) — true if this was/is a live broadcast
    - `scheduled_time` (timestamptz, nullable) — when the stream was/is scheduled
    - `actual_start_time` (timestamptz, nullable) — actual broadcast start (completed streams)
    - `stream_status` (text, nullable) — 'upcoming' | 'live' | 'completed' | null for regular videos
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'is_live_stream'
  ) THEN
    ALTER TABLE video_index ADD COLUMN is_live_stream boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE video_index ADD COLUMN scheduled_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'actual_start_time'
  ) THEN
    ALTER TABLE video_index ADD COLUMN actual_start_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'stream_status'
  ) THEN
    ALTER TABLE video_index ADD COLUMN stream_status text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS video_index_stream_status_idx ON video_index (stream_status) WHERE stream_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS video_index_scheduled_time_idx ON video_index (scheduled_time DESC) WHERE scheduled_time IS NOT NULL;
