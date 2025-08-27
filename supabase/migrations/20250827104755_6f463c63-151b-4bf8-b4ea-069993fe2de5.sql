-- Add missing columns to assignments table for enhanced functionality
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS submission_types text[] DEFAULT '{file_upload}',
ADD COLUMN IF NOT EXISTS time_limit_minutes integer,
ADD COLUMN IF NOT EXISTS show_grades_to_students boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_assistance_config jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS analytics_config jsonb DEFAULT '{}';