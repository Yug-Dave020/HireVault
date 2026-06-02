ALTER TABLE user_cv_variants
ADD COLUMN IF NOT EXISTS cached_ats_score integer,
ADD COLUMN IF NOT EXISTS cached_critiques jsonb;
