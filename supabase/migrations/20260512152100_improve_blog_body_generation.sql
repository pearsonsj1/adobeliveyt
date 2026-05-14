/*
  # Improve blog_body generation

  1. Changes
    - Rewrites the generate_blog_body() trigger function with better paragraph preservation
    - Keeps double-newline paragraph breaks intact (critical for BlogPostBody parser)
    - Strips: lone URLs, hashtag-only lines, social handle lines (Linktree:, Instagram:, etc.)
    - Does NOT strip lines that contain real content mixed with links
    - Backtracks blog_body for all existing rows

  2. Notes
    - The BlogPostBody React parser splits on \n\n to get paragraph blocks
    - Preserving double newlines here means paragraphs render correctly on the frontend
*/

CREATE OR REPLACE FUNCTION generate_blog_body()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  raw         text;
  lines       text[];
  line        text;
  out_lines   text[];
  cleaned     text;
BEGIN
  raw := COALESCE(NEW.description, '');

  IF length(trim(raw)) = 0 THEN
    NEW.blog_body := NULL;
    RETURN NEW;
  END IF;

  lines := string_to_array(raw, E'\n');
  out_lines := '{}';

  FOREACH line IN ARRAY lines LOOP
    -- Keep blank lines (they separate paragraphs)
    IF trim(line) = '' THEN
      out_lines := array_append(out_lines, '');
      CONTINUE;
    END IF;

    -- Skip lines that are ONLY a bare URL
    IF trim(line) ~ '^https?://\S+$' THEN CONTINUE; END IF;

    -- Skip lines that are ONLY hashtags (e.g. "#Photoshop #adobe #tutorial")
    IF trim(line) ~ '^(#[A-Za-z0-9_]+\s*)+$' THEN CONTINUE; END IF;

    -- Skip social handle lines: "Instagram: https://..." or "Linktree: ..."
    IF trim(line) ~* '^(linktree|youtube|instagram|tiktok|threads|linkedin|discord|twitter|facebook|x\.com)\s*:\s*(https?://\S+)?$' THEN CONTINUE; END IF;

    -- Skip standalone "Follow Adobe Live:" headers
    IF trim(line) ~* '^(follow adobe live|follow us|connect with us|stay connected)[:\s]*$' THEN CONTINUE; END IF;

    out_lines := array_append(out_lines, line);
  END LOOP;

  -- Join lines back
  cleaned := array_to_string(out_lines, E'\n');

  -- Collapse 3+ consecutive blank lines into exactly 2
  WHILE cleaned ~ E'\n{3,}' LOOP
    cleaned := regexp_replace(cleaned, E'\n{3,}', E'\n\n', 'g');
  END LOOP;

  -- Trim leading/trailing whitespace
  cleaned := trim(cleaned);

  IF length(cleaned) = 0 THEN
    NEW.blog_body := NULL;
    RETURN NEW;
  END IF;

  NEW.blog_body := cleaned;

  IF NEW.blog_published_at IS NULL THEN
    NEW.blog_published_at := COALESCE(NEW.published_at, now());
  END IF;

  RETURN NEW;
END;
$$;

-- Re-trigger all rows with a non-empty description to regenerate blog_body
UPDATE video_index
SET description = description
WHERE description IS NOT NULL AND length(trim(description)) > 0;
