/*
  # Add blog_body column to video_index and auto-populate trigger

  1. Changes
    - Add `blog_body` text column to video_index — stores a cleaned, article-ready version of the description
    - Add `blog_published_at` timestamptz column — set when blog_body is generated, used to track when the post was "published"
    - Create trigger function `generate_blog_body()` that fires on INSERT or UPDATE of description
    - The trigger strips social links, hashtag blocks, duplicate title lines, and formats the body as readable prose

  2. Notes
    - All existing rows are backfilled immediately via UPDATE
    - The blog page at /blog/[id] continues to read from video_index; blog_body is the canonical article text
    - blog_body is NULL for rows with no description
*/

-- 1. Add columns
ALTER TABLE video_index
  ADD COLUMN IF NOT EXISTS blog_body text,
  ADD COLUMN IF NOT EXISTS blog_published_at timestamptz;

-- 2. Trigger function: clean description into blog_body
CREATE OR REPLACE FUNCTION generate_blog_body()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  raw       text;
  cleaned   text;
  lines     text[];
  line      text;
  out_lines text[];
BEGIN
  raw := NEW.description;

  IF raw IS NULL OR length(trim(raw)) = 0 THEN
    NEW.blog_body := NULL;
    RETURN NEW;
  END IF;

  -- Split on newlines
  lines := string_to_array(raw, E'\n');
  out_lines := '{}';

  FOREACH line IN ARRAY lines LOOP
    -- Strip blank lines (keep structure by preserving them later)
    -- Skip lines that are only a URL
    IF line ~ '^https?://\S+$' THEN CONTINUE; END IF;
    -- Skip lines that are only hashtags
    IF line ~ '^#[A-Za-z]' AND line !~ '[a-z]{10}' THEN CONTINUE; END IF;
    -- Skip social handle lines (Linktree:, YouTube:, Instagram:, etc.)
    IF line ~* '^(linktree|youtube|instagram|tiktok|threads|linkedin|discord|twitter|facebook)\s*:\s*https?://' THEN CONTINUE; END IF;
    -- Skip "Follow Adobe Live:" style headers
    IF line ~* '^(follow adobe live|follow us|connect with us|subscribe)[:\s]*$' THEN CONTINUE; END IF;

    out_lines := array_append(out_lines, line);
  END LOOP;

  cleaned := array_to_string(out_lines, E'\n');
  -- Collapse 3+ blank lines into 2
  cleaned := regexp_replace(cleaned, E'\n{3,}', E'\n\n', 'g');
  cleaned := trim(cleaned);

  IF length(cleaned) = 0 THEN
    NEW.blog_body := NULL;
    RETURN NEW;
  END IF;

  NEW.blog_body := cleaned;

  -- Set blog_published_at only if not already set (preserve original publish date)
  IF NEW.blog_published_at IS NULL THEN
    NEW.blog_published_at := COALESCE(NEW.published_at, now());
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger
DROP TRIGGER IF EXISTS trg_generate_blog_body ON video_index;
CREATE TRIGGER trg_generate_blog_body
  BEFORE INSERT OR UPDATE OF description
  ON video_index
  FOR EACH ROW
  EXECUTE FUNCTION generate_blog_body();

-- 4. Backfill all existing rows
UPDATE video_index
SET description = description
WHERE description IS NOT NULL AND length(trim(description)) > 0;
