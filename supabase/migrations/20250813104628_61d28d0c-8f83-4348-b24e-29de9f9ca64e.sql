-- Add triggers for assignment submission notifications and fix multiple submissions issue
DO $$
BEGIN
    -- Create or replace trigger function for student assignment submissions
    CREATE OR REPLACE FUNCTION public.notify_teacher_assignment_submission()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $function$
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
    $function$;

    -- Create or replace trigger function for graded assignment notifications
    CREATE OR REPLACE FUNCTION public.notify_student_assignment_graded()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $function$
    BEGIN
      -- Only notify if assignment was just graded (score was null, now has value)
      IF OLD.score IS NULL AND NEW.score IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type)
        SELECT 
          student_profile.id,
          'Assignment Graded: ' || a.title,
          'Your assignment "' || a.title || '" has been graded. Score: ' || 
          NEW.score || '/' || a.max_score || '. ' ||
          CASE WHEN NEW.feedback IS NOT NULL THEN 'Feedback: ' || NEW.feedback ELSE '' END,
          'grade'
        FROM assignments a
        JOIN profiles student_profile ON NEW.student_id = student_profile.id
        WHERE a.id = NEW.assignment_id;
      END IF;
      
      RETURN NEW;
    END;
    $function$;

    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS notify_teacher_submission ON assignment_submissions;
    DROP TRIGGER IF EXISTS notify_student_graded ON assignment_submissions;

    -- Create triggers
    CREATE TRIGGER notify_teacher_submission
      AFTER INSERT ON assignment_submissions
      FOR EACH ROW
      EXECUTE FUNCTION notify_teacher_assignment_submission();

    CREATE TRIGGER notify_student_graded
      AFTER UPDATE ON assignment_submissions
      FOR EACH ROW
      EXECUTE FUNCTION notify_student_assignment_graded();

    RAISE NOTICE 'Assignment submission triggers created successfully';
END $$;