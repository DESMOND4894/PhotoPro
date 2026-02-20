-- Photo Pro — Celtic Quest WhatsApp Photo Bot
-- Initial database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trips table: one record per boat per trip session
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boat TEXT NOT NULL CHECK (boat IN ('Celtic Quest IV', 'Celtic Grace')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  trip_time TEXT NOT NULL CHECK (trip_time IN ('morning', 'afternoon')),
  photo_count INTEGER NOT NULL DEFAULT 0,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  caption TEXT,
  caption_facebook TEXT,
  caption_instagram TEXT,
  caption_tiktok TEXT,
  status TEXT NOT NULL DEFAULT 'receiving' CHECK (status IN ('receiving', 'pending', 'approved', 'posting', 'posted', 'skipped')),
  approved_at TIMESTAMPTZ,
  posted_to TEXT[] NOT NULL DEFAULT '{}',
  platforms_enabled TEXT[] NOT NULL DEFAULT '{facebook,instagram,tiktok}',
  crew_notes TEXT,
  weather_summary TEXT,
  batch_complete BOOLEAN NOT NULL DEFAULT FALSE,
  last_photo_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One trip per boat per time slot per day
  UNIQUE (boat, date, trip_time)
);

-- Photos table: individual photos within a trip
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  whatsapp_media_id TEXT NOT NULL,
  image_hash TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  watermarked_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Caption history: track all generated captions for variety
CREATE TABLE caption_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  boat TEXT NOT NULL,
  caption TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posting log: track publishing status per platform
CREATE TABLE posting_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok')),
  platform_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posting', 'posted', 'failed')),
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (trip_id, platform)
);

-- Indexes for common queries
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_date ON trips(date DESC);
CREATE INDEX idx_trips_boat_date ON trips(boat, date DESC);
CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_photos_image_hash ON photos(image_hash) WHERE image_hash IS NOT NULL;
CREATE INDEX idx_posting_log_trip ON posting_log(trip_id);
CREATE INDEX idx_posting_log_scheduled ON posting_log(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_caption_history_boat ON caption_history(boat, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE caption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_log ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read all, service role can write
CREATE POLICY "Authenticated users can read trips"
  ON trips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage trips"
  ON trips FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read photos"
  ON photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage photos"
  ON photos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read caption history"
  ON caption_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage caption history"
  ON caption_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read posting log"
  ON posting_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage posting log"
  ON posting_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can update trip status (for dashboard approve/skip)
CREATE POLICY "Authenticated users can update trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storage bucket setup instructions (run via Supabase dashboard or API):
-- 1. Create bucket: "photos" (public)
-- 2. Set lifecycle policy: auto-delete objects older than 30 days
-- 3. Allow service_role full access
-- 4. Allow authenticated users read access
