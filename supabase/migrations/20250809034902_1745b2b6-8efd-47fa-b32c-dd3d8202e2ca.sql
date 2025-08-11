-- Create demo principal user
SELECT public.create_demo_user(
  'prin@riverside.edu',
  'demo123',
  'Principal',
  'Admin',
  'principal',
  'Riverside Academy'
);

-- Create demo teacher user  
SELECT public.create_demo_user(
  'tea@riverside.edu',
  'demo123',
  'Teacher',
  'Demo',
  'teacher',
  NULL
);

-- Create demo student user
SELECT public.create_demo_user(
  'smilekisan@riverside.edu', 
  'demo123',
  'Student',
  'Demo',
  'student',
  NULL
);