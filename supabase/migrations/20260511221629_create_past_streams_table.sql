/*
  # Create past_streams table

  Permanently stores completed YouTube live streams from the Adobe Live channel.
  Unlike youtube_cache (which expires), rows here never expire — past broadcasts
  don't change after they end.

  1. New Tables
    - `past_streams`
      - `id` (text, primary key) — YouTube video ID
      - `title` (text)
      - `description` (text)
      - `thumbnail_url` (text)
      - `video_url` (text)
      - `actual_start_time` (timestamptz) — when the stream actually started
      - `tools` (text[]) — inferred Adobe tool tags
      - `host` (text, nullable)
      - `first_indexed_at` (timestamptz) — when we first stored this row

  2. Security
    - Enable RLS
    - Anonymous users can read (public content, already on YouTube)
    - No public write access; writes happen via service role in edge functions
*/

CREATE TABLE IF NOT EXISTS past_streams (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  thumbnail_url text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  actual_start_time timestamptz,
  tools text[] NOT NULL DEFAULT '{}',
  host text,
  first_indexed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE past_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read past streams"
  ON past_streams FOR SELECT
  TO anon, authenticated
  USING (true);
