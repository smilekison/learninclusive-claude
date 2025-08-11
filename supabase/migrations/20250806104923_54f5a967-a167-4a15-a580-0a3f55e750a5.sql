-- Fix the security warning for the function
CREATE OR REPLACE FUNCTION create_demo_user(
  user_email TEXT,
  user_password TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_role TEXT,
  user_school_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_id UUID;
  profile_id UUID;
BEGIN
  -- Generate a UUID for the user
  user_id := gen_random_uuid();
  
  -- Insert into auth.users table (simulating Supabase auth)
  -- Note: This is for demo purposes only. In real apps, use supabase.auth.signUp()
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'first_name', user_first_name,
      'last_name', user_last_name,
      'role', user_role,
      'school_name', user_school_name
    ),
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  );

  -- The profile will be created automatically by the handle_new_user trigger

  RETURN user_id;
END;
$$;

-- Now reassign teachers to classes and populate additional data
DO $$
DECLARE
  teacher_michael_id UUID;
  teacher_lisa_id UUID;
  teacher_david_id UUID;
  student_emma_id UUID;
  student_alex_id UUID;
  student_maria_id UUID;
BEGIN
  -- Get profile IDs
  SELECT id INTO teacher_michael_id FROM public.profiles WHERE first_name = 'Michael' AND last_name = 'Chen';
  SELECT id INTO teacher_lisa_id FROM public.profiles WHERE first_name = 'Lisa' AND last_name = 'Brown';
  SELECT id INTO teacher_david_id FROM public.profiles WHERE first_name = 'David' AND last_name = 'Wilson';
  SELECT id INTO student_emma_id FROM public.profiles WHERE first_name = 'Emma' AND last_name = 'Davis';
  SELECT id INTO student_alex_id FROM public.profiles WHERE first_name = 'Alex' AND last_name = 'Smith';
  SELECT id INTO student_maria_id FROM public.profiles WHERE first_name = 'Maria' AND last_name = 'Garcia';

  -- Assign teachers to classes
  UPDATE public.classes SET teacher_id = teacher_michael_id WHERE name = 'Grade 10 Mathematics';
  UPDATE public.classes SET teacher_id = teacher_lisa_id WHERE name = 'Grade 10 Science';
  UPDATE public.classes SET teacher_id = teacher_david_id WHERE name = 'Grade 9 English';

  -- Enroll students in classes
  INSERT INTO public.student_enrollments (student_id, class_id) 
  SELECT student_emma_id, id FROM public.classes WHERE name = 'Grade 10 Mathematics'
  UNION ALL
  SELECT student_emma_id, id FROM public.classes WHERE name = 'Grade 10 Science'
  UNION ALL  
  SELECT student_alex_id, id FROM public.classes WHERE name = 'Grade 10 Mathematics'
  UNION ALL
  SELECT student_alex_id, id FROM public.classes WHERE name = 'Grade 9 English'
  UNION ALL
  SELECT student_maria_id, id FROM public.classes WHERE name = 'Grade 10 Science'
  UNION ALL
  SELECT student_maria_id, id FROM public.classes WHERE name = 'Grade 9 English';

  -- Create assignment submissions
  INSERT INTO public.assignment_submissions (assignment_id, student_id, submission_text, score, attempt_number, graded_by, feedback)
  SELECT 
    a.id,
    student_emma_id,
    'I solved all 20 equations step by step. Here are my solutions...',
    85,
    1,
    teacher_michael_id,
    'Good work! You got most answers correct.'
  FROM public.assignments a 
  WHERE a.title = 'Linear Equations Practice'
  UNION ALL
  SELECT 
    a.id,
    student_alex_id,
    'My solutions to the geometry proofs...',
    92,
    1,
    teacher_david_id,
    'Excellent proofs! Very clear reasoning.'
  FROM public.assignments a 
  WHERE a.title = 'Geometry Proofs';

  -- Create quiz attempts
  INSERT INTO public.quiz_attempts (quiz_id, student_id, answers, score, attempt_number, completed_at)
  SELECT 
    q.id,
    student_emma_id,
    '{"0": "x = 4", "1": "3"}'::jsonb,
    20,
    1,
    NOW() - INTERVAL '2 days'
  FROM public.quizzes q 
  WHERE q.title = 'Algebra Basics Quiz'
  UNION ALL
  SELECT 
    q.id,
    student_maria_id,
    '{"0": "Third Law"}'::jsonb,
    15,
    1,
    NOW() - INTERVAL '1 day'
  FROM public.quizzes q 
  WHERE q.title = 'Physics Forces Quiz';

  -- Create notifications
  INSERT INTO public.notifications (user_id, title, message, type, read)
  VALUES
  (student_emma_id, 'New Assignment Posted', 'A new assignment "Linear Equations Practice" has been posted in Algebra', 'assignment', false),
  (student_emma_id, 'Quiz Graded', 'Your Algebra Basics Quiz has been graded. Score: 20/20', 'grade', false),
  (teacher_michael_id, 'Student Submission', 'Emma Davis submitted Linear Equations Practice assignment', 'submission', true),
  (teacher_michael_id, 'New Student Enrolled', 'Alex Smith has enrolled in your Grade 10 Mathematics class', 'enrollment', false);

END $$;