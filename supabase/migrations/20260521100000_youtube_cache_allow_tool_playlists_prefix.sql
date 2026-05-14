/*
  # Allow versioned tool_playlists cache keys

  The app writes `tool_playlists:v2` (see lib/youtube.ts). The restricted anon policies
  only allowed the exact key `tool_playlists`, so those inserts/updates were rejected by RLS.

  Use starts_with so future bumps (v3, etc.) stay valid without another migration.
*/

DROP POLICY IF EXISTS "Anon can insert cache" ON youtube_cache;
DROP POLICY IF EXISTS "Anon can update cache" ON youtube_cache;

CREATE POLICY "Anon can insert cache"
  ON youtube_cache FOR INSERT
  TO anon
  WITH CHECK (
    key IN (
      'live_now', 'upcoming_streams', 'recent_videos', 'popular_videos',
      'shorts', 'recurring_series', 'schedule', 'courses', 'tool_playlists', 'quota_state'
    )
    OR starts_with(key, 'tool_playlists')
    OR key LIKE 'playlist\_videos:%'
    OR key LIKE 'playlist\_info:%'
  );

CREATE POLICY "Anon can update cache"
  ON youtube_cache FOR UPDATE
  TO anon
  USING (
    key IN (
      'live_now', 'upcoming_streams', 'recent_videos', 'popular_videos',
      'shorts', 'recurring_series', 'schedule', 'courses', 'tool_playlists', 'quota_state'
    )
    OR starts_with(key, 'tool_playlists')
    OR key LIKE 'playlist\_videos:%'
    OR key LIKE 'playlist\_info:%'
  )
  WITH CHECK (
    key IN (
      'live_now', 'upcoming_streams', 'recent_videos', 'popular_videos',
      'shorts', 'recurring_series', 'schedule', 'courses', 'tool_playlists', 'quota_state'
    )
    OR starts_with(key, 'tool_playlists')
    OR key LIKE 'playlist\_videos:%'
    OR key LIKE 'playlist\_info:%'
  );
