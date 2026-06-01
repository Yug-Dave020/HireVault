-- Extend user_profiles table for CV structures
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS cv_profile jsonb,
  ADD COLUMN IF NOT EXISTS design_prefs jsonb,
  ADD COLUMN IF NOT EXISTS parse_mode text CHECK (parse_mode IN ('uploaded', 'scratch'));

-- Alter generated_cvs to drop job_listings FK constraint and make column optional or drop it
ALTER TABLE generated_cvs
  DROP CONSTRAINT IF EXISTS generated_cvs_job_listing_id_fkey,
  DROP COLUMN IF EXISTS job_listing_id;

-- Drop job listings table and its indexes to remove all job board scraping footprints
DROP INDEX IF EXISTS idx_job_listings_board;
DROP TABLE IF EXISTS job_listings;
