/*
  # merge_playlist_for_video_ids

  Used by the `backfill-playlist-membership` Edge Function to attach a YouTube
  playlist id to many indexed videos in one round trip (without re-upserting
  full video payloads).
*/

CREATE OR REPLACE FUNCTION public.merge_playlist_for_video_ids(
  p_playlist_id text,
  p_video_ids text[]
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated bigint;
BEGIN
  IF p_playlist_id IS NULL OR trim(p_playlist_id) = '' OR p_video_ids IS NULL OR cardinality(p_video_ids) = 0 THEN
    RETURN 0;
  END IF;

  WITH u AS (
    UPDATE video_index
    SET
      playlist_ids = CASE
        WHEN NOT (playlist_ids @> ARRAY[p_playlist_id])
        THEN playlist_ids || p_playlist_id
        ELSE playlist_ids
      END,
      last_seen_at = now()
    WHERE id = ANY(p_video_ids)
      AND NOT (playlist_ids @> ARRAY[p_playlist_id])
    RETURNING 1
  )
  SELECT COUNT(*)::bigint INTO updated FROM u;

  RETURN COALESCE(updated, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.merge_playlist_for_video_ids(text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_playlist_for_video_ids(text, text[]) TO service_role;
