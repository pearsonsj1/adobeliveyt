/*
  # Create youtube_cache table

  Stores cached YouTube API responses to avoid hitting the API on every page load.
  Non-live data (videos, playlists, courses, series) is cached for 6 hours.
  Live and schedule data bypasses this table entirely.

  1. New Tables
    - `youtube_cache`
      - `key` (text, primary key) — unique cache key, e.g. "recent_videos" or "playlist:PLxxx"
      - `data` (jsonb) — the serialized response data
      - `cached_at` (timestamptz) — when the entry was last written

  2. Security
    - RLS enabled
    - Service role can read/write (used server-side only via service role key)
    - No public access
*/

CREATE TABLE IF NOT EXISTS youtube_cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  cached_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE youtube_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read cache"
  ON youtube_cache FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert cache"
  ON youtube_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update cache"
  ON youtube_cache FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
