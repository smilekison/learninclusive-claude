-- Add parent role to existing enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('principal', 'teacher', 'student', 'parent');
    ELSE
        -- Add parent to existing enum if not present
        BEGIN
            ALTER TYPE app_role ADD VALUE 'parent';
        EXCEPTION WHEN duplicate_object THEN
            -- Parent already exists, continue
        END;
    END IF;
END $$;

-- Update profiles table to use the enum for role
ALTER TABLE profiles ALTER COLUMN role TYPE app_role USING role::app_role;

-- Add parent relationship table
CREATE TABLE IF NOT EXISTS public.parent_children (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    relationship_type TEXT DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(parent_id, student_id)
);

-- Enable RLS on parent_children table
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Create policies for parent_children table
CREATE POLICY "Parents can view their children relationships" 
ON public.parent_children 
FOR SELECT 
USING (parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Principals can manage all parent relationships" 
ON public.parent_children 
FOR ALL 
USING (is_principal());

-- Create sample video materials for demo
INSERT INTO public.video_materials (
    title, 
    description, 
    file_path, 
    subject_id, 
    uploaded_by, 
    transcript_text,
    tags,
    category,
    difficulty_level,
    duration
) VALUES 
(
    'Introduction to Mathematics',
    'A comprehensive introduction to basic mathematical concepts for beginners.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    (SELECT id FROM subjects LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'principal' LIMIT 1),
    'Welcome to our mathematics course. Today we will learn about numbers, addition, and subtraction. Mathematics is the foundation of many subjects and is essential for daily life.',
    ARRAY['math', 'introduction', 'basics'],
    'Mathematics',
    'beginner',
    600
),
(
    'Science Fundamentals',
    'Explore the wonders of science through engaging experiments and explanations.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    (SELECT id FROM subjects LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'principal' LIMIT 1),
    'Science helps us understand the world around us. We will explore physics, chemistry, and biology through fun experiments and clear explanations.',
    ARRAY['science', 'physics', 'chemistry', 'biology'],
    'Science',
    'intermediate',
    900
),
(
    'Language Arts Basics',
    'Develop reading, writing, and communication skills through interactive lessons.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    (SELECT id FROM subjects LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'principal' LIMIT 1),
    'Language arts encompasses reading, writing, speaking, and listening. These skills are fundamental for effective communication and academic success.',
    ARRAY['language', 'reading', 'writing', 'communication'],
    'Language Arts',
    'beginner',
    750
);

-- Create public video access for guests
CREATE POLICY "Public can view featured videos" 
ON public.video_materials 
FOR SELECT 
USING (tags @> ARRAY['featured'] OR tags @> ARRAY['public']);

-- Add some featured/public tags to demo videos
UPDATE public.video_materials 
SET tags = array_append(tags, 'featured') 
WHERE title IN ('Introduction to Mathematics', 'Science Fundamentals');

UPDATE public.video_materials 
SET tags = array_append(tags, 'public') 
WHERE title = 'Language Arts Basics';