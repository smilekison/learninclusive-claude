-- Add accessibility fields to lessons table
ALTER TABLE public.lessons ADD COLUMN accessibility_features jsonb DEFAULT '{"screen_reader_compatible": true, "keyboard_navigation": true, "high_contrast_support": true}'::jsonb;
ALTER TABLE public.lessons ADD COLUMN estimated_duration_minutes integer DEFAULT 30;
ALTER TABLE public.lessons ADD COLUMN difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE public.lessons ADD COLUMN learning_objectives jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.lessons ADD COLUMN prerequisites jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.lessons ADD COLUMN rich_content jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.lessons ADD COLUMN interactive_elements jsonb DEFAULT '[]'::jsonb;

-- Create lesson_progress table for tracking student progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes integer DEFAULT 0,
  completed_at timestamp with time zone,
  last_accessed timestamp with time zone DEFAULT now(),
  accessibility_settings jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_progress
DROP POLICY IF EXISTS "Students can manage their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Students can manage their own lesson progress"
ON public.lesson_progress FOR ALL
USING (
  student_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can view lesson progress for their students" ON public.lesson_progress;
CREATE POLICY "Teachers can view lesson progress for their students"
ON public.lesson_progress FOR SELECT
USING (
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR is_principal()
);

-- Create student_quiz_sessions table for real-time quiz tracking
CREATE TABLE IF NOT EXISTS public.student_quiz_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL DEFAULT 1,
  session_data jsonb DEFAULT '{}'::jsonb,
  current_question_index integer DEFAULT 0,
  time_remaining_seconds integer,
  accessibility_settings jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  auto_submitted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for student_quiz_sessions
DROP POLICY IF EXISTS "Students can manage their own quiz sessions" ON public.student_quiz_sessions;
CREATE POLICY "Students can manage their own quiz sessions"
ON public.student_quiz_sessions FOR ALL
USING (
  student_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can view quiz sessions for their quizzes" ON public.student_quiz_sessions;
CREATE POLICY "Teachers can view quiz sessions for their quizzes"
ON public.student_quiz_sessions FOR SELECT
USING (
  quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN subjects s ON q.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR is_principal()
);

-- Add accessibility audit log table
CREATE TABLE IF NOT EXISTS public.accessibility_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  accessibility_feature text NOT NULL,
  context_data jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  screen_reader_detected boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accessibility_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for accessibility_audit_log
DROP POLICY IF EXISTS "Users can insert their own accessibility logs" ON public.accessibility_audit_log;
CREATE POLICY "Users can insert their own accessibility logs"
ON public.accessibility_audit_log FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  ) OR user_id IS NULL
);

DROP POLICY IF EXISTS "Principals and teachers can view accessibility logs" ON public.accessibility_audit_log;
CREATE POLICY "Principals and teachers can view accessibility logs"
ON public.accessibility_audit_log FOR SELECT
USING (is_principal() OR get_user_role() = 'teacher');

-- Update quiz_attempts with accessibility features
ALTER TABLE public.quiz_attempts ADD COLUMN accessibility_settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.quiz_attempts ADD COLUMN screen_reader_used boolean DEFAULT false;
ALTER TABLE public.quiz_attempts ADD COLUMN keyboard_navigation_used boolean DEFAULT false;