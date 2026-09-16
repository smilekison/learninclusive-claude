-- Idempotent RLS setup for principals and teachers (fixed pg_policies column names)
-- Profiles: Principals can view all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
      AND policyname = 'Principals can view all profiles'
  ) THEN
    DROP POLICY IF EXISTS "Principals can view all profiles" ON public.profiles;
CREATE POLICY "Principals can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (is_principal());
  END IF;
END $$;

-- Classes: Principals can view/manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'classes'
      AND policyname = 'Principals can manage all classes'
  ) THEN
    DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;
CREATE POLICY "Principals can manage all classes"
    ON public.classes
    FOR ALL
    USING (is_principal() AND is_active = true)
    WITH CHECK (is_principal() AND is_active = true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'classes'
      AND policyname = 'Principals can view all classes'
  ) THEN
    DROP POLICY IF EXISTS "Principals can view all classes" ON public.classes;
CREATE POLICY "Principals can view all classes"
    ON public.classes
    FOR SELECT
    USING (is_principal());
  END IF;
END $$;

-- Subjects: Principals can view/manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subjects'
      AND policyname = 'Principals can manage all subjects'
  ) THEN
    DROP POLICY IF EXISTS "Principals can manage all subjects" ON public.subjects;
CREATE POLICY "Principals can manage all subjects"
    ON public.subjects
    FOR ALL
    USING (is_principal())
    WITH CHECK (is_principal());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subjects'
      AND policyname = 'Principals can view all subjects'
  ) THEN
    DROP POLICY IF EXISTS "Principals can view all subjects" ON public.subjects;
CREATE POLICY "Principals can view all subjects"
    ON public.subjects
    FOR SELECT
    USING (is_principal());
  END IF;
END $$;

-- Student enrollments: Principals can view/manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'student_enrollments'
      AND policyname = 'Principals can manage all student enrollments'
  ) THEN
    DROP POLICY IF EXISTS "Principals can manage all student enrollments" ON public.student_enrollments;
CREATE POLICY "Principals can manage all student enrollments"
    ON public.student_enrollments
    FOR ALL
    USING (is_principal())
    WITH CHECK (is_principal());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'student_enrollments'
      AND policyname = 'Principals can view all enrollments'
  ) THEN
    DROP POLICY IF EXISTS "Principals can view all enrollments" ON public.student_enrollments;
CREATE POLICY "Principals can view all enrollments"
    ON public.student_enrollments
    FOR SELECT
    USING (is_principal());
  END IF;
END $$;
