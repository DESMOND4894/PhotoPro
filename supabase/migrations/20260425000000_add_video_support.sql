-- Add video support to the photos table.
-- Photos and videos share the same row shape; the only differences are
-- media_type and (for videos) duration_seconds. image_hash / watermarked_url
-- stay null for videos.

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_photos_media_type ON photos(media_type);
