-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Candidates can read their own conversations" ON public.conversations;

-- Recreate it without the recursive query to messages
CREATE POLICY "Candidates can read their own conversations" 
    ON public.conversations 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.cv_submissions 
            WHERE cv_submissions.id = conversations.cv_submission_id 
            AND cv_submissions.candidate_id = auth.uid()
        )
    );

NOTIFY pgrst, 'reload schema';
