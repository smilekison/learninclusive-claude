-- Update RLS policies for students to access their enrolled classes, subjects, assignments, and submissions

-- Allow students to view subjects in their enrolled classes
DROP POLICY IF EXISTS "Students can view subjects in their classes" ON public.subjects;
CREATE POLICY "Students can view subjects in their enrolled classes" 
ON public.subjects 
FOR SELECT 
TO authenticated
USING (
  get_user_role() = 'student' AND 
  class_id IN (
    SELECT se.class_id 
    FROM student_enrollments se 
    JOIN profiles p ON se.student_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Allow students to view assignments in their subjects
DROP POLICY IF EXISTS "Students can view assignments in their subjects" ON public.assignments;
CREATE POLICY "Students can view assignments in their enrolled subjects" 
ON public.assignments 
FOR SELECT 
TO authenticated
USING (
  get_user_role() = 'student' AND 
  subject_id IN (
    SELECT s.id 
    FROM subjects s 
    JOIN student_enrollments se ON s.class_id = se.class_id 
    JOIN profiles p ON se.student_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Allow students to manage their own assignment submissions
DROP POLICY IF EXISTS "Students can manage their own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can manage their own assignment submissions" 
ON public.assignment_submissions 
FOR ALL 
TO authenticated
USING (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'student'
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'student'
  )
);

-- Create notification trigger for new assignments
CREATE OR REPLACE FUNCTION notify_students_new_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all students enrolled in the class that has this subject
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Assignment: ' || NEW.title,
    'A new assignment has been added to ' || s.name || (
      CASE WHEN NEW.due_date IS NOT NULL 
      THEN '. Due: ' || to_char(NEW.due_date, 'Mon DD, YYYY')
      ELSE ''
      END
    ),
    'assignment'
  FROM profiles p
  JOIN student_enrollments se ON p.id = se.student_id
  JOIN subjects s ON NEW.subject_id = s.id
  WHERE se.class_id = s.class_id
  AND p.role = 'student';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assignment notifications
DROP TRIGGER IF EXISTS trigger_notify_students_new_assignment ON assignments;
CREATE TRIGGER trigger_notify_students_new_assignment
  AFTER INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_students_new_assignment();

-- Create notification trigger for new subjects
CREATE OR REPLACE FUNCTION notify_students_new_subject()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all students enrolled in this class
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Subject: ' || NEW.name,
    'A new subject has been added to your class: ' || NEW.description,
    'info'
  FROM profiles p
  JOIN student_enrollments se ON p.id = se.student_id
  WHERE se.class_id = NEW.class_id
  AND p.role = 'student';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subject notifications
DROP TRIGGER IF EXISTS trigger_notify_students_new_subject ON subjects;
CREATE TRIGGER trigger_notify_students_new_subject
  AFTER INSERT ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION notify_students_new_subject();

-- Create notification trigger for assignment submissions to notify teachers
CREATE OR REPLACE FUNCTION notify_teacher_assignment_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the teacher of the class
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    teacher_profile.id,
    'Assignment Submitted',
    student_profile.first_name || ' ' || student_profile.last_name || 
    ' has submitted assignment: ' || a.title,
    'submission'
  FROM assignments a
  JOIN subjects s ON a.subject_id = s.id
  JOIN classes c ON s.class_id = c.id
  JOIN profiles teacher_profile ON c.teacher_id = teacher_profile.id
  JOIN profiles student_profile ON NEW.student_id = student_profile.id
  WHERE a.id = NEW.assignment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for submission notifications
DROP TRIGGER IF EXISTS trigger_notify_teacher_assignment_submission ON assignment_submissions;
CREATE TRIGGER trigger_notify_teacher_assignment_submission
  AFTER INSERT ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_assignment_submission();