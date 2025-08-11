-- Continue adding remaining foreign key constraints

DO $$
BEGIN
    -- 8. Assignments foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'assignments_subject_id_fkey' AND table_name = 'assignments') THEN
        ALTER TABLE public.assignments 
        ADD CONSTRAINT assignments_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    -- 10. Lessons foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'lessons_subject_id_fkey' AND table_name = 'lessons') THEN
        ALTER TABLE public.lessons 
        ADD CONSTRAINT lessons_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    -- 11. Materials foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'materials_subject_id_fkey' AND table_name = 'materials') THEN
        ALTER TABLE public.materials 
        ADD CONSTRAINT materials_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'materials_lesson_id_fkey' AND table_name = 'materials') THEN
        ALTER TABLE public.materials 
        ADD CONSTRAINT materials_lesson_id_fkey 
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'materials_uploaded_by_fkey' AND table_name = 'materials') THEN
        ALTER TABLE public.materials 
        ADD CONSTRAINT materials_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 12. Quizzes foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'quizzes_subject_id_fkey' AND table_name = 'quizzes') THEN
        ALTER TABLE public.quizzes 
        ADD CONSTRAINT quizzes_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    -- 13. Quiz attempts foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'quiz_attempts_quiz_id_fkey' AND table_name = 'quiz_attempts') THEN
        ALTER TABLE public.quiz_attempts 
        ADD CONSTRAINT quiz_attempts_quiz_id_fkey 
        FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'quiz_attempts_student_id_fkey' AND table_name = 'quiz_attempts') THEN
        ALTER TABLE public.quiz_attempts 
        ADD CONSTRAINT quiz_attempts_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- 14. Video materials foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'video_materials_subject_id_fkey' AND table_name = 'video_materials') THEN
        ALTER TABLE public.video_materials 
        ADD CONSTRAINT video_materials_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'video_materials_lesson_id_fkey' AND table_name = 'video_materials') THEN
        ALTER TABLE public.video_materials 
        ADD CONSTRAINT video_materials_lesson_id_fkey 
        FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'video_materials_uploaded_by_fkey' AND table_name = 'video_materials') THEN
        ALTER TABLE public.video_materials 
        ADD CONSTRAINT video_materials_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END$$;