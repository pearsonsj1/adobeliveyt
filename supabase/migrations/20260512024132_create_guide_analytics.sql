/*
  # Create Guide Analytics Table

  Tracks every choice made in the PathFinder "What brings you to Adobe Live?" quiz
  so you can see which paths users take and which content they end up on.

  1. New Tables
    - `guide_clicks`
      - `id` (uuid, primary key)
      - `session_id` (text) — random client-side ID to group a full session's path
      - `node_id` (text) — which question node was shown (e.g. "root", "tool", "courses")
      - `question` (text) — the full question text shown
      - `choice_label` (text) — the label of the option the user clicked
      - `destination_url` (text, nullable) — if the choice led to a destination, the URL
      - `destination_label` (text, nullable) — the label of the final destination card
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow anonymous inserts (analytics only — no reads for anon)
    - Allow authenticated reads for admin dashboards
*/

CREATE TABLE IF NOT EXISTS guide_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  node_id text NOT NULL,
  question text NOT NULL DEFAULT '',
  choice_label text NOT NULL,
  destination_url text,
  destination_label text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guide_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can insert analytics events
CREATE POLICY "Anyone can insert guide click events"
  ON guide_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read analytics (for your dashboard)
CREATE POLICY "Authenticated users can read guide clicks"
  ON guide_clicks FOR SELECT
  TO authenticated
  USING (true);

-- Index for querying by node or time range
CREATE INDEX IF NOT EXISTS guide_clicks_node_id_idx ON guide_clicks (node_id);
CREATE INDEX IF NOT EXISTS guide_clicks_created_at_idx ON guide_clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS guide_clicks_session_id_idx ON guide_clicks (session_id);
