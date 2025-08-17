-- Fix ambiguous name reference in storage policies by qualifying column

-- Update Student upload policy only if not exists (noop if already created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Students can upload their assignment files'
  ) THEN
    CREATE POLICY "Students can upload their assignment files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'assignment-submissions'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (storage.foldername(storage.objects.name))[1] = p.id::text
      )
    );
  END IF;
END $$;

-- Update Student select policy only if not exists (noop if already created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Students can view their assignment files'
  ) THEN
    CREATE POLICY "Students can view their assignment files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'assignment-submissions'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (storage.foldername(storage.objects.name))[1] = p.id::text
      )
    );
  END IF;
END $$;

-- Create Teacher select policy with qualified column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Teachers can view assignment files they own'
  ) THEN
    CREATE POLICY "Teachers can view assignment files they own"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'assignment-submissions'
      AND EXISTS (
        SELECT 1
        FROM public.assignments a
        JOIN public.subjects s ON a.subject_id = s.id
        JOIN public.classes c ON s.class_id = c.id
        JOIN public.profiles t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
          AND (storage.foldername(storage.objects.name))[2] = a.id::text
      )
    );
  END IF;
END $$;

-- Principal select policy with qualified column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Principals can view all assignment files'
  ) THEN
    CREATE POLICY "Principals can view all assignment files"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'assignment-submissions' AND public.is_principal()
    );
  END IF;
END $$;