-- Clear existing data and add proper demo data with disability support

-- Clear all existing data
TRUNCATE TABLE public.student_enrollments CASCADE;
TRUNCATE TABLE public.subjects CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- (Disabled for local replay: this block inserts into columns that don't
-- exist on these tables — profiles.email/disability_type/accessibility_needs,
-- classes.grade_level/school_year — and uses non-UUID ids ('class-550e...'),
-- so it could never have executed against the real schema. Also FKs
-- profiles.user_id to auth.users ids that were never created. Disposable/
-- never-applied demo data; the RLS policies below are kept.

-- Add RLS policies to allow teachers to manage student disabilities
DROP POLICY IF EXISTS "Teachers can update student profiles for disability management" ON public.profiles;
CREATE POLICY "Teachers can update student profiles for disability management" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role() = 'teacher' AND role = 'student');

DROP POLICY IF EXISTS "Teachers can view student profiles for disability management" ON public.profiles;
CREATE POLICY "Teachers can view student profiles for disability management" 
ON public.profiles 
FOR SELECT 
USING (get_user_role() = 'teacher' OR user_id = auth.uid());