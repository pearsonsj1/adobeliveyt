/*
  # Update upsert_video_index to handle stream metadata fields

  Updates the upsert function to also write is_live_stream, scheduled_time,
  actual_start_time, and stream_status when provided in the payload.
*/

CREATE OR REPLACE FUNCTION upsert_video_index(videos jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  FOR v IN SELECT * FROM jsonb_array_elements(videos)
  LOOP
    INSERT INTO video_index (
      id, title, description, thumbnail_url, video_url, published_at,
      duration, tags, is_live_stream, scheduled_time, actual_start_time,
      stream_status, first_seen_at, last_seen_at
    )
    VALUES (
      v->>'id',
      COALESCE(v->>'title', ''),
      COALESCE(v->>'description', ''),
      COALESCE(v->>'thumbnail_url', ''),
      COALESCE(v->>'video_url', ''),
      CASE WHEN v->>'published_at' IS NOT NULL THEN (v->>'published_at')::timestamptz ELSE NULL END,
      COALESCE(v->>'duration', ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(v->'tags')), '{}'),
      COALESCE((v->>'is_live_stream')::boolean, false),
      CASE WHEN v->>'scheduled_time' IS NOT NULL THEN (v->>'scheduled_time')::timestamptz ELSE NULL END,
      CASE WHEN v->>'actual_start_time' IS NOT NULL THEN (v->>'actual_start_time')::timestamptz ELSE NULL END,
      v->>'stream_status',
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
      last_seen_at      = now();
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_video_index(jsonb) TO anon, authenticated;
