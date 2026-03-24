CREATE TABLE IF NOT EXISTS social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  platform_user_id text NOT NULL,
  platform_name text,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  page_id text,
  ig_account_id text,
  scopes text[],
  connected_by_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, platform_user_id)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (posting code uses service client)
-- Authenticated users can read (for the admin UI)
CREATE POLICY "Authenticated users can read social_connections"
  ON social_connections FOR SELECT
  TO authenticated
  USING (true);
