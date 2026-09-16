-- Add invitation codes to subjects table for subject-based enrollment
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS invitation_code text UNIQUE DEFAULT substring(md5(random()::text), 1, 8);

-- Create subject enrollment requests table
CREATE TABLE IF NOT EXISTS subject_enrollment_requests (
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

-- Enable RLS on subject enrollment requests
ALTER TABLE subject_enrollment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for subject enrollment requests
DROP POLICY IF EXISTS "Students can create subject enrollment requests" ON subject_enrollment_requests;
CREATE POLICY "Students can create subject enrollment requests" 
ON subject_enrollment_requests 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'student'
));

DROP POLICY IF EXISTS "Students can view their own subject enrollment requests" ON subject_enrollment_requests;
CREATE POLICY "Students can view their own subject enrollment requests" 
ON subject_enrollment_requests 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Teachers can view requests for their subjects" ON subject_enrollment_requests;
CREATE POLICY "Teachers can view requests for their subjects" 
ON subject_enrollment_requests 
FOR SELECT 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Teachers can update requests for their subjects" ON subject_enrollment_requests;
CREATE POLICY "Teachers can update requests for their subjects" 
ON subject_enrollment_requests 
FOR UPDATE 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Principals can manage all subject enrollment requests" ON subject_enrollment_requests;
CREATE POLICY "Principals can manage all subject enrollment requests" 
ON subject_enrollment_requests 
FOR ALL 
USING (is_principal());

-- Create student_subject_enrollments table for direct subject enrollment
CREATE TABLE IF NOT EXISTS student_subject_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Enable RLS on student subject enrollments
ALTER TABLE student_subject_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for student subject enrollments
DROP POLICY IF EXISTS "Students can view their own subject enrollments" ON student_subject_enrollments;
CREATE POLICY "Students can view their own subject enrollments" 
ON student_subject_enrollments 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Teachers can view enrollments for their subjects" ON student_subject_enrollments;
CREATE POLICY "Teachers can view enrollments for their subjects" 
ON student_subject_enrollments 
FOR SELECT 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Teachers can manage enrollments for their subjects" ON student_subject_enrollments;
CREATE POLICY "Teachers can manage enrollments for their subjects" 
ON student_subject_enrollments 
FOR ALL 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Principals can manage all subject enrollments" ON student_subject_enrollments;
CREATE POLICY "Principals can manage all subject enrollments" 
ON student_subject_enrollments 
FOR ALL 
USING (is_principal());

-- Add trigger for updated_at on subject_enrollment_requests
DROP TRIGGER IF EXISTS update_subject_enrollment_requests_updated_at ON subject_enrollment_requests;
CREATE TRIGGER update_subject_enrollment_requests_updated_at
BEFORE UPDATE ON subject_enrollment_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();