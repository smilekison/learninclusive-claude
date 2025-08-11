-- Fix the enrollment_requests table foreign key relationships
ALTER TABLE public.enrollment_requests 
ADD CONSTRAINT enrollment_requests_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.enrollment_requests 
ADD CONSTRAINT enrollment_requests_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.enrollment_requests 
ADD CONSTRAINT enrollment_requests_processed_by_fkey 
FOREIGN KEY (processed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;