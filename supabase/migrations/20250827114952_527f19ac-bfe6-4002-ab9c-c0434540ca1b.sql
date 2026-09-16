-- Create ultra-advanced assignment system with accessibility and advanced features

-- Assignment Templates
CREATE TABLE IF NOT EXISTS assignment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_data JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI-Powered Assignment Generation
CREATE TABLE IF NOT EXISTS assignment_ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'improvement', 'resource', 'rubric', 'question'
  suggestion_text TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.0,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Collaborative Assignment Creation
CREATE TABLE IF NOT EXISTS assignment_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  collaborator_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'reviewer', -- 'co-author', 'reviewer', 'observer'
  permissions JSONB DEFAULT '[]',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' -- 'pending', 'accepted', 'declined'
);

-- Submission Workflows and Approval Chains
CREATE TABLE IF NOT EXISTS submission_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  workflow_type TEXT NOT NULL DEFAULT 'simple', -- 'simple', 'approval_chain', 'peer_review', 'portfolio'
  workflow_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Advanced Rubric System
CREATE TABLE IF NOT EXISTS rubric_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject_area TEXT,
  criteria JSONB NOT NULL DEFAULT '[]',
  scale_type TEXT DEFAULT '4-point', -- '4-point', '5-point', 'percentage', 'custom'
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Submission Versions and History
CREATE TABLE IF NOT EXISTS submission_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  content_diff JSONB DEFAULT '{}',
  submission_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL
);

-- Real-time Collaboration on Submissions
CREATE TABLE IF NOT EXISTS submission_collaboration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'edit', 'comment', 'suggestion', 'review'
  action_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Advanced Plagiarism and Originality
CREATE TABLE IF NOT EXISTS originality_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL,
  check_type TEXT NOT NULL DEFAULT 'similarity', -- 'similarity', 'ai_detection', 'citation_check'
  provider TEXT NOT NULL, -- 'turnitin', 'copyleaks', 'custom'
  confidence_score NUMERIC(5,2) DEFAULT 0.0,
  detailed_report JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Assignment Recommendations
CREATE TABLE IF NOT EXISTS assignment_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'similar', 'prerequisite', 'next_level', 'remedial'
  relevance_score NUMERIC(3,2) DEFAULT 0.0,
  reasoning TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Accessibility and Universal Design
CREATE TABLE IF NOT EXISTS assignment_accessibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  wcag_compliance_level TEXT DEFAULT 'AA', -- 'A', 'AA', 'AAA'
  accessibility_features JSONB DEFAULT '[]',
  screen_reader_optimized BOOLEAN DEFAULT false,
  high_contrast_support BOOLEAN DEFAULT false,
  keyboard_navigation BOOLEAN DEFAULT false,
  audio_description BOOLEAN DEFAULT false,
  sign_language_support BOOLEAN DEFAULT false,
  dyslexia_friendly BOOLEAN DEFAULT false,
  cognitive_load_reduced BOOLEAN DEFAULT false,
  last_audit_date TIMESTAMP WITH TIME ZONE,
  accessibility_notes TEXT
);

-- Micro-Learning and Chunked Content
CREATE TABLE IF NOT EXISTS assignment_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  chunk_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  estimated_time_minutes INTEGER DEFAULT 10,
  difficulty_level TEXT DEFAULT 'medium',
  learning_objectives JSONB DEFAULT '[]',
  prerequisites JSONB DEFAULT '[]',
  chunk_type TEXT DEFAULT 'content', -- 'content', 'practice', 'assessment', 'reflection'
  accessibility_features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Scheduling and Time Management
CREATE TABLE IF NOT EXISTS assignment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  student_id UUID,
  suggested_start_date TIMESTAMP WITH TIME ZONE,
  suggested_end_date TIMESTAMP WITH TIME ZONE,
  estimated_duration_hours NUMERIC(5,2),
  difficulty_adjustment NUMERIC(3,2) DEFAULT 1.0,
  personalization_factors JSONB DEFAULT '{}',
  schedule_type TEXT DEFAULT 'adaptive', -- 'fixed', 'adaptive', 'flexible'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Multimedia and Interactive Elements
CREATE TABLE IF NOT EXISTS assignment_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  media_type TEXT NOT NULL, -- 'video', 'audio', 'interactive', 'vr', 'ar', 'simulation'
  file_path TEXT,
  external_url TEXT,
  metadata JSONB DEFAULT '{}',
  accessibility_alternatives JSONB DEFAULT '{}', -- captions, transcripts, alt-text
  interaction_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competency and Skills Tracking
CREATE TABLE IF NOT EXISTS assignment_competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  competency_name TEXT NOT NULL,
  competency_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  weight NUMERIC(3,2) DEFAULT 1.0,
  assessment_criteria JSONB DEFAULT '[]',
  industry_standard TEXT, -- link to industry frameworks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time Analytics and Insights
CREATE TABLE IF NOT EXISTS assignment_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'engagement', 'difficulty', 'completion_time', 'common_errors'
  insight_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confidence_level NUMERIC(3,2) DEFAULT 0.0,
  actionable_recommendations JSONB DEFAULT '[]'
);

-- Submission Portfolio and Showcase
CREATE TABLE IF NOT EXISTS student_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  portfolio_name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  showcase_submissions JSONB DEFAULT '[]',
  portfolio_theme JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_templates_category ON assignment_templates(category);
CREATE INDEX IF NOT EXISTS idx_assignment_templates_public ON assignment_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_assignment_ai_suggestions_assignment ON assignment_ai_suggestions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_collaborators_assignment ON assignment_collaborators(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submission_workflows_assignment ON submission_workflows(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submission_versions_submission ON submission_versions(submission_id);
CREATE INDEX IF NOT EXISTS idx_originality_checks_submission ON originality_checks(submission_id);
CREATE INDEX IF NOT EXISTS idx_assignment_recommendations_student ON assignment_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_accessibility_assignment ON assignment_accessibility(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_chunks_assignment ON assignment_chunks(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_schedules_student ON assignment_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_media_assignment ON assignment_media(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_competencies_assignment ON assignment_competencies(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_insights_assignment ON assignment_insights(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_portfolios_student ON student_portfolios(student_id);

-- Enable RLS
ALTER TABLE assignment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_collaboration ENABLE ROW LEVEL SECURITY;
ALTER TABLE originality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_accessibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_portfolios ENABLE ROW LEVEL SECURITY;

-- RLS Policies (comprehensive access control)

-- Assignment Templates
DROP POLICY IF EXISTS "Public templates viewable by all" ON assignment_templates;
CREATE POLICY "Public templates viewable by all" ON assignment_templates FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Teachers can manage their templates" ON assignment_templates;
CREATE POLICY "Teachers can manage their templates" ON assignment_templates FOR ALL USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
DROP POLICY IF EXISTS "Principals can manage all templates" ON assignment_templates;
CREATE POLICY "Principals can manage all templates" ON assignment_templates FOR ALL USING (is_principal());

-- Assignment AI Suggestions
DROP POLICY IF EXISTS "Teachers can view AI suggestions for their assignments" ON assignment_ai_suggestions;
CREATE POLICY "Teachers can view AI suggestions for their assignments" ON assignment_ai_suggestions FOR SELECT USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid())
);
DROP POLICY IF EXISTS "System can insert AI suggestions" ON assignment_ai_suggestions;
CREATE POLICY "System can insert AI suggestions" ON assignment_ai_suggestions FOR INSERT WITH CHECK (true);

-- Assignment Collaborators
DROP POLICY IF EXISTS "Teachers can manage collaborators for their assignments" ON assignment_collaborators;
CREATE POLICY "Teachers can manage collaborators for their assignments" ON assignment_collaborators FOR ALL USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Collaborators can view their collaborations" ON assignment_collaborators;
CREATE POLICY "Collaborators can view their collaborations" ON assignment_collaborators FOR SELECT USING (
  collaborator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Submission Workflows
DROP POLICY IF EXISTS "Teachers can manage workflows for their assignments" ON submission_workflows;
CREATE POLICY "Teachers can manage workflows for their assignments" ON submission_workflows FOR ALL USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);

-- Rubric Templates
DROP POLICY IF EXISTS "Public rubrics viewable by all" ON rubric_templates;
CREATE POLICY "Public rubrics viewable by all" ON rubric_templates FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Teachers can manage their rubrics" ON rubric_templates;
CREATE POLICY "Teachers can manage their rubrics" ON rubric_templates FOR ALL USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'teacher'));
DROP POLICY IF EXISTS "Principals can manage all rubrics" ON rubric_templates;
CREATE POLICY "Principals can manage all rubrics" ON rubric_templates FOR ALL USING (is_principal());

-- Submission Versions
DROP POLICY IF EXISTS "Students can manage versions of their submissions" ON submission_versions;
CREATE POLICY "Students can manage versions of their submissions" ON submission_versions FOR ALL USING (
  submission_id IN (SELECT id FROM assignment_submissions WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
DROP POLICY IF EXISTS "Teachers can view versions for their assignments" ON submission_versions;
CREATE POLICY "Teachers can view versions for their assignments" ON submission_versions FOR SELECT USING (
  submission_id IN (SELECT asub.id FROM assignment_submissions asub JOIN assignments a ON asub.assignment_id = a.id JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid())
);

-- Submission Collaboration
DROP POLICY IF EXISTS "Users can view collaboration on their submissions" ON submission_collaboration;
CREATE POLICY "Users can view collaboration on their submissions" ON submission_collaboration FOR SELECT USING (
  submission_id IN (SELECT id FROM assignment_submissions WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())) OR 
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can collaborate on accessible submissions" ON submission_collaboration;
CREATE POLICY "Users can collaborate on accessible submissions" ON submission_collaboration FOR INSERT WITH CHECK (
  submission_id IN (SELECT id FROM assignment_submissions WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Originality Checks
DROP POLICY IF EXISTS "Teachers can view originality checks for their assignments" ON originality_checks;
CREATE POLICY "Teachers can view originality checks for their assignments" ON originality_checks FOR SELECT USING (
  submission_id IN (SELECT asub.id FROM assignment_submissions asub JOIN assignments a ON asub.assignment_id = a.id JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "System can create originality checks" ON originality_checks;
CREATE POLICY "System can create originality checks" ON originality_checks FOR INSERT WITH CHECK (true);

-- Assignment Recommendations
DROP POLICY IF EXISTS "Students can view their recommendations" ON assignment_recommendations;
CREATE POLICY "Students can view their recommendations" ON assignment_recommendations FOR SELECT USING (
  student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Teachers can view recommendations for their students" ON assignment_recommendations;
CREATE POLICY "Teachers can view recommendations for their students" ON assignment_recommendations FOR SELECT USING (
  student_id IN (SELECT se.student_id FROM student_enrollments se JOIN classes c ON se.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "System can create recommendations" ON assignment_recommendations;
CREATE POLICY "System can create recommendations" ON assignment_recommendations FOR INSERT WITH CHECK (true);

-- Assignment Accessibility
DROP POLICY IF EXISTS "Teachers can manage accessibility for their assignments" ON assignment_accessibility;
CREATE POLICY "Teachers can manage accessibility for their assignments" ON assignment_accessibility FOR ALL USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "Students can view accessibility info for their assignments" ON assignment_accessibility;
CREATE POLICY "Students can view accessibility info for their assignments" ON assignment_accessibility FOR SELECT USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN student_enrollments se ON c.id = se.class_id JOIN profiles p ON se.student_id = p.id WHERE p.user_id = auth.uid())
);

-- Assignment Chunks
DROP POLICY IF EXISTS "Teachers can manage chunks for their assignments" ON assignment_chunks;
CREATE POLICY "Teachers can manage chunks for their assignments" ON assignment_chunks FOR ALL USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "Students can view chunks for their assignments" ON assignment_chunks;
CREATE POLICY "Students can view chunks for their assignments" ON assignment_chunks FOR SELECT USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN student_enrollments se ON c.id = se.class_id JOIN profiles p ON se.student_id = p.id WHERE p.user_id = auth.uid())
);

-- Assignment Schedules
DROP POLICY IF EXISTS "Students can view their personalized schedules" ON assignment_schedules;
CREATE POLICY "Students can view their personalized schedules" ON assignment_schedules FOR SELECT USING (
  student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR student_id IS NULL
);
DROP POLICY IF EXISTS "Teachers can manage schedules for their students" ON assignment_schedules;
CREATE POLICY "Teachers can manage schedules for their students" ON assignment_schedules FOR ALL USING (
  student_id IN (SELECT se.student_id FROM student_enrollments se JOIN classes c ON se.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "System can create adaptive schedules" ON assignment_schedules;
CREATE POLICY "System can create adaptive schedules" ON assignment_schedules FOR INSERT WITH CHECK (true);

-- Assignment Media
DROP POLICY IF EXISTS "Teachers can manage media for their assignments" ON assignment_media;
CREATE POLICY "Teachers can manage media for their assignments" ON assignment_media FOR ALL USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "Students can view media for their assignments" ON assignment_media;
CREATE POLICY "Students can view media for their assignments" ON assignment_media FOR SELECT USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN student_enrollments se ON c.id = se.class_id JOIN profiles p ON se.student_id = p.id WHERE p.user_id = auth.uid())
);

-- Assignment Competencies
DROP POLICY IF EXISTS "Teachers can manage competencies for their assignments" ON assignment_competencies;
CREATE POLICY "Teachers can manage competencies for their assignments" ON assignment_competencies FOR ALL USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "Students can view competencies for their assignments" ON assignment_competencies;
CREATE POLICY "Students can view competencies for their assignments" ON assignment_competencies FOR SELECT USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN student_enrollments se ON c.id = se.class_id JOIN profiles p ON se.student_id = p.id WHERE p.user_id = auth.uid())
);

-- Assignment Insights
DROP POLICY IF EXISTS "Teachers can view insights for their assignments" ON assignment_insights;
CREATE POLICY "Teachers can view insights for their assignments" ON assignment_insights FOR SELECT USING (
  assignment_id IN (SELECT a.id FROM assignments a JOIN subjects s ON a.subject_id = s.id JOIN classes c ON s.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);
DROP POLICY IF EXISTS "System can generate insights" ON assignment_insights;
CREATE POLICY "System can generate insights" ON assignment_insights FOR INSERT WITH CHECK (true);

-- Student Portfolios
DROP POLICY IF EXISTS "Students can manage their portfolios" ON student_portfolios;
CREATE POLICY "Students can manage their portfolios" ON student_portfolios FOR ALL USING (
  student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Public portfolios viewable by all" ON student_portfolios;
CREATE POLICY "Public portfolios viewable by all" ON student_portfolios FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Teachers can view portfolios of their students" ON student_portfolios;
CREATE POLICY "Teachers can view portfolios of their students" ON student_portfolios FOR SELECT USING (
  student_id IN (SELECT se.student_id FROM student_enrollments se JOIN classes c ON se.class_id = c.id JOIN profiles p ON c.teacher_id = p.id WHERE p.user_id = auth.uid()) OR is_principal()
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assignment_templates_updated_at ON assignment_templates;
CREATE TRIGGER update_assignment_templates_updated_at BEFORE UPDATE ON assignment_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_student_portfolios_updated_at ON student_portfolios;
CREATE TRIGGER update_student_portfolios_updated_at BEFORE UPDATE ON student_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();