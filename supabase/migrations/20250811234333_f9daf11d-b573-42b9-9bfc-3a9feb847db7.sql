-- Ensure required foreign keys and indexes for dynamic student relations and principal dashboard
-- This migration adds FKs so PostgREST can perform embedded relations like student_enrollments(count)

-- Helper: add constraint only if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_teacher_id_fkey'
  ) THEN
    ALTER TABLE public.classes
      ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subjects_class_id_fkey'
  ) THEN
    ALTER TABLE public.subjects
      ADD CONSTRAINT subjects_class_id_fkey FOREIGN KEY (class_id)
      REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_enrollments_class_id_fkey'
  ) THEN
    ALTER TABLE public.student_enrollments
      ADD CONSTRAINT student_enrollments_class_id_fkey FOREIGN KEY (class_id)
      REFERENCES public.classes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_enrollments_student_id_fkey'
  ) THEN
    ALTER TABLE public.student_enrollments
      ADD CONSTRAINT student_enrollments_student_id_fkey FOREIGN KEY (student_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Assignments and submissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assignments_subject_id_fkey'
  ) THEN
    ALTER TABLE public.assignments
      ADD CONSTRAINT assignments_subject_id_fkey FOREIGN KEY (subject_id)
      REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assignment_submissions_assignment_id_fkey'
  ) THEN
    ALTER TABLE public.assignment_submissions
      ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id)
      REFERENCES public.assignments(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assignment_submissions_student_id_fkey'
  ) THEN
    ALTER TABLE public.assignment_submissions
      ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enrollment requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subject_enrollment_requests_student_id_fkey'
  ) THEN
    ALTER TABLE public.subject_enrollment_requests
      ADD CONSTRAINT subject_enrollment_requests_student_id_fkey FOREIGN KEY (student_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subject_enrollment_requests_subject_id_fkey'
  ) THEN
    ALTER TABLE public.subject_enrollment_requests
      ADD CONSTRAINT subject_enrollment_requests_subject_id_fkey FOREIGN KEY (subject_id)
      REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subject_enrollment_requests_processed_by_fkey'
  ) THEN
    ALTER TABLE public.subject_enrollment_requests
      ADD CONSTRAINT subject_enrollment_requests_processed_by_fkey FOREIGN KEY (processed_by)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Lessons and materials
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lessons_subject_id_fkey'
  ) THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_subject_id_fkey FOREIGN KEY (subject_id)
      REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_subject_id_fkey'
  ) THEN
    ALTER TABLE public.materials
      ADD CONSTRAINT materials_subject_id_fkey FOREIGN KEY (subject_id)
      REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_lesson_id_fkey'
  ) THEN
    ALTER TABLE public.materials
      ADD CONSTRAINT materials_lesson_id_fkey FOREIGN KEY (lesson_id)
      REFERENCES public.lessons(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_uploaded_by_fkey'
  ) THEN
    ALTER TABLE public.materials
      ADD CONSTRAINT materials_uploaded_by_fkey FOREIGN KEY (uploaded_by)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Quizzes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_subject_id_fkey'
  ) THEN
    ALTER TABLE public.quizzes
      ADD CONSTRAINT quizzes_subject_id_fkey FOREIGN KEY (subject_id)
      REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempts_quiz_id_fkey'
  ) THEN
    ALTER TABLE public.quiz_attempts
      ADD CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id)
      REFERENCES public.quizzes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_attempts_student_id_fkey'
  ) THEN
    ALTER TABLE public.quiz_attempts
      ADD CONSTRAINT quiz_attempts_student_id_fkey FOREIGN KEY (student_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Video materials and interactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_materials_subject_id_fkey'
  ) THEN
    ALTER TABLE public.video_materials
      ADD CONSTRAINT video_materials_subject_id_fkey FOREIGN KEY (subject_id)
      REFERENCES public.subjects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_materials_lesson_id_fkey'
  ) THEN
    ALTER TABLE public.video_materials
      ADD CONSTRAINT video_materials_lesson_id_fkey FOREIGN KEY (lesson_id)
      REFERENCES public.lessons(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_materials_uploaded_by_fkey'
  ) THEN
    ALTER TABLE public.video_materials
      ADD CONSTRAINT video_materials_uploaded_by_fkey FOREIGN KEY (uploaded_by)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_materials_school_id_fkey'
  ) THEN
    ALTER TABLE public.video_materials
      ADD CONSTRAINT video_materials_school_id_fkey FOREIGN KEY (school_id)
      REFERENCES public.schools(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_views_video_id_fkey'
  ) THEN
    ALTER TABLE public.video_views
      ADD CONSTRAINT video_views_video_id_fkey FOREIGN KEY (video_id)
      REFERENCES public.video_materials(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_views_user_id_fkey'
  ) THEN
    ALTER TABLE public.video_views
      ADD CONSTRAINT video_views_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_likes_video_id_fkey'
  ) THEN
    ALTER TABLE public.video_likes
      ADD CONSTRAINT video_likes_video_id_fkey FOREIGN KEY (video_id)
      REFERENCES public.video_materials(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_likes_user_id_fkey'
  ) THEN
    ALTER TABLE public.video_likes
      ADD CONSTRAINT video_likes_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Schools principal
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_principal_id_fkey'
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_principal_id_fkey FOREIGN KEY (principal_id)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for performance on join columns
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON public.student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollment_requests_student_id ON public.subject_enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollment_requests_subject_id ON public.subject_enrollment_requests(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollment_requests_processed_by ON public.subject_enrollment_requests(processed_by);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON public.lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_lesson_id ON public.materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_video_materials_subject_id ON public.video_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_video_materials_lesson_id ON public.video_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_materials_uploaded_by ON public.video_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_video_materials_school_id ON public.video_materials(school_id);
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON public.video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON public.video_likes(user_id);
