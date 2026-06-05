CREATE TABLE public.negotiation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  company_name text NOT NULL,
  role_title text NOT NULL,
  base_offer integer NOT NULL,
  hidden_budget integer NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.negotiation_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.negotiation_sessions NOT NULL,
  message_owner text NOT NULL,
  content text NOT NULL,
  current_offer integer,
  feedback_score integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.negotiation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner only sessions" ON public.negotiation_sessions 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "owner only transcripts" ON public.negotiation_transcripts 
FOR ALL USING (session_id IN (SELECT id FROM public.negotiation_sessions WHERE user_id = auth.uid()));
