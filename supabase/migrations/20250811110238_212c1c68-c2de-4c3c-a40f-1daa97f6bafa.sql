-- Create student_enrollments table (already exists from the base schema
-- migration without a `status` column — add what's missing rather than
-- silently no-op via IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  class_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for student_enrollments
DROP POLICY IF EXISTS "Principals can manage all student enrollments" ON public.student_enrollments;
CREATE POLICY "Principals can manage all student enrollments" 
ON public.student_enrollments 
FOR ALL 
USING (is_principal());

DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON public.student_enrollments;
CREATE POLICY "Teachers can view enrollments for their classes" 
ON public.student_enrollments 
FOR SELECT 
USING (class_id IN (
  SELECT c.id FROM classes c 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view their own enrollments" 
ON public.student_enrollments 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Create subject_enrollment_requests table
CREATE TABLE IF NOT EXISTS public.subject_enrollment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  invitation_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subject_enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for subject_enrollment_requests
DROP POLICY IF EXISTS "Principals can manage all enrollment requests" ON public.subject_enrollment_requests;
CREATE POLICY "Principals can manage all enrollment requests" 
ON public.subject_enrollment_requests 
FOR ALL 
USING (is_principal());

DROP POLICY IF EXISTS "Teachers can view requests for their subjects" ON public.subject_enrollment_requests;
CREATE POLICY "Teachers can view requests for their subjects" 
ON public.subject_enrollment_requests 
FOR SELECT 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Teachers can update requests for their subjects" ON public.subject_enrollment_requests;
CREATE POLICY "Teachers can update requests for their subjects" 
ON public.subject_enrollment_requests 
FOR UPDATE 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Students can view their own requests" ON public.subject_enrollment_requests;
CREATE POLICY "Students can view their own requests" 
ON public.subject_enrollment_requests 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Students can create enrollment requests" ON public.subject_enrollment_requests;
CREATE POLICY "Students can create enrollment requests" 
ON public.subject_enrollment_requests 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Create subject_invitation_codes table (already exists from 20250809070224
-- with a `code` column instead of `invitation_code`, and no `expires_at` —
-- add what's missing rather than silently no-op via IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.subject_invitation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL,
  invitation_code TEXT NOT NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.subject_invitation_codes ADD COLUMN IF NOT EXISTS invitation_code TEXT;
ALTER TABLE public.subject_invitation_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subject_invitation_codes ALTER COLUMN created_by DROP NOT NULL;

-- Enable RLS
ALTER TABLE public.subject_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for subject_invitation_codes
DROP POLICY IF EXISTS "Principals can manage all invitation codes" ON public.subject_invitation_codes;
CREATE POLICY "Principals can manage all invitation codes" 
ON public.subject_invitation_codes 
FOR ALL 
USING (is_principal());

DROP POLICY IF EXISTS "Teachers can manage codes for their subjects" ON public.subject_invitation_codes;
CREATE POLICY "Teachers can manage codes for their subjects" 
ON public.subject_invitation_codes 
FOR ALL 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Students can view active invitation codes" ON public.subject_invitation_codes;
CREATE POLICY "Students can view active invitation codes" 
ON public.subject_invitation_codes 
FOR SELECT 
USING (is_active = true);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_student_enrollments_updated_at ON student_enrollments;
CREATE TRIGGER update_student_enrollments_updated_at
BEFORE UPDATE ON public.student_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subject_enrollment_requests_updated_at ON subject_enrollment_requests;
CREATE TRIGGER update_subject_enrollment_requests_updated_at
BEFORE UPDATE ON public.subject_enrollment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();