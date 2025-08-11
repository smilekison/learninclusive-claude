-- Add foreign key constraints to ensure proper table relationships

-- 1. Profiles table foreign keys
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Schools table foreign keys  
ALTER TABLE public.schools 
ADD CONSTRAINT schools_principal_id_fkey 
FOREIGN KEY (principal_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Classes table foreign keys
ALTER TABLE public.classes 
ADD CONSTRAINT classes_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.classes 
ADD CONSTRAINT classes_school_id_fkey 
FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

-- 4. Subjects table foreign keys
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- 5. Student enrollments foreign keys
ALTER TABLE public.student_enrollments 
ADD CONSTRAINT student_enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_enrollments 
ADD CONSTRAINT student_enrollments_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- 6. Student subject enrollments foreign keys
ALTER TABLE public.student_subject_enrollments 
ADD CONSTRAINT student_subject_enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_subject_enrollments 
ADD CONSTRAINT student_subject_enrollments_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 7. Subject enrollment requests foreign keys
ALTER TABLE public.subject_enrollment_requests 
ADD CONSTRAINT subject_enrollment_requests_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.subject_enrollment_requests 
ADD CONSTRAINT subject_enrollment_requests_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.subject_enrollment_requests 
ADD CONSTRAINT subject_enrollment_requests_processed_by_fkey 
FOREIGN KEY (processed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 8. Assignments foreign keys
ALTER TABLE public.assignments 
ADD CONSTRAINT assignments_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 9. Assignment submissions foreign keys
ALTER TABLE public.assignment_submissions 
ADD CONSTRAINT assignment_submissions_assignment_id_fkey 
FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;

ALTER TABLE public.assignment_submissions 
ADD CONSTRAINT assignment_submissions_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.assignment_submissions 
ADD CONSTRAINT assignment_submissions_graded_by_fkey 
FOREIGN KEY (graded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 10. Lessons foreign keys
ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 11. Materials foreign keys
ALTER TABLE public.materials 
ADD CONSTRAINT materials_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.materials 
ADD CONSTRAINT materials_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.materials 
ADD CONSTRAINT materials_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 12. Quizzes foreign keys
ALTER TABLE public.quizzes 
ADD CONSTRAINT quizzes_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- 13. Quiz attempts foreign keys
ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT quiz_attempts_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT quiz_attempts_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 14. Video materials foreign keys
ALTER TABLE public.video_materials 
ADD CONSTRAINT video_materials_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.video_materials 
ADD CONSTRAINT video_materials_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.video_materials 
ADD CONSTRAINT video_materials_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 15. Video progress foreign keys
ALTER TABLE public.video_progress 
ADD CONSTRAINT video_progress_video_id_fkey 
FOREIGN KEY (video_id) REFERENCES public.video_materials(id) ON DELETE CASCADE;

ALTER TABLE public.video_progress 
ADD CONSTRAINT video_progress_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 16. Notifications foreign keys
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 17. Email invitations foreign keys
ALTER TABLE public.email_invitations 
ADD CONSTRAINT email_invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 18. Deleted items foreign keys
ALTER TABLE public.deleted_items 
ADD CONSTRAINT deleted_items_deleted_by_fkey 
FOREIGN KEY (deleted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create indexes for better performance on foreign key columns
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON public.student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_student_id ON public.video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON public.video_progress(video_id);