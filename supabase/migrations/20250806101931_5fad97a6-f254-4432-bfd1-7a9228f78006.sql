-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('principal', 'teacher', 'student')),
  school_name TEXT,
  disabilities TEXT[] DEFAULT '{}',
  parent_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  principal_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  enrollment_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  lesson_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  max_attempts INTEGER DEFAULT 3,
  allowed_file_types TEXT[] DEFAULT '{}',
  max_score DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]',
  time_limit INTEGER, -- in minutes
  max_attempts INTEGER DEFAULT 3,
  max_score DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student enrollments table
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- Create assignment submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_path TEXT,
  attempt_number INTEGER DEFAULT 1,
  score DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES public.profiles(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(5,2),
  attempt_number INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.profiles;
CREATE POLICY "Teachers can view students in their classes" ON public.profiles 
FOR SELECT USING (
  role = 'student' AND id IN (
    SELECT se.student_id FROM public.student_enrollments se
    JOIN public.classes c ON se.class_id = c.id
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Principals can view all profiles" ON public.profiles;
CREATE POLICY "Principals can view all profiles" ON public.profiles 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'principal')
);

-- RLS Policies for schools
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;
CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);
DROP POLICY IF EXISTS "Principals can manage schools" ON public.schools;
CREATE POLICY "Principals can manage schools" ON public.schools 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'principal')
);

-- RLS Policies for classes
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;
CREATE POLICY "Students can view their enrolled classes" ON public.classes 
FOR SELECT USING (
  id IN (
    SELECT se.class_id FROM public.student_enrollments se
    JOIN public.profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
CREATE POLICY "Teachers can view their assigned classes" ON public.classes 
FOR SELECT USING (
  teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;
CREATE POLICY "Principals can manage all classes" ON public.classes 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'principal')
);

-- RLS Policies for subjects
DROP POLICY IF EXISTS "Students can view subjects in their classes" ON public.subjects;
CREATE POLICY "Students can view subjects in their classes" ON public.subjects 
FOR SELECT USING (
  class_id IN (
    SELECT se.class_id FROM public.student_enrollments se
    JOIN public.profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can manage subjects in their classes" ON public.subjects;
CREATE POLICY "Teachers can manage subjects in their classes" ON public.subjects 
FOR ALL USING (
  class_id IN (
    SELECT c.id FROM public.classes c
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for lessons
DROP POLICY IF EXISTS "Students can view lessons in their subjects" ON public.lessons;
CREATE POLICY "Students can view lessons in their subjects" ON public.lessons 
FOR SELECT USING (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.student_enrollments se ON s.class_id = se.class_id
    JOIN public.profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can manage lessons in their subjects" ON public.lessons;
CREATE POLICY "Teachers can manage lessons in their subjects" ON public.lessons 
FOR ALL USING (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for assignments
DROP POLICY IF EXISTS "Students can view assignments in their subjects" ON public.assignments;
CREATE POLICY "Students can view assignments in their subjects" ON public.assignments 
FOR SELECT USING (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.student_enrollments se ON s.class_id = se.class_id
    JOIN public.profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can manage assignments in their subjects" ON public.assignments;
CREATE POLICY "Teachers can manage assignments in their subjects" ON public.assignments 
FOR ALL USING (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for assignment submissions
DROP POLICY IF EXISTS "Students can manage their own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can manage their own submissions" ON public.assignment_submissions 
FOR ALL USING (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON public.assignment_submissions;
CREATE POLICY "Teachers can view submissions for their assignments" ON public.assignment_submissions 
FOR SELECT USING (
  assignment_id IN (
    SELECT a.id FROM public.assignments a
    JOIN public.subjects s ON a.subject_id = s.id
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can grade submissions for their assignments" ON public.assignment_submissions;
CREATE POLICY "Teachers can grade submissions for their assignments" ON public.assignment_submissions 
FOR UPDATE USING (
  assignment_id IN (
    SELECT a.id FROM public.assignments a
    JOIN public.subjects s ON a.subject_id = s.id
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications 
FOR SELECT USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications 
FOR UPDATE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();