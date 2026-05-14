/*
  # Restrict anon cache write policies

  Previously the INSERT and UPDATE policies for the anon role used USING/WITH CHECK (true),
  meaning any unauthenticated caller could write arbitrary rows. This migration replaces
  those with policies that constrain writes to the known set of cache key prefixes used
  by the application, so anon cannot inject arbitrary data into the table.

  1. Changes
    - Drop the old unrestricted INSERT and UPDATE policies for anon
    - Add new INSERT policy: anon can only insert rows whose key matches known prefixes
    - Add new UPDATE policy: anon can only update rows whose key matches known prefixes

  2. Known cache keys (all legitimate writes)
    - Exact keys: live_now, upcoming_streams, recent_videos, popular_videos, shorts,
      recurring_series, schedule, courses, tool_playlists, quota_state
    - Prefix keys: playlist_videos:*, playlist_info:*

  3. Security
    - Reads remain unrestricted for anon (public YouTube data only)
    - Writes are now limited to the application's own key space
    - Arbitrary key injection by external callers is blocked
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
    OR key LIKE 'playlist\_videos:%'
    OR key LIKE 'playlist\_info:%'
  )
  WITH CHECK (
    key IN (
      'live_now', 'upcoming_streams', 'recent_videos', 'popular_videos',
      'shorts', 'recurring_series', 'schedule', 'courses', 'tool_playlists', 'quota_state'
    )
    OR key LIKE 'playlist\_videos:%'
    OR key LIKE 'playlist\_info:%'
  );
