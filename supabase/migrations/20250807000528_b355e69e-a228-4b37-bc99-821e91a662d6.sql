-- Fix function search path warnings for security
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;