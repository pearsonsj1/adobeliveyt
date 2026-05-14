/*
  # Decode HTML entities in video_index

  Cleans existing title and description values in video_index that contain
  raw HTML entities from the YouTube API (&#39; → ', &amp; → &, etc.).
*/

UPDATE video_index
SET
  title = replace(replace(replace(replace(replace(replace(replace(
    title,
    '&#39;', ''''),
    '&amp;', '&'),
    '&quot;', '"'),
    '&lt;', '<'),
    '&gt;', '>'),
    '&#x2F;', '/'),
    '&#x27;', '''')
WHERE title ~ '&#|&amp;|&quot;|&lt;|&gt;';

UPDATE video_index
SET
  description = replace(replace(replace(replace(replace(replace(replace(
    description,
    '&#39;', ''''),
    '&amp;', '&'),
    '&quot;', '"'),
    '&lt;', '<'),
    '&gt;', '>'),
    '&#x2F;', '/'),
    '&#x27;', '''')
WHERE description ~ '&#|&amp;|&quot;|&lt;|&gt;';
