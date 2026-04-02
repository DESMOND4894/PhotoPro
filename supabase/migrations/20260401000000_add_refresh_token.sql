ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS refresh_token text;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS refresh_token_expires_at timestamptz;
