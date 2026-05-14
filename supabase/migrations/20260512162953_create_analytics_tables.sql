/*
  # Create Extended Analytics Tables

  Adds three analytics tables to power the channel growth dashboard:

  1. New Tables
    - `search_queries`
      - `id` (uuid, primary key)
      - `query` (text) — what the user searched
      - `results_count` (int) — how many videos matched
      - `clicked_video_id` (text, nullable) — if they clicked a result, which one
      - `tool_filter` (text) — active tool filter at time of search ("All" or tool name)
      - `created_at` (timestamptz)

    - `page_time_spent`
      - `id` (uuid, primary key)
      - `video_id` (text) — the video page visited
      - `seconds_spent` (int) — time on page before leaving (beacon on unload)
      - `clicked_youtube` (boolean) — did they click the Watch on YouTube CTA
      - `created_at` (timestamptz)

    - `youtube_cta_clicks`
      - `id` (uuid, primary key)
      - `video_id` (text) — video the CTA was on
      - `video_title` (text)
      - `source_page` (text) — which page/section the click came from
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Anon can INSERT (analytics events)
    - Authenticated can SELECT (for dashboard)
*/

-- Search queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  results_count int NOT NULL DEFAULT 0,
  clicked_video_id text,
  tool_filter text NOT NULL DEFAULT 'All',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search queries"
  ON search_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read search queries"
  ON search_queries FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS search_queries_created_at_idx ON search_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS search_queries_query_idx ON search_queries (query);

-- Page time spent table
CREATE TABLE IF NOT EXISTS page_time_spent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  seconds_spent int NOT NULL DEFAULT 0,
  clicked_youtube boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_time_spent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert time spent events"
  ON page_time_spent FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read time spent"
  ON page_time_spent FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS page_time_spent_video_id_idx ON page_time_spent (video_id);
CREATE INDEX IF NOT EXISTS page_time_spent_created_at_idx ON page_time_spent (created_at DESC);

-- YouTube CTA clicks table
CREATE TABLE IF NOT EXISTS youtube_cta_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL DEFAULT '',
  video_title text NOT NULL DEFAULT '',
  source_page text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE youtube_cta_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert youtube cta clicks"
  ON youtube_cta_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read youtube cta clicks"
  ON youtube_cta_clicks FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS youtube_cta_clicks_video_id_idx ON youtube_cta_clicks (video_id);
CREATE INDEX IF NOT EXISTS youtube_cta_clicks_created_at_idx ON youtube_cta_clicks (created_at DESC);
