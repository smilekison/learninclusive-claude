-- Final foreign key constraints and performance indexes

DO $$
BEGIN
    -- 15. Video progress foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'video_progress_video_id_fkey' AND table_name = 'video_progress') THEN
        ALTER TABLE public.video_progress 
        ADD CONSTRAINT video_progress_video_id_fkey 
        FOREIGN KEY (video_id) REFERENCES public.video_materials(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'video_progress_student_id_fkey' AND table_name = 'video_progress') THEN
        ALTER TABLE public.video_progress 
        ADD CONSTRAINT video_progress_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 16. Notifications foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'notifications_user_id_fkey' AND table_name = 'notifications') THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 17. Email invitations foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'email_invitations_invited_by_fkey' AND table_name = 'email_invitations') THEN
        ALTER TABLE public.email_invitations 
        ADD CONSTRAINT email_invitations_invited_by_fkey 
        FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 18. Deleted items foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'deleted_items_deleted_by_fkey' AND table_name = 'deleted_items') THEN
        ALTER TABLE public.deleted_items 
        ADD CONSTRAINT deleted_items_deleted_by_fkey 
        FOREIGN KEY (deleted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END$$;

-- Create performance indexes for foreign key columns
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_graded_by ON public.assignment_submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON public.student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_enrollments_student_id ON public.student_subject_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_enrollments_subject_id ON public.student_subject_enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON public.lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_lesson_id ON public.materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_video_materials_subject_id ON public.video_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_video_materials_lesson_id ON public.video_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_materials_uploaded_by ON public.video_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON public.video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_student_id ON public.video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_invitations_invited_by ON public.email_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_deleted_items_deleted_by ON public.deleted_items(deleted_by);
CREATE INDEX IF NOT EXISTS idx_subject_enrollment_requests_student_id ON public.subject_enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollment_requests_subject_id ON public.subject_enrollment_requests(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollment_requests_processed_by ON public.subject_enrollment_requests(processed_by);