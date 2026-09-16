-- Create video storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 
  'videos', 
  false, 
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Create assignment submissions storage bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-submissions',
  'assignment-submissions', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-rar-compressed']
) ON CONFLICT (id) DO NOTHING;

-- Video storage policies
DROP POLICY IF EXISTS "Users can upload videos to their own folder" ON storage.objects;
CREATE POLICY "Users can upload videos to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view videos based on visibility" ON storage.objects;
CREATE POLICY "Users can view videos based on visibility" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'videos' 
  AND (
    -- Users can see their own videos
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Check if video is public or user has access through school/class
    EXISTS (
      SELECT 1 FROM video_materials vm
      WHERE vm.file_path = name
      AND (
        vm.visibility = 'public'
        OR (
          vm.visibility = 'school' 
          AND vm.school_id IN (
            SELECT DISTINCT school_id 
            FROM profiles p
            JOIN student_enrollments se ON p.id = se.student_id
            JOIN classes c ON se.class_id = c.id
            WHERE p.user_id = auth.uid()
            UNION
            SELECT school_id 
            FROM profiles 
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  )
);

-- Assignment submissions storage policies
DROP POLICY IF EXISTS "Students can upload assignment files to their folder" ON storage.objects;
CREATE POLICY "Students can upload assignment files to their folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Students can view their own uploaded files" ON storage.objects;
CREATE POLICY "Students can view their own uploaded files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Teachers can view assignment files from their students" ON storage.objects;
CREATE POLICY "Teachers can view assignment files from their students" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-submissions' 
  AND (
    -- Check if the user is a teacher who has assigned work to this student
    EXISTS (
      SELECT 1 
      FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
      AND (storage.foldername(storage.objects.name))[2] = a.id::text
    )
    OR
    -- Principals can view all assignment files
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'principal'
    )
  )
);

-- Add enhanced accessibility audit table for tracking
CREATE TABLE IF NOT EXISTS accessibility_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  audit_results JSONB NOT NULL,
  compliance_score INTEGER NOT NULL,
  violations_count INTEGER NOT NULL DEFAULT 0,
  critical_issues INTEGER NOT NULL DEFAULT 0,
  serious_issues INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on accessibility audits
ALTER TABLE accessibility_audits ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own audits
DROP POLICY IF EXISTS "Users can view their own accessibility audits" ON accessibility_audits;
CREATE POLICY "Users can view their own accessibility audits" 
ON accessibility_audits 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own accessibility audits" ON accessibility_audits;
CREATE POLICY "Users can create their own accessibility audits" 
ON accessibility_audits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accessibility audits" ON accessibility_audits;
CREATE POLICY "Users can update their own accessibility audits" 
ON accessibility_audits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_accessibility_audits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_accessibility_audits_updated_at ON accessibility_audits;
CREATE TRIGGER update_accessibility_audits_updated_at
  BEFORE UPDATE ON accessibility_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_accessibility_audits_updated_at();