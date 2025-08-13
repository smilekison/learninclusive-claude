-- Add parent role to the existing role check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Create new constraint with parent role included
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('principal', 'teacher', 'student', 'parent'));

-- Create parent profiles and relationships
-- First, create parent-student relationships
CREATE TABLE public.parent_student_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Enable RLS on parent-student relationships
ALTER TABLE public.parent_student_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for parent-student relationships
CREATE POLICY "Parents can view their relationships" 
ON public.parent_student_relationships 
FOR SELECT 
USING (parent_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Principals can manage all relationships" 
ON public.parent_student_relationships 
FOR ALL 
USING (is_principal());

-- Create enhanced grading rubrics table
CREATE TABLE public.grading_rubrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_points NUMERIC NOT NULL DEFAULT 100,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on grading rubrics
ALTER TABLE public.grading_rubrics ENABLE ROW LEVEL SECURITY;

-- Create policies for grading rubrics
CREATE POLICY "Teachers can manage rubrics for their assignments" 
ON public.grading_rubrics 
FOR ALL 
USING (assignment_id IN (
  SELECT a.id FROM assignments a
  JOIN subjects s ON a.subject_id = s.id
  JOIN classes c ON s.class_id = c.id
  JOIN profiles p ON c.teacher_id = p.id
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Principals can manage all rubrics" 
ON public.grading_rubrics 
FOR ALL 
USING (is_principal());

-- Enhance assignment_submissions with detailed grading
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS rubric_scores JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS grading_notes TEXT,
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_submission BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submission_quality TEXT CHECK (submission_quality IN ('excellent', 'good', 'satisfactory', 'needs_improvement'));

-- Create demo parent user manually
DO $$
DECLARE
    parent_user_id UUID;
    student_user_id UUID;
    parent_profile_id UUID;
    student_profile_id UUID;
BEGIN
    -- Generate UUIDs
    parent_user_id := gen_random_uuid();
    student_user_id := gen_random_uuid();
    
    -- Insert parent user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      parent_user_id,
      'authenticated',
      'authenticated',
      'parent@riverside.edu',
      '$2a$10$demo.password.hash.for.testing.purposes.only',
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', 'Sarah',
        'last_name', 'Thompson',
        'role', 'parent'
      ),
      FALSE,
      NOW(),
      NOW()
    );

    -- Insert parent profile
    INSERT INTO public.profiles (user_id, first_name, last_name, role)
    VALUES (parent_user_id, 'Sarah', 'Thompson', 'parent')
    RETURNING id INTO parent_profile_id;

    -- Insert student profile
    INSERT INTO public.profiles (user_id, first_name, last_name, role, parent_email)
    VALUES (student_user_id, 'Emma', 'Thompson', 'student', 'parent@riverside.edu')
    RETURNING id INTO student_profile_id;

    -- Create parent-student relationship
    INSERT INTO public.parent_student_relationships (parent_id, student_id, relationship_type)
    VALUES (parent_profile_id, student_profile_id, 'parent');
    
END $$;

-- Create triggers for updated_at
CREATE TRIGGER update_parent_student_relationships_updated_at
BEFORE UPDATE ON public.parent_student_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grading_rubrics_updated_at
BEFORE UPDATE ON public.grading_rubrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();