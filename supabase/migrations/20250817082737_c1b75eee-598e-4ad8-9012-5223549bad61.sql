-- Fix remaining function search_path vulnerabilities

-- Fix all remaining functions that don't have search_path set
CREATE OR REPLACE FUNCTION public.generate_code(code_len integer DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  res text := '';
  i int := 0;
  idx int;
BEGIN
  WHILE i < code_len LOOP
    idx := 1 + floor(random() * length(chars))::int;
    res := res || substr(chars, idx, 1);
    i := i + 1;
  END LOOP;
  RETURN res;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_subject_invitation_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invitation_code IS NULL OR NEW.invitation_code = '' THEN
    NEW.invitation_code := public.generate_unique_code('subjects', 'invitation_code', 8);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_teacher_assignment_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert notification for the teacher of the class
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    teacher_profile.id,
    'Assignment Submitted',
    student_profile.first_name || ' ' || student_profile.last_name || 
    ' has submitted assignment: ' || a.title,
    'submission'
  FROM assignments a
  JOIN subjects s ON a.subject_id = s.id
  JOIN classes c ON s.class_id = c.id
  JOIN profiles teacher_profile ON c.teacher_id = teacher_profile.id
  JOIN profiles student_profile ON NEW.student_id = student_profile.id
  WHERE a.id = NEW.assignment_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_student_assignment_graded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify if assignment was just graded (score was null, now has value)
  IF OLD.score IS NULL AND NEW.score IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    SELECT 
      student_profile.id,
      'Assignment Graded: ' || a.title,
      'Your assignment "' || a.title || '" has been graded. Score: ' || 
      NEW.score || '/' || a.max_score || '. ' ||
      CASE WHEN NEW.feedback IS NOT NULL THEN 'Feedback: ' || NEW.feedback ELSE '' END,
      'grade'
    FROM assignments a
    JOIN profiles student_profile ON NEW.student_id = student_profile.id
    WHERE a.id = NEW.assignment_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_students_new_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert notifications for all students enrolled in the class that has this subject
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Assignment: ' || NEW.title,
    'A new assignment has been added to ' || s.name || (
      CASE WHEN NEW.due_date IS NOT NULL 
      THEN '. Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY')
      ELSE ''
      END
    ),
    'assignment'
  FROM profiles p
  JOIN student_enrollments se ON p.id = se.student_id
  JOIN subjects s ON NEW.subject_id = s.id
  WHERE se.class_id = s.class_id
  AND p.role = 'student';
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_students_new_subject()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert notifications for all students enrolled in this class
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Subject: ' || NEW.name,
    'A new subject has been added to your class: ' || NEW.description,
    'info'
  FROM profiles p
  JOIN student_enrollments se ON p.id = se.student_id
  WHERE se.class_id = NEW.class_id
  AND p.role = 'student';
  
  RETURN NEW;
END;
$function$;

-- Add security documentation comments
COMMENT ON FUNCTION public.generate_code IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.ensure_subject_invitation_code IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.handle_new_user IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.notify_teacher_assignment_submission IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.notify_student_assignment_graded IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.notify_students_new_assignment IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.notify_students_new_subject IS 'Security hardened: Function search_path set to public schema only';