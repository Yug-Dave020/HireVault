-- Add INSERT policy for Hiring Managers on async_video_screens
CREATE POLICY "Hiring managers can insert async video screens" 
    ON public.async_video_screens 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cv_submissions
            JOIN public.job_postings ON cv_submissions.job_posting_id = job_postings.id
            WHERE cv_submissions.id = async_video_screens.cv_submission_id 
            AND job_postings.hiring_manager_id = auth.uid()
        )
    );

NOTIFY pgrst, 'reload schema';
