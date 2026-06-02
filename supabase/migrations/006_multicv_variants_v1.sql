CREATE TABLE IF NOT EXISTS user_cv_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  target_role text,
  target_company text,
  cv_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  username text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_cv_variants ENABLE ROW LEVEL SECURITY;

-- Owner CRUD Policy
CREATE POLICY "Users can manage their own CV variants"
  ON user_cv_variants
  FOR ALL
  USING (auth.uid() = user_id);

-- Public Read Policy
CREATE POLICY "Public visitors can read public CV variants"
  ON user_cv_variants
  FOR SELECT
  USING (is_public = true);
