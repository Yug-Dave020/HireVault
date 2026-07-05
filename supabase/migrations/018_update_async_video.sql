-- Make video_storage_path nullable to support creating a request before the candidate uploads a video
ALTER TABLE public.async_video_screens ALTER COLUMN video_storage_path DROP NOT NULL;

-- Reload PostgREST schema
NOTIFY pgrst, 'reload schema';
