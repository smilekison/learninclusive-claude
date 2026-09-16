-- 1) Create trigger to populate public.profiles when a new auth user is created (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2) Backfill profiles for existing auth users that don't have a profile yet
INSERT INTO public.profiles (user_id, first_name, last_name, role, is_active)
SELECT 
  u.id as user_id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', 'User') as first_name,
  COALESCE(u.raw_user_meta_data ->> 'last_name',  'Name') as last_name,
  COALESCE(u.raw_user_meta_data ->> 'role',       'student')::app_role as role,
  true as is_active
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- 3) Enroll student profiles into classes (round-robin) if not enrolled yet
DO $$
DECLARE
  class_ids uuid[];
  student_rec RECORD;
  idx int := 1;
  num_classes int;
BEGIN
  SELECT array_agg(id ORDER BY name) INTO class_ids FROM public.classes WHERE is_active = true;
  SELECT COALESCE(array_length(class_ids, 1), 0) INTO num_classes;

  IF num_classes = 0 THEN
    RAISE NOTICE 'No classes available for enrollment';
    RETURN;
  END IF;

  FOR student_rec IN
    SELECT id FROM public.profiles WHERE role = 'student' AND is_active = true
  LOOP
    -- If the student has no enrollments, assign one class in round-robin
    IF NOT EXISTS (
      SELECT 1 FROM public.student_enrollments se WHERE se.student_id = student_rec.id
    ) THEN
      INSERT INTO public.student_enrollments (student_id, class_id, status)
      VALUES (student_rec.id, class_ids[((idx - 1) % num_classes) + 1], 'active');
      idx := idx + 1;
    END IF;
  END LOOP;
END $$;