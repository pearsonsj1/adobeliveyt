/*
  # Backfill tool tags for series videos

  Series videos previously only stored the series name as their sole tag (e.g., ["Office Hours"]).
  This migration re-infers tool tags from the video title and appends them after the series name
  so the video library filter page can surface series episodes when filtering by tool.

  ## Changes
  - For every video whose first tag is a known series name, extract tool keywords from the title
    and append them to the tags array (series name stays first for the video card badge).
  - Non-series videos are unchanged.

  ## Tool keyword mapping (mirrors index-all-videos inferTags)
  Photoshop, Illustrator, After Effects, Premiere, Lightroom, Firefly,
  Adobe Express, InDesign, Fresco, Substance, Acrobat, Dimension
*/

UPDATE video_index
SET tags = (
  ARRAY[tags[1]] ||
  ARRAY(
    SELECT t FROM unnest(ARRAY[
      CASE WHEN lower(title) LIKE '%photoshop%'    THEN 'Photoshop'    END,
      CASE WHEN lower(title) LIKE '%illustrator%'  THEN 'Illustrator'  END,
      CASE WHEN lower(title) LIKE '%after effects%' THEN 'After Effects' END,
      CASE WHEN lower(title) LIKE '%premiere%'     THEN 'Premiere'     END,
      CASE WHEN lower(title) LIKE '%lightroom%'    THEN 'Lightroom'    END,
      CASE WHEN lower(title) LIKE '%firefly%'      THEN 'Firefly'      END,
      CASE WHEN lower(title) LIKE '%adobe express%' THEN 'Express'     END,
      CASE WHEN lower(title) LIKE '%indesign%'     THEN 'InDesign'     END,
      CASE WHEN lower(title) LIKE '%fresco%'       THEN 'Fresco'       END,
      CASE WHEN lower(title) LIKE '%substance%'    THEN 'Substance'    END,
      CASE WHEN lower(title) LIKE '%acrobat%'      THEN 'Acrobat'      END,
      CASE WHEN lower(title) LIKE '%dimension%'    THEN 'Dimension'    END
    ]) AS t
    WHERE t IS NOT NULL
  )
)
WHERE
  array_length(tags, 1) >= 1
  AND tags[1] IN (
    'File New', 'Office Hours', 'On the Spot', 'Feature Friday',
    'Cinema Collective', 'Studio Sessions', 'The Unlock', 'Brand Slam',
    'The Wrap-Up', 'Education Edition'
  );
