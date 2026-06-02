-- Add public profile columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create index for quick lookups by username
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles (username);

-- RLS Policy: Allow anyone to read profiles that are marked as public
CREATE POLICY "user_profiles: public read if is_public" ON user_profiles FOR SELECT USING (is_public = true);
