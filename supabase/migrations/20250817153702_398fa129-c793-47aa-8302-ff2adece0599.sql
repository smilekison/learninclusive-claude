-- Enhance profiles table for comprehensive disability-focused student management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contacts jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_information jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accessibility_preferences jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS support_services jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS learning_preferences jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS communication_preferences jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade_level text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enrollment_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disability_details jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accommodations_needed jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assistive_technology jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iep_status boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iep_document_path text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes text;

-- Create a comprehensive disability types enum
CREATE TYPE public.disability_type AS ENUM (
  'visual_impairment',
  'hearing_impairment', 
  'physical_disability',
  'cognitive_disability',
  'learning_disability',
  'autism_spectrum',
  'adhd',
  'speech_language_disorder',
  'emotional_behavioral_disorder',
  'multiple_disabilities',
  'traumatic_brain_injury',
  'other'
);

-- Create accommodation types enum
CREATE TYPE public.accommodation_type AS ENUM (
  'extended_time',
  'reduced_distractions',
  'large_print',
  'screen_reader',
  'sign_language_interpreter',
  'note_taker',
  'alternative_format',
  'assistive_technology',
  'frequent_breaks',
  'preferential_seating',
  'modified_assignments',
  'oral_testing',
  'calculator_allowed',
  'spell_check_allowed',
  'other'
);

-- Create support service types enum
CREATE TYPE public.support_service_type AS ENUM (
  'speech_therapy',
  'occupational_therapy',
  'physical_therapy',
  'counseling',
  'tutoring',
  'behavioral_support',
  'mobility_assistance',
  'communication_assistance',
  'academic_coaching',
  'social_skills_training',
  'transition_services',
  'other'
);

-- Create student accommodations table for detailed tracking
CREATE TABLE IF NOT EXISTS public.student_accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  accommodation_type public.accommodation_type NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  assigned_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create support services tracking table
CREATE TABLE IF NOT EXISTS public.student_support_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_type public.support_service_type NOT NULL,
  provider_name text,
  frequency text, -- e.g., "2x per week", "daily"
  duration_minutes integer,
  location text,
  is_active boolean DEFAULT true,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create progress tracking table
CREATE TABLE IF NOT EXISTS public.student_progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  tracked_by uuid REFERENCES public.profiles(id),
  goal_description text NOT NULL,
  current_status text,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_updated date DEFAULT CURRENT_DATE,
  target_date date,
  is_achieved boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.student_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_support_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for student accommodations
CREATE POLICY "Teachers can manage accommodations for their students" ON public.student_accommodations
  FOR ALL USING (
    student_id IN (
      SELECT se.student_id 
      FROM student_enrollments se
      JOIN classes c ON se.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Principals can manage all accommodations" ON public.student_accommodations
  FOR ALL USING (is_principal());

CREATE POLICY "Students can view their own accommodations" ON public.student_accommodations
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for support services
CREATE POLICY "Teachers can manage support services for their students" ON public.student_support_services
  FOR ALL USING (
    student_id IN (
      SELECT se.student_id 
      FROM student_enrollments se
      JOIN classes c ON se.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Principals can manage all support services" ON public.student_support_services
  FOR ALL USING (is_principal());

CREATE POLICY "Students can view their own support services" ON public.student_support_services
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for progress tracking
CREATE POLICY "Teachers can manage progress tracking for their students" ON public.student_progress_tracking
  FOR ALL USING (
    student_id IN (
      SELECT se.student_id 
      FROM student_enrollments se
      JOIN classes c ON se.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Principals can manage all progress tracking" ON public.student_progress_tracking
  FOR ALL USING (is_principal());

CREATE POLICY "Students can view their own progress tracking" ON public.student_progress_tracking
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Add triggers for updated_at columns
CREATE TRIGGER update_student_accommodations_updated_at
  BEFORE UPDATE ON public.student_accommodations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_support_services_updated_at
  BEFORE UPDATE ON public.student_support_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_tracking_updated_at
  BEFORE UPDATE ON public.student_progress_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_accommodations_student_id ON public.student_accommodations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_support_services_student_id ON public.student_support_services(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_tracking_student_id ON public.student_progress_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role = 'student';