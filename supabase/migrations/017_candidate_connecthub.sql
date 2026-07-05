-- Add candidate_id to link cv_submissions to the authenticated candidate
ALTER TABLE public.cv_submissions
  ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1. CV Submissions: Candidate can read their own submissions
CREATE POLICY "Candidates can read their own CV submissions" 
    ON public.cv_submissions 
    FOR SELECT 
    USING (candidate_id = auth.uid());

-- 2. Conversations: Candidate can read conversations linked to their CVs
-- where there is at least one message (so they only see initiated chats)
CREATE POLICY "Candidates can read their own conversations" 
    ON public.conversations 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions 
            WHERE cv_submissions.id = conversations.cv_submission_id 
            AND cv_submissions.candidate_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.messages
            WHERE messages.conversation_id = conversations.id
            AND messages.is_system_message = false
        )
    );

-- 3. Messages: Candidate can read messages in their conversations
CREATE POLICY "Candidates can read messages in their conversations" 
    ON public.messages 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            JOIN public.cv_submissions ON conversations.cv_submission_id = cv_submissions.id
            WHERE conversations.id = messages.conversation_id 
            AND cv_submissions.candidate_id = auth.uid()
        )
    );

-- 4. Messages: Candidate can insert messages in their conversations
CREATE POLICY "Candidates can insert messages" 
    ON public.messages 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            JOIN public.cv_submissions ON conversations.cv_submission_id = cv_submissions.id
            WHERE conversations.id = messages.conversation_id 
            AND cv_submissions.candidate_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

-- 5. Async Video Screens: Candidate can read their requests
CREATE POLICY "Candidates can read their video screens" 
    ON public.async_video_screens 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            WHERE cv_submissions.id = async_video_screens.cv_submission_id 
            AND cv_submissions.candidate_id = auth.uid()
        )
    );

-- 6. Async Video Screens: Candidate can update their requests to attach video
CREATE POLICY "Candidates can update their video screens" 
    ON public.async_video_screens 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            WHERE cv_submissions.id = async_video_screens.cv_submission_id 
            AND cv_submissions.candidate_id = auth.uid()
        )
    );

-- Reload PostgREST
NOTIFY pgrst, 'reload schema';
