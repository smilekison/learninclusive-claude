-- Fix infinite recursion in RLS policies by replacing problematic function calls
-- with direct auth.uid() comparisons and proper security definer functions

-- First, let's fix the classes table policies
DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;

-- Create new policies without infinite recursion
CREATE POLICY "Principals can manage all classes" 
ON public.classes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'principal'
  )
);

CREATE POLICY "Teachers can view their assigned classes" 
ON public.classes 
FOR SELECT 
USING (
  teacher_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Students can view their enrolled classes" 
ON public.classes 
FOR SELECT 
USING (
  id IN (
    SELECT se.class_id
    FROM student_enrollments se
    JOIN profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'student'
  )
);

-- Fix video_materials policies to avoid recursion
DROP POLICY IF EXISTS "Principals can manage all video materials" ON public.video_materials;
DROP POLICY IF EXISTS "Teachers can manage video materials in their subjects" ON public.video_materials;
DROP POLICY IF EXISTS "Students can view video materials in their subjects" ON public.video_materials;

CREATE POLICY "Principals can manage all video materials" 
ON public.video_materials 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'principal'
  )
);

CREATE POLICY "Teachers can manage video materials in their subjects" 
ON public.video_materials 
FOR ALL 
USING (
  subject_id IN (
    SELECT s.id
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'teacher'
  )
);

CREATE POLICY "Students can view video materials in their subjects" 
ON public.video_materials 
FOR SELECT 
USING (
  subject_id IN (
    SELECT s.id
    FROM subjects s
    JOIN student_enrollments se ON s.class_id = se.class_id
    JOIN profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'student'
  )
);

-- Fix video_progress policies
DROP POLICY IF EXISTS "Principals can view all video progress" ON public.video_progress;
DROP POLICY IF EXISTS "Teachers can view video progress for their students" ON public.video_progress;
DROP POLICY IF EXISTS "Students can manage their own video progress" ON public.video_progress;

CREATE POLICY "Principals can view all video progress" 
ON public.video_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'principal'
  )
);

CREATE POLICY "Students can manage their own video progress" 
ON public.video_progress 
FOR ALL 
USING (
  student_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'student'
  )
);

CREATE POLICY "Teachers can view video progress for their students" 
ON public.video_progress 
FOR SELECT 
USING (
  video_id IN (
    SELECT vm.id
    FROM video_materials vm
    JOIN subjects s ON vm.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'teacher'
  )
);

-- Add sample video materials for demo
INSERT INTO public.video_materials (
  title,
  description,
  file_path,
  tags,
  category,
  difficulty_level,
  duration,
  transcript_text,
  uploaded_by,
  subject_id
) VALUES 
(
  'Introduction to Mathematics',
  'A comprehensive introduction to basic mathematical concepts with full accessibility features.',
  'https://sample-videos.s3.amazonaws.com/zip/10s/mp4/SampleVideo_1280x720_1mb.mp4',
  ARRAY['featured', 'public', 'mathematics', 'introduction'],
  'Mathematics',
  'beginner',
  600,
  'Welcome to our introduction to mathematics course. In this video, we will explore fundamental mathematical concepts that form the foundation of all mathematical learning. We begin with numbers, their properties, and basic operations.',
  (SELECT id FROM public.profiles WHERE role = 'principal' LIMIT 1),
  NULL
),
(
  'Science Fundamentals',
  'Explore the wonders of science with this accessible introduction to scientific methods.',
  'https://sample-videos.s3.amazonaws.com/zip/10s/mp4/SampleVideo_1280x720_2mb.mp4',
  ARRAY['featured', 'public', 'science', 'fundamentals'],
  'Science',
  'beginner',
  720,
  'Science is all around us. In this engaging video, we discover how scientific inquiry helps us understand our world. We explore observation, hypothesis formation, and the scientific method.',
  (SELECT id FROM public.profiles WHERE role = 'principal' LIMIT 1),
  NULL
),
(
  'Language Arts Basics',
  'Master the fundamentals of reading and writing with comprehensive accessibility support.',
  'https://sample-videos.s3.amazonaws.com/zip/10s/mp4/SampleVideo_1280x720_5mb.mp4',
  ARRAY['featured', 'public', 'language', 'reading', 'writing'],
  'Language Arts',
  'beginner',
  540,
  'Language is our most powerful tool for communication. In this video, we explore the basics of reading comprehension, writing skills, and effective communication strategies.',
  (SELECT id FROM public.profiles WHERE role = 'principal' LIMIT 1),
  NULL
),
(
  'History Through Time',
  'Journey through historical events with accessible storytelling and visual aids.',
  'https://sample-videos.s3.amazonaws.com/zip/10s/mp4/SampleVideo_1280x720_7mb.mp4',
  ARRAY['public', 'history', 'timeline'],
  'History',
  'intermediate',
  900,
  'History helps us understand our past and shape our future. In this comprehensive video, we travel through significant historical events and explore their impact on modern society.',
  (SELECT id FROM public.profiles WHERE role = 'principal' LIMIT 1),
  NULL
),
(
  'Art and Creativity',
  'Discover artistic expression through accessible art education.',
  'https://sample-videos.s3.amazonaws.com/zip/10s/mp4/SampleVideo_1280x720_1mb.mp4',
  ARRAY['public', 'art', 'creativity', 'expression'],
  'Art',
  'beginner',
  480,
  'Art is a universal language that transcends barriers. In this inspiring video, we explore different forms of artistic expression and learn how creativity enhances learning and communication.',
  (SELECT id FROM public.profiles WHERE role = 'principal' LIMIT 1),
  NULL
);