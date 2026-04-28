ALTER TABLE job_listings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_cvs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_listings: public read" ON job_listings FOR SELECT USING (true);

CREATE POLICY "user_profiles: select own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles: insert own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles: update own" ON user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles: delete own" ON user_profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "generated_cvs: select own" ON generated_cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "generated_cvs: insert own" ON generated_cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generated_cvs: delete own" ON generated_cvs FOR DELETE USING (auth.uid() = user_id);
