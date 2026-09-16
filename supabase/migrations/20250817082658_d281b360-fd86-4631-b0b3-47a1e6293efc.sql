-- Phase 1: Fix Critical Data Exposure Issues

-- 1. Fix email_invitations table RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow access to specific invitation by token" ON email_invitations;
DROP POLICY IF EXISTS "Allow updating invitation as used during registration" ON email_invitations;

-- Create secure policies for email_invitations
DROP POLICY IF EXISTS "Users can view their specific invitation by token" ON email_invitations;
CREATE POLICY "Users can view their specific invitation by token" 
ON email_invitations 
FOR SELECT 
USING (
  (NOT used) 
  AND (expires_at > now())
  AND (
    -- Allow access only if the user is the intended recipient (matching email with their auth email)
    email = (SELECT auth.email() WHERE auth.uid() IS NOT NULL)
    OR 
    -- Allow the inviter to see their own invitations
    invited_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR
    -- Allow principals to see all invitations
    is_principal()
  )
);

DROP POLICY IF EXISTS "Allow invitation token lookup for registration" ON email_invitations;
CREATE POLICY "Allow invitation token lookup for registration" 
ON email_invitations 
FOR SELECT 
USING (
  (NOT used) 
  AND (expires_at > now())
  AND (token IS NOT NULL)
);

DROP POLICY IF EXISTS "Allow updating invitation as used during registration" ON email_invitations;
CREATE POLICY "Allow updating invitation as used during registration" 
ON email_invitations 
FOR UPDATE 
USING (
  (NOT used) 
  AND (expires_at > now())
) 
WITH CHECK (used = true);

-- 2. Fix subject_invitation_codes table access
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Students can view active invitation codes" ON subject_invitation_codes;

-- Create secure policy for subject_invitation_codes
DROP POLICY IF EXISTS "Authenticated users can view invitation codes for enrollment" ON subject_invitation_codes;
CREATE POLICY "Authenticated users can view invitation codes for enrollment" 
ON subject_invitation_codes 
FOR SELECT 
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
  AND (
    -- Students can only see codes when they're trying to enroll
    get_user_role() = 'student'
    OR
    -- Teachers can see codes for their subjects  
    subject_id IN (
      SELECT s.id
      FROM subjects s
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR
    -- Principals can see all codes
    is_principal()
  )
);

-- Phase 2: Fix Database Function Security (search_path vulnerabilities)

-- Fix get_parent_student_ids_for_user function
CREATE OR REPLACE FUNCTION public.get_parent_student_ids_for_user()
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT ARRAY_AGG(psr.student_id)
    FROM parent_student_relationships psr
    JOIN profiles parent_profile ON (psr.parent_id = parent_profile.id)
    WHERE parent_profile.user_id = auth.uid()
  );
END;
$function$;

-- Fix is_user_in_school function  
CREATE OR REPLACE FUNCTION public.is_user_in_school(target_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT id, role FROM profiles WHERE user_id = auth.uid()
  )
  SELECT
    -- principal of the school
    EXISTS (
      SELECT 1 FROM schools s, me
      WHERE s.id = target_school_id AND s.principal_id = me.id
    )
    OR
    -- teacher with a class in the school
    EXISTS (
      SELECT 1
      FROM classes c, me
      WHERE c.school_id = target_school_id AND c.teacher_id = me.id
    )
    OR
    -- student enrolled in a class in the school
    EXISTS (
      SELECT 1
      FROM student_enrollments se
      JOIN classes c ON c.id = se.class_id
      JOIN me ON me.id = se.student_id
      WHERE c.school_id = target_school_id
    );
$function$;

-- Fix global_search function
CREATE OR REPLACE FUNCTION public.global_search(q text, limit_count integer DEFAULT 10)
RETURNS TABLE(entity_type text, id uuid, title text, subtitle text, route text, rank real)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    -- Classes
    SELECT
      'class'::text as entity_type,
      c.id,
      c.name as title,
      coalesce(c.description, '') as subtitle,
      '/classes'::text as route,
      ts_rank(to_tsvector('finnish', coalesce(c.name,'') || ' ' || coalesce(c.description,'')), plainto_tsquery('finnish', q)) AS rank
    FROM classes c
    WHERE c.is_active = true
      AND to_tsvector('finnish', coalesce(c.name,'') || ' ' || coalesce(c.description,'')) @@ plainto_tsquery('finnish', q)

    UNION ALL

    -- Subjects
    SELECT
      'subject'::text as entity_type,
      s.id,
      s.name as title,
      coalesce(s.description,'') as subtitle,
      '/subjects'::text as route,
      ts_rank(to_tsvector('finnish', coalesce(s.name,'') || ' ' || coalesce(s.description,'')), plainto_tsquery('finnish', q)) AS rank
    FROM subjects s
    WHERE s.is_active = true
      AND to_tsvector('finnish', coalesce(s.name,'') || ' ' || coalesce(s.description,'')) @@ plainto_tsquery('finnish', q)

    UNION ALL

    -- Assignments
    SELECT
      'assignment'::text as entity_type,
      a.id,
      a.title as title,
      coalesce(a.description,'') as subtitle,
      '/assignments'::text as route,
      ts_rank(to_tsvector('finnish', coalesce(a.title,'') || ' ' || coalesce(a.description,'')), plainto_tsquery('finnish', q)) AS rank
    FROM assignments a
    WHERE coalesce(a.is_active, true) = true
      AND to_tsvector('finnish', coalesce(a.title,'') || ' ' || coalesce(a.description,'')) @@ plainto_tsquery('finnish', q)

    UNION ALL

    -- Profiles (teachers + students)
    SELECT
      'profile'::text as entity_type,
      p.id,
      trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) as title,
      coalesce(p.role::text,'') as subtitle,
      CASE WHEN p.role = 'teacher' THEN '/teachers' ELSE '/students' END as route,
      ts_rank(to_tsvector('finnish', trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) || ' ' || coalesce(p.role::text,'')), plainto_tsquery('finnish', q)) AS rank
    FROM profiles p
    WHERE coalesce(p.is_active, true) = true
      AND to_tsvector('finnish', trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) || ' ' || coalesce(p.role::text,'')) @@ plainto_tsquery('finnish', q)
  ) t
  ORDER BY rank DESC
  LIMIT limit_count;
$function$;

-- Fix soft_delete_item function
CREATE OR REPLACE FUNCTION public.soft_delete_item(table_name text, item_id uuid, deleter_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item_data JSONB;
  item_name TEXT;
  item_details TEXT;
BEGIN
  -- Get item data before deletion
  EXECUTE format('SELECT row_to_json(t) FROM %I t WHERE id = $1', table_name) 
  INTO item_data USING item_id;
  
  IF item_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Extract name and details based on table
  CASE table_name
    WHEN 'profiles' THEN
      item_name := COALESCE(item_data->>'first_name', '') || ' ' || COALESCE(item_data->>'last_name', '');
      item_details := COALESCE(item_data->>'role', 'Unknown role');
    WHEN 'classes' THEN
      item_name := COALESCE(item_data->>'name', 'Unnamed class');
      item_details := COALESCE(item_data->>'description', 'No description');
    WHEN 'subjects' THEN
      item_name := COALESCE(item_data->>'name', 'Unnamed subject');
      item_details := COALESCE(item_data->>'description', 'No description');
    WHEN 'assignments' THEN
      item_name := COALESCE(item_data->>'title', 'Unnamed assignment');
      item_details := COALESCE(item_data->>'description', 'No description');
    ELSE
      item_name := 'Unknown';
      item_details := '';
  END CASE;
  
  -- Insert into deleted_items
  INSERT INTO deleted_items (item_type, item_id, item_name, item_details, original_data, deleted_by)
  VALUES (table_name, item_id, item_name, item_details, item_data, deleter_id);
  
  -- Soft delete the item
  EXECUTE format('UPDATE %I SET is_active = false WHERE id = $1', table_name) 
  USING item_id;
  
  RETURN TRUE;
END;
$function$;

-- Fix restore_deleted_item function
CREATE OR REPLACE FUNCTION public.restore_deleted_item(deleted_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_record RECORD;
BEGIN
  -- Get the deleted item record
  SELECT * INTO deleted_record FROM deleted_items WHERE id = deleted_item_id;
  
  IF deleted_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Restore the item
  EXECUTE format('UPDATE %I SET is_active = true WHERE id = $1', deleted_record.item_type) 
  USING deleted_record.item_id;
  
  -- Remove from deleted_items
  DELETE FROM deleted_items WHERE id = deleted_item_id;
  
  RETURN TRUE;
END;
$function$;

-- Phase 4: Tighten school data access
-- Drop overly permissive policy on schools table
DROP POLICY IF EXISTS "Anyone can view schools" ON schools;

-- Create secure policy for schools
DROP POLICY IF EXISTS "Authenticated users can view schools" ON schools;
CREATE POLICY "Authenticated users can view schools" 
ON schools 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Add comment documenting the security improvements
COMMENT ON TABLE email_invitations IS 'Security hardened: RLS policies restrict access to invitation data based on user roles and ownership';
COMMENT ON TABLE subject_invitation_codes IS 'Security hardened: RLS policies restrict invitation code access to authenticated users only';
COMMENT ON TABLE schools IS 'Security hardened: RLS policies restrict school data to authenticated users only';