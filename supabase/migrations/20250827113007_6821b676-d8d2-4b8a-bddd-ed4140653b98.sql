-- Add lesson_id to quizzes table to support lesson-wise quizzes
ALTER TABLE public.quizzes ADD COLUMN lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Create quiz_analytics table for tracking quiz performance
CREATE TABLE IF NOT EXISTS public.quiz_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  selected_answer text,
  correct_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  time_spent_seconds integer DEFAULT 0,
  attempt_number integer DEFAULT 1,
  recorded_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for quiz_analytics
DROP POLICY IF EXISTS "Teachers can view analytics for their quizzes" ON public.quiz_analytics;
CREATE POLICY "Teachers can view analytics for their quizzes"
ON public.quiz_analytics FOR SELECT
USING (
  quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN subjects s ON q.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR is_principal()
);

DROP POLICY IF EXISTS "System can insert analytics" ON public.quiz_analytics;
CREATE POLICY "System can insert analytics"
ON public.quiz_analytics FOR INSERT
WITH CHECK (true);

-- Create quiz_feedback table for detailed feedback
CREATE TABLE IF NOT EXISTS public.quiz_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  overall_feedback text,
  question_feedback jsonb DEFAULT '[]'::jsonb,
  improvement_suggestions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.quiz_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for quiz_feedback
DROP POLICY IF EXISTS "Students can view their own feedback" ON public.quiz_feedback;
CREATE POLICY "Students can view their own feedback"
ON public.quiz_feedback FOR SELECT
USING (
  quiz_attempt_id IN (
    SELECT qa.id FROM quiz_attempts qa
    JOIN profiles p ON qa.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can manage feedback for their quizzes" ON public.quiz_feedback;
CREATE POLICY "Teachers can manage feedback for their quizzes"
ON public.quiz_feedback FOR ALL
USING (
  quiz_attempt_id IN (
    SELECT qa.id FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN subjects s ON q.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR is_principal()
);

-- Add more columns to quizzes for advanced features
ALTER TABLE public.quizzes ADD COLUMN quiz_type text DEFAULT 'practice' CHECK (quiz_type IN ('practice', 'assessment', 'homework', 'exam'));
ALTER TABLE public.quizzes ADD COLUMN randomize_questions boolean DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN randomize_answers boolean DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN show_correct_answers boolean DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN allow_review boolean DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN passing_score numeric DEFAULT 60.00;
ALTER TABLE public.quizzes ADD COLUMN availability_start timestamp with time zone;
ALTER TABLE public.quizzes ADD COLUMN availability_end timestamp with time zone;
ALTER TABLE public.quizzes ADD COLUMN instructions text;
ALTER TABLE public.quizzes ADD COLUMN is_active boolean DEFAULT true;

-- Update quiz_attempts table with more fields
ALTER TABLE public.quiz_attempts ADD COLUMN time_started timestamp with time zone DEFAULT now();
ALTER TABLE public.quiz_attempts ADD COLUMN time_limit_minutes integer;
ALTER TABLE public.quiz_attempts ADD COLUMN auto_submitted boolean DEFAULT false;
ALTER TABLE public.quiz_attempts ADD COLUMN feedback_viewed boolean DEFAULT false;