/*
  # Add upsert function for video_index

  Creates a SECURITY DEFINER function so the anon key (used by Next.js
  server-side code) can upsert rows into video_index without needing the
  service role key. The function runs with elevated privileges internally
  but only accepts a well-typed JSON payload.

  ## New Functions
  - `upsert_video_index(videos jsonb)` — accepts an array of video objects
    and upserts them into video_index, updating last_seen_at each time.
    first_seen_at is only set on first insert.

  ## Security
  - SECURITY DEFINER — runs as the function owner (postgres) bypassing RLS
  - GRANT EXECUTE to anon, authenticated — callable from the server-side
    Next.js app using the anon key
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
    INSERT INTO video_index (id, title, description, thumbnail_url, video_url, published_at, duration, tags, first_seen_at, last_seen_at)
    VALUES (
      v->>'id',
      COALESCE(v->>'title', ''),
      COALESCE(v->>'description', ''),
      COALESCE(v->>'thumbnail_url', ''),
      COALESCE(v->>'video_url', ''),
      CASE WHEN v->>'published_at' IS NOT NULL THEN (v->>'published_at')::timestamptz ELSE NULL END,
      COALESCE(v->>'duration', ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(v->'tags')), '{}'),
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      title         = EXCLUDED.title,
      description   = EXCLUDED.description,
      thumbnail_url = EXCLUDED.thumbnail_url,
      video_url     = EXCLUDED.video_url,
      published_at  = COALESCE(EXCLUDED.published_at, video_index.published_at),
      duration      = EXCLUDED.duration,
      tags          = EXCLUDED.tags,
      last_seen_at  = now();
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_video_index(jsonb) TO anon, authenticated;
