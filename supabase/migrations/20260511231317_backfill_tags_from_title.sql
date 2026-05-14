/*
  # Backfill tags from video titles

  Many videos were indexed before robust tagging was in place and have tags = '{}'. 
  This migration applies the same series/tool pattern matching used in the edge function
  directly against existing titles so the calendar shows correct historical data.

  Rules (matching edge function logic):
  - Series patterns are checked first (title + description); if matched, only that series tag is set
  - Tool keywords are matched against title only to avoid description boilerplate false positives
  - Only updates rows where tags is currently empty
*/

UPDATE video_index
SET tags = CASE
  -- Series patterns (checked in priority order, first match wins)
  WHEN title ~* 'office hours'       THEN ARRAY['Office Hours']
  WHEN title ~* 'file new'           THEN ARRAY['File New']
  WHEN title ~* 'on the spot'        THEN ARRAY['On the Spot']
  WHEN title ~* 'feature friday'     THEN ARRAY['Feature Friday']
  WHEN title ~* 'cinema collective'  THEN ARRAY['Cinema Collective']
  WHEN title ~* 'studio sessions'    THEN ARRAY['Studio Sessions']
  WHEN title ~* '\ythe unlock\y'     THEN ARRAY['The Unlock']
  WHEN title ~* 'brand slam'         THEN ARRAY['Brand Slam']
  WHEN title ~* 'wrap[\s\-]?up'      THEN ARRAY['The Wrap-Up']
  WHEN title ~* 'education edition'  THEN ARRAY['Education Edition']
  -- Tool keywords (title only)
  ELSE (
    SELECT COALESCE(array_agg(tag ORDER BY ord), '{}')
    FROM (VALUES
      (1,  'Photoshop',    'photoshop'),
      (2,  'Illustrator',  'illustrator'),
      (3,  'After Effects','after effects'),
      (4,  'Premiere',     'premiere'),
      (5,  'Lightroom',    'lightroom'),
      (6,  'Firefly',      'firefly'),
      (7,  'Express',      'adobe express'),
      (8,  'InDesign',     'indesign'),
      (9,  'Fresco',       'fresco'),
      (10, 'Substance',    'substance'),
      (11, 'Acrobat',      'acrobat'),
      (12, 'Dimension',    'dimension')
    ) AS kw(ord, tag, kw)
    WHERE lower(video_index.title) LIKE '%' || kw || '%'
  )
END
WHERE tags = '{}';
