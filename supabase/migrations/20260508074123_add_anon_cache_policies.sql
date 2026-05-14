/*
  # Allow anon role to read/write youtube_cache

  The Next.js server uses the anon key to read and write the cache table.
  Previous policies only allowed service_role, causing all cache reads/writes
  to silently fail. Adding anon policies here so the cache actually works.

  No sensitive data is stored in this table — it only holds public YouTube API
  responses, so anon read/write access is appropriate.
*/

CREATE POLICY "Anon can read cache"
  ON youtube_cache FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert cache"
  ON youtube_cache FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update cache"
  ON youtube_cache FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
