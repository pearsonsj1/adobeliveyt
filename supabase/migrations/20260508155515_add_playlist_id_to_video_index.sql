/*
  # Add playlist_id to video_index and update upsert function

  1. Changes
    - `video_index`: add `playlist_ids` (text[]) column — a video can appear in
      multiple playlists so we accumulate them rather than overwrite
    - `upsert_video_index`: updated to accept an optional `playlist_id` field
      per video; on conflict it merges the new playlist_id into the existing
      array (no duplicates)

  2. Notes
    - Existing rows get an empty array default; no data is lost
    - The merge uses `array_append` + `array_remove` to keep the list distinct
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_index' AND column_name = 'playlist_ids'
  ) THEN
    ALTER TABLE video_index ADD COLUMN playlist_ids text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION upsert_video_index(videos jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
  new_playlist_id text;
BEGIN
  FOR v IN SELECT * FROM jsonb_array_elements(videos)
  LOOP
    new_playlist_id := v->>'playlist_id';

    INSERT INTO video_index (
      id, title, description, thumbnail_url, video_url,
      published_at, duration, tags, playlist_ids, first_seen_at, last_seen_at
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
      CASE WHEN new_playlist_id IS NOT NULL THEN ARRAY[new_playlist_id] ELSE '{}' END,
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
      playlist_ids  = CASE
                        WHEN new_playlist_id IS NOT NULL
                          AND NOT (video_index.playlist_ids @> ARRAY[new_playlist_id])
                        THEN video_index.playlist_ids || new_playlist_id
                        ELSE video_index.playlist_ids
                      END,
      last_seen_at  = now();
  END LOOP;
END;
$$;
