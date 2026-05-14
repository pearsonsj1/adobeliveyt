/*
  # Fix series tagging — override tool tags and catch all empty-tag rows

  Two issues with the previous backfill:
  1. Videos with series keywords in title but tagged as tools (series should always win)
  2. Empty-tag rows where cardinality(tags) = 0 but tags != '{}' was skipping them

  This migration:
  - Updates ALL videos where a series keyword appears in the title, regardless of current tags
  - Series patterns take absolute priority over tool tags (matching edge function logic)
*/

UPDATE video_index
SET tags = CASE
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
END
WHERE (
  title ~* 'office hours'
  OR title ~* 'file new'
  OR title ~* 'on the spot'
  OR title ~* 'feature friday'
  OR title ~* 'cinema collective'
  OR title ~* 'studio sessions'
  OR title ~* '\ythe unlock\y'
  OR title ~* 'brand slam'
  OR title ~* 'wrap[\s\-]?up'
  OR title ~* 'education edition'
);

-- Now fill remaining zero-cardinality rows with tool keywords (title only)
UPDATE video_index
SET tags = (
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
WHERE cardinality(tags) = 0;
