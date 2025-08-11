-- Add missing foreign key constraints (avoiding existing ones)

-- Check and add foreign keys that don't exist yet
DO $$
BEGIN
    -- 2. Schools table foreign keys  
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'schools_principal_id_fkey' AND table_name = 'schools') THEN
        ALTER TABLE public.schools 
        ADD CONSTRAINT schools_principal_id_fkey 
        FOREIGN KEY (principal_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- 3. Classes table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'classes_teacher_id_fkey' AND table_name = 'classes') THEN
        ALTER TABLE public.classes 
        ADD CONSTRAINT classes_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'classes_school_id_fkey' AND table_name = 'classes') THEN
        ALTER TABLE public.classes 
        ADD CONSTRAINT classes_school_id_fkey 
        FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;
    END IF;

    -- 4. Subjects table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'subjects_class_id_fkey' AND table_name = 'subjects') THEN
        ALTER TABLE public.subjects 
        ADD CONSTRAINT subjects_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;

    -- 5. Student enrollments foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'student_enrollments_student_id_fkey' AND table_name = 'student_enrollments') THEN
        ALTER TABLE public.student_enrollments 
        ADD CONSTRAINT student_enrollments_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'student_enrollments_class_id_fkey' AND table_name = 'student_enrollments') THEN
        ALTER TABLE public.student_enrollments 
        ADD CONSTRAINT student_enrollments_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;

    -- 6. Student subject enrollments foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'student_subject_enrollments_student_id_fkey' AND table_name = 'student_subject_enrollments') THEN
        ALTER TABLE public.student_subject_enrollments 
        ADD CONSTRAINT student_subject_enrollments_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'student_subject_enrollments_subject_id_fkey' AND table_name = 'student_subject_enrollments') THEN
        ALTER TABLE public.student_subject_enrollments 
        ADD CONSTRAINT student_subject_enrollments_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    -- 7. Subject enrollment requests foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'subject_enrollment_requests_student_id_fkey' AND table_name = 'subject_enrollment_requests') THEN
        ALTER TABLE public.subject_enrollment_requests 
        ADD CONSTRAINT subject_enrollment_requests_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'subject_enrollment_requests_subject_id_fkey' AND table_name = 'subject_enrollment_requests') THEN
        ALTER TABLE public.subject_enrollment_requests 
        ADD CONSTRAINT subject_enrollment_requests_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'subject_enrollment_requests_processed_by_fkey' AND table_name = 'subject_enrollment_requests') THEN
        ALTER TABLE public.subject_enrollment_requests 
        ADD CONSTRAINT subject_enrollment_requests_processed_by_fkey 
        FOREIGN KEY (processed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END$$;