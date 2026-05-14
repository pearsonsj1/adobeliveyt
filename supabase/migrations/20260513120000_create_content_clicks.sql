/*
  # content_clicks — card / preview opens for trending + admin dashboard

  Inserts come from `trackContentClick` in lib/analytics.ts (wire calls from UI as needed).
  Reads: home TrendingSection uses anon; /admin uses service role (preferred) or anon SELECT here.
*/

CREATE TABLE IF NOT EXISTS content_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text NOT NULL,
  content_title text NOT NULL,
  content_type text NOT NULL,
  section text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert content clicks"
  ON content_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read content clicks for site analytics"
  ON content_clicks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS content_clicks_created_at_idx ON content_clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS content_clicks_content_id_idx ON content_clicks (content_id);
