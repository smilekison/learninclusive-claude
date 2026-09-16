-- Add missing columns to assignments table for enhanced functionality
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS submission_types text[] DEFAULT '{file_upload}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time_limit_minutes integer;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS show_grades_to_students boolean DEFAULT true;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS ai_assistance_config jsonb DEFAULT '{}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS analytics_config jsonb DEFAULT '{}';

-- Create assignment_classes junction table for multi-class assignments
CREATE TABLE IF NOT EXISTS assignment_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, class_id)
);

-- Enable RLS on assignment_classes
ALTER TABLE assignment_classes ENABLE ROW LEVEL SECURITY;

-- Create policies for assignment_classes
DROP POLICY IF EXISTS "Teachers can manage assignment classes for their assignments" ON assignment_classes;
CREATE POLICY "Teachers can manage assignment classes for their assignments"
ON assignment_classes FOR ALL
USING (
  assignment_id IN (
    SELECT a.id FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
  OR is_principal()
);

DROP POLICY IF EXISTS "Users can view assignment classes for accessible assignments" ON assignment_classes;
CREATE POLICY "Users can view assignment classes for accessible assignments"
ON assignment_classes FOR SELECT
USING (
  assignment_id IN (
    SELECT a.id FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN student_enrollments se ON c.id = se.class_id
    JOIN profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
  OR assignment_id IN (
    SELECT a.id FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
  OR is_principal()
);

-- Create video_materials table for custom uploaded videos
CREATE TABLE IF NOT EXISTS video_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text,
  file_url text,
  thumbnail_path text,
  duration_seconds integer,
  video_type text DEFAULT 'custom', -- 'custom', 'youtube'
  youtube_video_id text,
  description text,
  accessibility_features jsonb DEFAULT '{}',
  captions_available boolean DEFAULT false,
  sign_language_available boolean DEFAULT false,
  sign_language_video_path text,
  uploaded_by uuid REFERENCES profiles(id),
  subject_id uuid REFERENCES subjects(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS on video_materials
ALTER TABLE video_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for video_materials
DROP POLICY IF EXISTS "Teachers can manage videos for their subjects" ON video_materials;
CREATE POLICY "Teachers can manage videos for their subjects"
ON video_materials FOR ALL
USING (
  subject_id IN (
    SELECT s.id FROM subjects s
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
  OR is_principal()
);

DROP POLICY IF EXISTS "Students can view videos for their enrolled subjects" ON video_materials;
CREATE POLICY "Students can view videos for their enrolled subjects"
ON video_materials FOR SELECT
USING (
  is_active = true
  AND (
    subject_id IN (
      SELECT s.id FROM subjects s
      JOIN classes c ON s.class_id = c.id
      JOIN student_enrollments se ON c.id = se.class_id
      JOIN profiles p ON se.student_id = p.id
      WHERE p.user_id = auth.uid() AND se.status = 'active'
    )
    OR subject_id IN (
      SELECT s.id FROM subjects s
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR is_principal()
  )
);