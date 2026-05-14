/*
  # Restore playlist_ids handling in upsert_video_index

  - Re-merge optional `playlist_id` from each JSON video into `playlist_ids`
    (text[]) on insert/update, matching the column added in 20260508155515.
  - Later migrations replaced the function without this logic, so
    `indexPlaylistVideos` payloads stopped tagging rows for playlist fallback.
  - GIN index speeds up PostgREST `playlist_ids=cs.{...}` reads.
  - Align grants with 20260511233140: service_role only (edge functions use
    service role for RPC).
*/

CREATE OR REPLACE FUNCTION upsert_video_index(videos jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
  v_duration text;
  new_playlist_id text;
BEGIN
  FOR v IN SELECT * FROM jsonb_array_elements(videos)
  LOOP
    v_duration := COALESCE(v->>'duration', '');
    new_playlist_id := v->>'playlist_id';

    INSERT INTO video_index (
      id, title, description, thumbnail_url, video_url, published_at,
      duration, tags, is_live_stream, scheduled_time, actual_start_time,
      stream_status, is_short, playlist_ids, first_seen_at, last_seen_at
    )
    VALUES (
      v->>'id',
      COALESCE(v->>'title', ''),
      COALESCE(v->>'description', ''),
      COALESCE(v->>'thumbnail_url', ''),
      COALESCE(v->>'video_url', ''),
      CASE WHEN v->>'published_at' IS NOT NULL THEN (v->>'published_at')::timestamptz ELSE NULL END,
      v_duration,
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(v->'tags')), '{}'),
      COALESCE((v->>'is_live_stream')::boolean, false),
      CASE WHEN v->>'scheduled_time' IS NOT NULL THEN (v->>'scheduled_time')::timestamptz ELSE NULL END,
      CASE WHEN v->>'actual_start_time' IS NOT NULL THEN (v->>'actual_start_time')::timestamptz ELSE NULL END,
      v->>'stream_status',
      v_duration ~ '^0:\d{2}$',
      CASE
        WHEN new_playlist_id IS NOT NULL AND length(trim(new_playlist_id)) > 0
        THEN ARRAY[new_playlist_id]
        ELSE '{}'::text[]
      END,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      title             = EXCLUDED.title,
      description       = EXCLUDED.description,
      thumbnail_url     = EXCLUDED.thumbnail_url,
      video_url         = EXCLUDED.video_url,
      published_at      = COALESCE(EXCLUDED.published_at, video_index.published_at),
      duration          = EXCLUDED.duration,
      tags              = EXCLUDED.tags,
      is_live_stream    = CASE WHEN EXCLUDED.is_live_stream THEN true ELSE video_index.is_live_stream END,
      scheduled_time    = COALESCE(EXCLUDED.scheduled_time, video_index.scheduled_time),
      actual_start_time = COALESCE(EXCLUDED.actual_start_time, video_index.actual_start_time),
      stream_status     = COALESCE(EXCLUDED.stream_status, video_index.stream_status),
      is_short          = EXCLUDED.is_short,
      playlist_ids      = CASE
                            WHEN new_playlist_id IS NOT NULL
                              AND length(trim(new_playlist_id)) > 0
                              AND NOT (video_index.playlist_ids @> ARRAY[new_playlist_id])
                            THEN video_index.playlist_ids || new_playlist_id
                            ELSE video_index.playlist_ids
                          END,
      last_seen_at      = now();
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) FROM public;

GRANT EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) TO service_role;

CREATE INDEX IF NOT EXISTS video_index_playlist_ids_gin ON video_index USING GIN (playlist_ids);
