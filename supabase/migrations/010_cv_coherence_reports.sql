CREATE TABLE public.cv_coherence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  cv_variant_id uuid REFERENCES public.user_cv_variants NOT NULL,
  score integer,
  skill_orphans jsonb,
  experience_underclaimed jsonb,
  impact_gap jsonb,
  timeline_flags jsonb,
  seniority_mismatch jsonb,
  keyword_density_flag boolean,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cv_coherence_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner only" ON public.cv_coherence_reports 
FOR ALL USING (auth.uid() = user_id);
