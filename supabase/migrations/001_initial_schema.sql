CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TYPE application_status AS ENUM (
  'saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn'
);

CREATE TYPE content_status AS ENUM (
  'draft', 'approved', 'posted'
);

CREATE TYPE subscription_tier AS ENUM (
  'free', 'pro', 'elite'
);

CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_id            TEXT UNIQUE,
  headline               TEXT,
  summary                TEXT,
  raw_data               JSONB,
  voice_profile          JSONB,
  ats_score              SMALLINT CHECK (ats_score BETWEEN 0 AND 100),
  drift_score            SMALLINT CHECK (drift_score BETWEEN 0 AND 100),
  subscription_tier      subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  last_synced_at         TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_linkedin_id ON profiles (linkedin_id);

CREATE TABLE IF NOT EXISTS skills (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  endorsed_count INTEGER NOT NULL DEFAULT 0,
  ai_suggested   BOOLEAN NOT NULL DEFAULT FALSE,
  trend_score    NUMERIC(5, 2) CHECK (trend_score BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_skills_user_id ON skills (user_id);

CREATE TABLE IF NOT EXISTS job_applications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_title      TEXT NOT NULL,
  company        TEXT NOT NULL,
  jd_text        TEXT NOT NULL,
  match_score    SMALLINT CHECK (match_score BETWEEN 0 AND 100),
  human_score    SMALLINT CHECK (human_score BETWEEN 0 AND 100),
  resume_version JSONB,
  cover_letter   TEXT,
  status         application_status NOT NULL DEFAULT 'saved',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_applications_user_id ON job_applications (user_id);

CREATE TABLE IF NOT EXISTS skill_trends (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_name TEXT NOT NULL,
  role       TEXT NOT NULL,
  location   TEXT NOT NULL,
  frequency  INTEGER NOT NULL,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_trends_lookup ON skill_trends (skill_name, role, sampled_at DESC);

CREATE TABLE IF NOT EXISTS content_calendar (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_text        TEXT NOT NULL,
  topic            TEXT NOT NULL,
  scheduled_for    TIMESTAMPTZ NOT NULL,
  status           content_status NOT NULL DEFAULT 'draft',
  posted_at        TIMESTAMPTZ,
  linkedin_post_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_calendar_user_id ON content_calendar (user_id);
CREATE INDEX idx_content_calendar_status  ON content_calendar (user_id, status);

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_job_applications
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_content_calendar
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
