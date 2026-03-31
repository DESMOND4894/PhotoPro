ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS public_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_slug TEXT,
  ADD COLUMN IF NOT EXISTS public_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_cover_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS public_title TEXT,
  ADD COLUMN IF NOT EXISTS public_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS public_crew_note TEXT,
  ADD COLUMN IF NOT EXISTS show_public_crew_note BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_review_url TEXT,
  ADD COLUMN IF NOT EXISTS public_tag_us_text TEXT,
  ADD COLUMN IF NOT EXISTS public_tag_us_url TEXT,
  ADD COLUMN IF NOT EXISTS public_book_again_url TEXT,
  ADD COLUMN IF NOT EXISTS public_copy_caption TEXT,
  ADD COLUMN IF NOT EXISTS public_copy_hashtags TEXT,
  ADD COLUMN IF NOT EXISTS featured_photo_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS public_species_tags JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION set_trip_public_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_slug IS NULL OR BTRIM(NEW.public_slug) = '' THEN
    NEW.public_slug := LOWER(
      REGEXP_REPLACE(
        CONCAT_WS('-', NEW.date::TEXT, NEW.boat, NEW.trip_time),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )
    );
    NEW.public_slug := REGEXP_REPLACE(NEW.public_slug, '(^-+|-+$)', '', 'g');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trips_set_public_slug ON trips;

CREATE TRIGGER trips_set_public_slug
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION set_trip_public_slug();

UPDATE trips
SET public_slug = LOWER(
  REGEXP_REPLACE(
    CONCAT_WS('-', date::TEXT, boat, trip_time),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  )
)
WHERE public_slug IS NULL OR BTRIM(public_slug) = '';

UPDATE trips
SET public_slug = REGEXP_REPLACE(public_slug, '(^-+|-+$)', '', 'g')
WHERE public_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_public_slug_unique
  ON trips(public_slug)
  WHERE public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_public_enabled_date
  ON trips(public_enabled, date DESC);
