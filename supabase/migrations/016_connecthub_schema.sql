-- 1. ConnectHub Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    hiring_manager_id UUID NOT NULL REFERENCES public.hiring_manager_profiles(id) ON DELETE CASCADE,
    cv_submission_id UUID NOT NULL REFERENCES public.cv_submissions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_posting_id, cv_submission_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hiring managers can read conversations for their job postings" 
    ON public.conversations 
    FOR SELECT 
    USING (hiring_manager_id = auth.uid());

CREATE POLICY "Hiring managers can insert conversations" 
    ON public.conversations 
    FOR INSERT 
    WITH CHECK (hiring_manager_id = auth.uid());

CREATE POLICY "Hiring managers can update conversations" 
    ON public.conversations 
    FOR UPDATE 
    USING (hiring_manager_id = auth.uid());

-- 2. ConnectHub Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL, -- Could be the hiring manager (auth.uid) or the candidate (if they authenticate, or an anon ID)
    content TEXT NOT NULL,
    is_system_message BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Note: In a real implementation we'd also have candidate RLS. For now, we restrict to HM.
CREATE POLICY "Hiring managers can read messages in their conversations" 
    ON public.messages 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can insert messages" 
    ON public.messages 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.hiring_manager_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

-- 3. ConnectHub Interview Sessions
CREATE TABLE IF NOT EXISTS public.employer_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    status TEXT NOT NULL DEFAULT 'proposed', -- proposed, confirmed, completed, cancelled
    livekit_room_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employer_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hiring managers can read interview sessions" 
    ON public.employer_interview_sessions 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = employer_interview_sessions.conversation_id 
            AND conversations.hiring_manager_id = auth.uid()
        )
    );

CREATE POLICY "Hiring managers can manage interview sessions" 
    ON public.employer_interview_sessions 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = employer_interview_sessions.conversation_id 
            AND conversations.hiring_manager_id = auth.uid()
        )
    );

-- 4. Interview Briefs (AI Generated)
CREATE TABLE IF NOT EXISTS public.interview_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL REFERENCES public.employer_interview_sessions(id) ON DELETE CASCADE,
    brief_content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.interview_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hiring managers can read interview briefs" 
    ON public.interview_briefs 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.employer_interview_sessions
            JOIN public.conversations ON employer_interview_sessions.conversation_id = conversations.id
            WHERE employer_interview_sessions.id = interview_briefs.interview_session_id 
            AND conversations.hiring_manager_id = auth.uid()
        )
    );

-- 5. Async Video Screens
CREATE TABLE IF NOT EXISTS public.async_video_screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_submission_id UUID NOT NULL REFERENCES public.cv_submissions(id) ON DELETE CASCADE,
    video_storage_path TEXT NOT NULL,
    transcript TEXT,
    ai_analysis JSONB,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, reviewed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.async_video_screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hiring managers can read async video screens" 
    ON public.async_video_screens 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            JOIN public.job_postings ON cv_submissions.job_posting_id = job_postings.id
            WHERE cv_submissions.id = async_video_screens.cv_submission_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

-- 6. Storage Bucket for Async Videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('async_videos', 'async_videos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Candidates can upload videos" 
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'async_videos' );

CREATE POLICY "Hiring managers can read videos" 
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'async_videos' );
NOTIFY pgrst, 'reload schema';

NOTIFY pgrst, 'reload schema';
