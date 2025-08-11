-- Drop unused table video_progress (quizzes retained as requested)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'video_progress'
  ) THEN
    DROP TABLE public.video_progress;
  END IF;
END $$;