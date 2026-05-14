/*
  # Create video_index table

  ## Purpose
  Permanent record of every video ever surfaced on the site. Used to generate
  the video sitemap (/video-sitemap.xml) so Google keeps old videos indexed
  even after they rotate off the homepage.

  ## New Tables
  - `video_index`
    - `id` (text, PK) — YouTube video ID
    - `title` (text) — video title
    - `description` (text) — video description
    - `thumbnail_url` (text) — thumbnail URL
    - `video_url` (text) — full YouTube watch URL
    - `published_at` (timestamptz) — original publish date
    - `duration` (text) — ISO 8601 duration string (e.g. "PT12M30S")
    - `tags` (text[]) — inferred Adobe tool tags
    - `first_seen_at` (timestamptz) — when we first added it
    - `last_seen_at` (timestamptz) — most recent time it appeared on the site

  ## Security
  - RLS enabled
  - Anon users can SELECT (needed for sitemap route, which runs server-side with anon key)
  - No public INSERT/UPDATE — writes use service role key via server-side code
*/

CREATE TABLE IF NOT EXISTS video_index (
  id             text PRIMARY KEY,
  title          text NOT NULL DEFAULT '',
  description    text NOT NULL DEFAULT '',
  thumbnail_url  text NOT NULL DEFAULT '',
  video_url      text NOT NULL DEFAULT '',
  published_at   timestamptz,
  duration       text NOT NULL DEFAULT '',
  tags           text[] NOT NULL DEFAULT '{}',
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE video_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video index"
  ON video_index FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert video index"
  ON video_index FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update video index"
  ON video_index FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS video_index_published_at_idx ON video_index (published_at DESC);
