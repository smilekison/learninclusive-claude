-- Create advanced assignment types and features
CREATE TYPE assignment_type AS ENUM ('essay', 'quiz', 'file_upload', 'code_submission', 'group_project', 'presentation', 'portfolio', 'peer_review');
CREATE TYPE rubric_criteria_type AS ENUM ('excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'late', 'graded', 'returned', 'resubmitted');

-- Add new columns to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_type assignment_type DEFAULT 'file_upload';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_late_submissions boolean DEFAULT true;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS late_penalty_percent numeric(5,2) DEFAULT 10.00;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS group_assignment boolean DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_group_size integer DEFAULT 1;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS auto_grade boolean DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS peer_review boolean DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS plagiarism_check boolean DEFAULT true;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions_rich_text text;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS resources_json jsonb DEFAULT '[]'::jsonb;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rubric_id uuid;

-- Update assignment_submissions table
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_status submission_status DEFAULT 'draft';
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS peer_reviews jsonb DEFAULT '[]'::jsonb;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS plagiarism_score numeric(5,2);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS auto_grade_result jsonb;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS learning_objectives_met jsonb DEFAULT '[]'::jsonb;

-- Create assignment groups table
CREATE TABLE IF NOT EXISTS assignment_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  assignment_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  max_members integer DEFAULT 4,
  is_active boolean DEFAULT true
);

-- Create group memberships table
CREATE TABLE IF NOT EXISTS assignment_group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  student_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(group_id, student_id)
);

-- Create advanced rubrics table
CREATE TABLE IF NOT EXISTS assignment_rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  total_points numeric(10,2) DEFAULT 100.00,
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create submission comments/feedback table
CREATE TABLE IF NOT EXISTS submission_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  commenter_id uuid NOT NULL,
  comment_text text NOT NULL,
  feedback_type text DEFAULT 'general', -- general, inline, rubric, peer
  line_number integer, -- for code submissions
  timestamp_seconds numeric, -- for video submissions
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create assignment resources table
CREATE TABLE IF NOT EXISTS assignment_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  resource_type text NOT NULL, -- file, link, video, document
  resource_url text,
  file_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create plagiarism reports table
CREATE TABLE IF NOT EXISTS plagiarism_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  overall_score numeric(5,2) NOT NULL,
  detailed_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources_found jsonb DEFAULT '[]'::jsonb,
  analyzed_at timestamp with time zone DEFAULT now(),
  analyzer_version text DEFAULT '1.0'
);

-- Create learning analytics table
CREATE TABLE IF NOT EXISTS assignment_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  student_id uuid,
  metric_name text NOT NULL,
  metric_value numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE assignment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE plagiarism_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_groups
DROP POLICY IF EXISTS "Students can view groups for their assignments" ON assignment_groups;
CREATE POLICY "Students can view groups for their assignments" ON assignment_groups
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN student_enrollments se ON c.id = se.class_id
      JOIN profiles p ON se.student_id = p.id
      WHERE p.user_id = auth.uid() AND se.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Students can create groups for assignments they can access" ON assignment_groups;
CREATE POLICY "Students can create groups for assignments they can access" ON assignment_groups
  FOR INSERT WITH CHECK (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN student_enrollments se ON c.id = se.class_id
      JOIN profiles p ON se.student_id = p.id
      WHERE p.user_id = auth.uid() AND se.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Teachers can manage groups for their assignments" ON assignment_groups;
CREATE POLICY "Teachers can manage groups for their assignments" ON assignment_groups
  FOR ALL USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Principals can manage all assignment groups" ON assignment_groups;
CREATE POLICY "Principals can manage all assignment groups" ON assignment_groups
  FOR ALL USING (is_principal());

-- RLS Policies for assignment_group_memberships
DROP POLICY IF EXISTS "Users can view memberships for accessible groups" ON assignment_group_memberships;
CREATE POLICY "Users can view memberships for accessible groups" ON assignment_group_memberships
  FOR SELECT USING (
    group_id IN (
      SELECT ag.id FROM assignment_groups ag
      JOIN assignments a ON ag.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN student_enrollments se ON c.id = se.class_id
      JOIN profiles p ON se.student_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR group_id IN (
      SELECT ag.id FROM assignment_groups ag
      JOIN assignments a ON ag.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

DROP POLICY IF EXISTS "Students can join/leave groups" ON assignment_group_memberships;
CREATE POLICY "Students can join/leave groups" ON assignment_group_memberships
  FOR ALL USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can manage group memberships" ON assignment_group_memberships;
CREATE POLICY "Teachers can manage group memberships" ON assignment_group_memberships
  FOR ALL USING (
    group_id IN (
      SELECT ag.id FROM assignment_groups ag
      JOIN assignments a ON ag.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

-- RLS Policies for assignment_rubrics
DROP POLICY IF EXISTS "Users can view rubrics for accessible assignments" ON assignment_rubrics;
CREATE POLICY "Users can view rubrics for accessible assignments" ON assignment_rubrics
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN student_enrollments se ON c.id = se.class_id
      JOIN profiles p ON se.student_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

DROP POLICY IF EXISTS "Teachers can manage rubrics for their assignments" ON assignment_rubrics;
CREATE POLICY "Teachers can manage rubrics for their assignments" ON assignment_rubrics
  FOR ALL USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

-- RLS Policies for submission_feedback
DROP POLICY IF EXISTS "Users can view feedback for their submissions" ON submission_feedback;
CREATE POLICY "Users can view feedback for their submissions" ON submission_feedback
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM assignment_submissions
      WHERE student_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    ) OR submission_id IN (
      SELECT asub.id FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

DROP POLICY IF EXISTS "Teachers can provide feedback" ON submission_feedback;
CREATE POLICY "Teachers can provide feedback" ON submission_feedback
  FOR INSERT WITH CHECK (
    submission_id IN (
      SELECT asub.id FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

-- RLS Policies for assignment_resources
DROP POLICY IF EXISTS "Users can view resources for accessible assignments" ON assignment_resources;
CREATE POLICY "Users can view resources for accessible assignments" ON assignment_resources
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN student_enrollments se ON c.id = se.class_id
      JOIN profiles p ON se.student_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

DROP POLICY IF EXISTS "Teachers can manage assignment resources" ON assignment_resources;
CREATE POLICY "Teachers can manage assignment resources" ON assignment_resources
  FOR ALL USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

-- RLS Policies for plagiarism_reports
DROP POLICY IF EXISTS "Teachers can view plagiarism reports" ON plagiarism_reports;
CREATE POLICY "Teachers can view plagiarism reports" ON plagiarism_reports
  FOR SELECT USING (
    submission_id IN (
      SELECT asub.id FROM assignment_submissions asub
      JOIN assignments a ON asub.assignment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

DROP POLICY IF EXISTS "System can create plagiarism reports" ON plagiarism_reports;
CREATE POLICY "System can create plagiarism reports" ON plagiarism_reports
  FOR INSERT WITH CHECK (true);

-- RLS Policies for assignment_analytics
DROP POLICY IF EXISTS "Teachers can view analytics for their assignments" ON assignment_analytics;
CREATE POLICY "Teachers can view analytics for their assignments" ON assignment_analytics
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    ) OR is_principal()
  );

DROP POLICY IF EXISTS "System can insert analytics" ON assignment_analytics;
CREATE POLICY "System can insert analytics" ON assignment_analytics
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_groups_assignment_id ON assignment_groups(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_group_memberships_group_id ON assignment_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_assignment_group_memberships_student_id ON assignment_group_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_rubrics_assignment_id ON assignment_rubrics(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submission_feedback_submission_id ON submission_feedback(submission_id);
CREATE INDEX IF NOT EXISTS idx_assignment_resources_assignment_id ON assignment_resources(assignment_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_reports_submission_id ON plagiarism_reports(submission_id);
CREATE INDEX IF NOT EXISTS idx_assignment_analytics_assignment_id ON assignment_analytics(assignment_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assignment_groups_updated_at ON assignment_groups;
CREATE TRIGGER update_assignment_groups_updated_at BEFORE UPDATE ON assignment_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_assignment_rubrics_updated_at ON assignment_rubrics;
CREATE TRIGGER update_assignment_rubrics_updated_at BEFORE UPDATE ON assignment_rubrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_submission_feedback_updated_at ON submission_feedback;
CREATE TRIGGER update_submission_feedback_updated_at BEFORE UPDATE ON submission_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();