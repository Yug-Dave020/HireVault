CREATE TABLE public.jd_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  company_name text NOT NULL,
  role_title text NOT NULL,
  source_url text NOT NULL,
  scraped_text text NOT NULL,
  drifts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jd_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner only" ON public.jd_snapshots 
FOR ALL USING (auth.uid() = user_id);
