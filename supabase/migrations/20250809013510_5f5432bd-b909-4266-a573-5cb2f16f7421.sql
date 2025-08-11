-- Create table for pending enrollment requests
CREATE TABLE public.enrollment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  class_id UUID NOT NULL,
  enrollment_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  teacher_feedback TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for enrollment requests
CREATE POLICY "Students can view their own enrollment requests" 
ON public.enrollment_requests 
FOR SELECT 
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Students can create enrollment requests" 
ON public.enrollment_requests 
FOR INSERT 
WITH CHECK (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'student'
));

CREATE POLICY "Teachers can view requests for their classes" 
ON public.enrollment_requests 
FOR SELECT 
USING (class_id IN (
  SELECT c.id FROM classes c 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Teachers can update requests for their classes" 
ON public.enrollment_requests 
FOR UPDATE 
USING (class_id IN (
  SELECT c.id FROM classes c 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Principals can manage all enrollment requests" 
ON public.enrollment_requests 
FOR ALL 
USING (is_principal());

-- Create trigger for updated_at
CREATE TRIGGER update_enrollment_requests_updated_at
BEFORE UPDATE ON public.enrollment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE enrollment_requests;