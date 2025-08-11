-- Check if invitation_code column exists in subjects table, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'invitation_code'
    ) THEN
        ALTER TABLE subjects ADD COLUMN invitation_code text UNIQUE DEFAULT substring(md5(random()::text), 1, 8);
    END IF;
END $$;

-- Check if subject_enrollment_requests table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subject_enrollment_requests') THEN
        CREATE TABLE subject_enrollment_requests (
          id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          student_id uuid NOT NULL,
          subject_id uuid NOT NULL,
          invitation_code text NOT NULL,
          status text NOT NULL DEFAULT 'pending',
          teacher_feedback text,
          requested_at timestamp with time zone NOT NULL DEFAULT now(),
          processed_at timestamp with time zone,
          processed_by uuid,
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          updated_at timestamp with time zone NOT NULL DEFAULT now()
        );
        
        ALTER TABLE subject_enrollment_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Check if student_subject_enrollments table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_subject_enrollments') THEN
        CREATE TABLE student_subject_enrollments (
          id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          student_id uuid NOT NULL,
          subject_id uuid NOT NULL,
          enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
          UNIQUE(student_id, subject_id)
        );
        
        ALTER TABLE student_subject_enrollments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;