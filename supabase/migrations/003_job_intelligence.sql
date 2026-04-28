create table if not exists job_listings (
  id uuid default gen_random_uuid() primary key,
  title text,
  company text,
  location text,
  board text,
  jd_raw text,
  jd_analyzed jsonb,
  required_skills text[],
  experience_level text,
  salary_range text,
  posted_at timestamptz,
  scraped_at timestamptz default now(),
  url text unique
);

create table if not exists user_profiles (
  id uuid references auth.users primary key,
  full_name text,
  target_roles text[],
  target_locations text[],
  skills text[],
  experience_years integer,
  education jsonb,
  experience jsonb,
  languages text[],
  salary_expectation text,
  voice_profile jsonb,
  updated_at timestamptz default now()
);

create table if not exists generated_cvs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  job_listing_id uuid references job_listings,
  cv_content jsonb,
  pdf_url text,
  docx_url text,
  ats_score integer,
  human_score integer,
  cover_letter text,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_job_listings_board ON job_listings (board, scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_cvs_user ON generated_cvs (user_id, created_at DESC);
