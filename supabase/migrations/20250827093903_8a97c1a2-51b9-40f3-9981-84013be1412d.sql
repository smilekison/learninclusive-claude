-- Fix: Drop the existing policy first to avoid conflicts
DROP POLICY IF EXISTS "Students can view their own uploaded files" ON storage.objects;

-- Create assignment submissions storage bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-submissions',
  'assignment-submissions', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/x-rar-compressed']
) ON CONFLICT (id) DO NOTHING;

-- Create video storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 
  'videos', 
  false, 
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Re-create the storage policies
DROP POLICY IF EXISTS "Students can view their own assignment files" ON storage.objects;
CREATE POLICY "Students can view their own assignment files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Students can upload assignment files" ON storage.objects;
CREATE POLICY "Students can upload assignment files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Video storage policies
DROP POLICY IF EXISTS "Users can upload videos to their folder" ON storage.objects;
CREATE POLICY "Users can upload videos to their folder" 
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
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM video_materials vm
      WHERE vm.file_path = name
      AND vm.visibility IN ('public', 'unlisted')
    )
  )
);

-- Enhanced accessibility audit table for tracking
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