-- Seed demo data with subject triggers temporarily disabled to avoid created_by NULL
DO $$
DECLARE
  clsA uuid;
  clsB uuid;
  clsC uuid;
  subjA1 uuid; subjA2 uuid;
  subjB1 uuid; subjB2 uuid;
  subjC1 uuid; subjC2 uuid;
  class_ids uuid[];
  i int;
  u_id uuid;
  p_id uuid;
  email text;
  fnames text[] := ARRAY['Alex','Sam','Jordan','Taylor','Casey','Riley','Quinn','Morgan','Avery','Jamie'];
  lnames text[] := ARRAY['Lee','Smith','Garcia','Patel','Nguyen','Khan','Brown','Kim','Ivanov','Santos'];
BEGIN
  -- Create classes
  INSERT INTO public.classes(name, description, is_active)
  VALUES ('Class A', 'Demo class A', true)
  RETURNING id INTO clsA;

  INSERT INTO public.classes(name, description, is_active)
  VALUES ('Class B', 'Demo class B', true)
  RETURNING id INTO clsB;

  INSERT INTO public.classes(name, description, is_active)
  VALUES ('Class C', 'Demo class C', true)
  RETURNING id INTO clsC;

  -- Disable only user-defined triggers on subjects to bypass created_by requirement during seeding
  EXECUTE 'ALTER TABLE public.subjects DISABLE TRIGGER USER';

  -- Create subjects (2 per class)
  INSERT INTO public.subjects(name, description, class_id, is_active)
  VALUES ('Math A', 'Demo Math for Class A', clsA, true)
  RETURNING id INTO subjA1;

  INSERT INTO public.subjects(name, description, class_id, is_active)
  VALUES ('Science A', 'Demo Science for Class A', clsA, true)
  RETURNING id INTO subjA2;

  INSERT INTO public.subjects(name, description, class_id, is_active)
  VALUES ('Math B', 'Demo Math for Class B', clsB, true)
  RETURNING id INTO subjB1;

  INSERT INTO public.subjects(name, description, class_id, is_active)
  VALUES ('Science B', 'Demo Science for Class B', clsB, true)
  RETURNING id INTO subjB2;

  INSERT INTO public.subjects(name, description, class_id, is_active)
  VALUES ('Math C', 'Demo Math for Class C', clsC, true)
  RETURNING id INTO subjC1;

  INSERT INTO public.subjects(name, description, class_id, is_active)
  VALUES ('Science C', 'Demo Science for Class C', clsC, true)
  RETURNING id INTO subjC2;

  -- Re-enable user-defined triggers
  EXECUTE 'ALTER TABLE public.subjects ENABLE TRIGGER USER';

  class_ids := ARRAY[clsA, clsB, clsC];

  -- Create 10 student users and enroll them across the 3 classes
  FOR i IN 1..10 LOOP
    email := format('student%02s@example.com', i);

    -- Check if user already exists
    SELECT u.id INTO u_id FROM auth.users u WHERE u.email = email LIMIT 1;

    IF u_id IS NULL THEN
      -- Create demo auth user and profile via SECURITY DEFINER function
      u_id := public.create_demo_user(
        email,
        'password123!',
        fnames[i],
        lnames[i],
        'student',
        NULL
      );
    END IF;

    -- Find profile id for this auth user
    SELECT p.id INTO p_id FROM public.profiles p WHERE p.user_id = u_id LIMIT 1;

    -- Enroll student into a class (round-robin)
    IF p_id IS NOT NULL THEN
      INSERT INTO public.student_enrollments(student_id, class_id, status)
      VALUES (p_id, class_ids[((i - 1) % 3) + 1], 'active')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;