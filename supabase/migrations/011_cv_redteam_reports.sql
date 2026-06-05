CREATE TABLE public.cv_redteam_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  cv_variant_id uuid REFERENCES public.user_cv_variants NOT NULL,
  attack_surface_score integer,
  attacks jsonb,
  patches jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cv_redteam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner only" ON public.cv_redteam_reports 
FOR ALL USING (auth.uid() = user_id);
