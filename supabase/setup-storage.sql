-- Photo Pro — Storage Bucket Setup
-- Run this in the Supabase SQL Editor AFTER running the main migration

-- Create the photos storage bucket (public, so social platforms can access URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10485760, -- 10 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to upload/delete (webhook handler uses service role)
CREATE POLICY "Service role can upload photos"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Service role can update photos"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'photos');

CREATE POLICY "Service role can delete photos"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'photos');

-- Allow public read access (needed for social media platforms to fetch images)
CREATE POLICY "Public can read photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'photos');

-- Allow authenticated users to read (for dashboard)
CREATE POLICY "Authenticated can read photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'photos');
