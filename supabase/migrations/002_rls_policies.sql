ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_trends     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: update own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: delete own" ON profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "skills: select own" ON skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "skills: insert own" ON skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skills: update own" ON skills FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skills: delete own" ON skills FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "job_applications: select own" ON job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "job_applications: insert own" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_applications: update own" ON job_applications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_applications: delete own" ON job_applications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "skill_trends: public read" ON skill_trends FOR SELECT USING (true);

CREATE POLICY "content_calendar: select own" ON content_calendar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "content_calendar: insert own" ON content_calendar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_calendar: update own" ON content_calendar FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_calendar: delete own" ON content_calendar FOR DELETE USING (auth.uid() = user_id);
