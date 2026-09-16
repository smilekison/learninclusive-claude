-- Create subject enrollment requests table
CREATE TABLE IF NOT EXISTS public.subject_enrollment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  invitation_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  teacher_feedback TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student subject enrollments table  
CREATE TABLE IF NOT EXISTS public.student_subject_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Enable RLS
ALTER TABLE public.subject_enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subject_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for subject_enrollment_requests
DROP POLICY IF EXISTS "Students can create subject enrollment requests" ON public.subject_enrollment_requests;
CREATE POLICY "Students can create subject enrollment requests" 
ON public.subject_enrollment_requests 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'student'
));

DROP POLICY IF EXISTS "Students can view their own subject enrollment requests" ON public.subject_enrollment_requests;
CREATE POLICY "Students can view their own subject enrollment requests" 
ON public.subject_enrollment_requests 
FOR SELECT 
USING (student_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

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

DROP POLICY IF EXISTS "Principals can manage all subject enrollment requests" ON public.subject_enrollment_requests;
CREATE POLICY "Principals can manage all subject enrollment requests" 
ON public.subject_enrollment_requests 
FOR ALL 
USING (is_principal());

-- RLS policies for student_subject_enrollments
DROP POLICY IF EXISTS "Students can view their own subject enrollments" ON public.student_subject_enrollments;
CREATE POLICY "Students can view their own subject enrollments" 
ON public.student_subject_enrollments 
FOR SELECT 
USING (student_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Teachers can manage enrollments for their subjects" ON public.student_subject_enrollments;
CREATE POLICY "Teachers can manage enrollments for their subjects" 
ON public.student_subject_enrollments 
FOR ALL 
USING (subject_id IN (
  SELECT s.id FROM subjects s
  JOIN classes c ON s.class_id = c.id
  JOIN profiles p ON c.teacher_id = p.id
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Principals can manage all subject enrollments" ON public.student_subject_enrollments;
CREATE POLICY "Principals can manage all subject enrollments" 
ON public.student_subject_enrollments 
FOR ALL 
USING (is_principal());

-- Add updated_at trigger for subject_enrollment_requests
DROP TRIGGER IF EXISTS update_subject_enrollment_requests_updated_at ON subject_enrollment_requests;
CREATE TRIGGER update_subject_enrollment_requests_updated_at
  BEFORE UPDATE ON public.subject_enrollment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();