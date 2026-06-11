-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Hiring Manager Profiles
CREATE TABLE public.hiring_manager_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hiring_manager_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hiring managers can read own profile" 
    ON public.hiring_manager_profiles 
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Hiring managers can insert own profile" 
    ON public.hiring_manager_profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Hiring managers can update own profile" 
    ON public.hiring_manager_profiles 
    FOR UPDATE 
    USING (auth.uid() = id);

-- 2. Job Postings
CREATE TABLE public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hiring_manager_id UUID NOT NULL REFERENCES public.hiring_manager_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hiring managers can read own job postings" 
    ON public.job_postings 
    FOR SELECT 
    USING (auth.uid() = hiring_manager_id);

CREATE POLICY "Hiring managers can insert own job postings" 
    ON public.job_postings 
    FOR INSERT 
    WITH CHECK (auth.uid() = hiring_manager_id);

CREATE POLICY "Hiring managers can update own job postings" 
    ON public.job_postings 
    FOR UPDATE 
    USING (auth.uid() = hiring_manager_id);

CREATE POLICY "Hiring managers can delete own job postings" 
    ON public.job_postings 
    FOR DELETE 
    USING (auth.uid() = hiring_manager_id);

-- 3. CV Submissions
CREATE TABLE public.cv_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    parsed_json JSONB NOT NULL,
    embedding VECTOR(1536),
    composite_score FLOAT,
    skills_score FLOAT,
    seniority_score FLOAT,
    trajectory_score FLOAT,
    culture_score FLOAT,
    archetype TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    anonymized_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cv_submissions ENABLE ROW LEVEL SECURITY;

-- Hiring manager can read/update/delete CV submissions if they own the job posting
CREATE POLICY "Hiring managers can read CVs for their job postings" 
    ON public.cv_submissions 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.job_postings 
            WHERE job_postings.id = cv_submissions.job_posting_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can insert CVs for their job postings" 
    ON public.cv_submissions 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.job_postings 
            WHERE job_postings.id = cv_submissions.job_posting_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can update CVs for their job postings" 
    ON public.cv_submissions 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.job_postings 
            WHERE job_postings.id = cv_submissions.job_posting_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can delete CVs for their job postings" 
    ON public.cv_submissions 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.job_postings 
            WHERE job_postings.id = cv_submissions.job_posting_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

-- Add index on vector embedding
CREATE INDEX ON public.cv_submissions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Candidate Outreach
CREATE TABLE public.candidate_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_submission_id UUID NOT NULL REFERENCES public.cv_submissions(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.candidate_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hiring managers can read outreach for their CVs" 
    ON public.candidate_outreach 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            JOIN public.job_postings ON cv_submissions.job_posting_id = job_postings.id
            WHERE cv_submissions.id = candidate_outreach.cv_submission_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can insert outreach for their CVs" 
    ON public.candidate_outreach 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            JOIN public.job_postings ON cv_submissions.job_posting_id = job_postings.id
            WHERE cv_submissions.id = candidate_outreach.cv_submission_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can update outreach for their CVs" 
    ON public.candidate_outreach 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            JOIN public.job_postings ON cv_submissions.job_posting_id = job_postings.id
            WHERE cv_submissions.id = candidate_outreach.cv_submission_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can delete outreach for their CVs" 
    ON public.candidate_outreach 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            JOIN public.job_postings ON cv_submissions.job_posting_id = job_postings.id
            WHERE cv_submissions.id = candidate_outreach.cv_submission_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );
