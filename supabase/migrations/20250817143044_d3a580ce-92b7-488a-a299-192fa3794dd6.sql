-- Update database with realistic, sensible data
-- First, update school names
UPDATE public.schools 
SET name = CASE 
  WHEN name LIKE '%1%' OR name LIKE '%a%' OR name LIKE '%A%' THEN 'Riverside Elementary School'
  WHEN name LIKE '%2%' OR name LIKE '%b%' OR name LIKE '%B%' THEN 'Oakwood High School'
  WHEN name LIKE '%3%' OR name LIKE '%c%' OR name LIKE '%C%' THEN 'Maple Valley Middle School'
  ELSE 'Greenfield Academy'
END;

-- Update teacher profiles with realistic names by checking user_id patterns
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN role = 'teacher' AND user_id::text LIKE '%1111%' THEN 'Sarah'
    WHEN role = 'teacher' AND user_id::text LIKE '%2222%' THEN 'Michael'
    WHEN role = 'teacher' AND user_id::text LIKE '%3333%' THEN 'Emily'
    WHEN role = 'teacher' AND user_id::text LIKE '%4444%' THEN 'David'
    WHEN role = 'teacher' AND user_id::text LIKE '%5555%' THEN 'Jennifer'
    WHEN role = 'teacher' THEN 'John'
    ELSE first_name
  END,
  last_name = CASE 
    WHEN role = 'teacher' AND user_id::text LIKE '%1111%' THEN 'Johnson'
    WHEN role = 'teacher' AND user_id::text LIKE '%2222%' THEN 'Williams'
    WHEN role = 'teacher' AND user_id::text LIKE '%3333%' THEN 'Brown'
    WHEN role = 'teacher' AND user_id::text LIKE '%4444%' THEN 'Davis'
    WHEN role = 'teacher' AND user_id::text LIKE '%5555%' THEN 'Miller'
    WHEN role = 'teacher' THEN 'Anderson'
    ELSE last_name
  END
WHERE role = 'teacher';

-- Update student profiles with realistic names
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN role = 'student' AND user_id::text LIKE '%aaaa%' THEN 'Emma'
    WHEN role = 'student' AND user_id::text LIKE '%bbbb%' THEN 'Liam'
    WHEN role = 'student' AND user_id::text LIKE '%cccc%' THEN 'Olivia'
    WHEN role = 'student' AND user_id::text LIKE '%dddd%' THEN 'Noah'
    WHEN role = 'student' AND user_id::text LIKE '%eeee%' THEN 'Ava'
    WHEN role = 'student' THEN 'Alex'
    ELSE first_name
  END,
  last_name = CASE 
    WHEN role = 'student' AND user_id::text LIKE '%aaaa%' THEN 'Thompson'
    WHEN role = 'student' AND user_id::text LIKE '%bbbb%' THEN 'Garcia'
    WHEN role = 'student' AND user_id::text LIKE '%cccc%' THEN 'Martinez'
    WHEN role = 'student' AND user_id::text LIKE '%dddd%' THEN 'Rodriguez'
    WHEN role = 'student' AND user_id::text LIKE '%eeee%' THEN 'Lopez'
    WHEN role = 'student' THEN 'Smith'
    ELSE last_name
  END
WHERE role = 'student';

-- Update principal profiles
UPDATE public.profiles 
SET 
  first_name = 'Robert',
  last_name = 'Henderson'
WHERE role = 'principal';

-- Update parent profiles
UPDATE public.profiles 
SET 
  first_name = 'Margaret',
  last_name = 'Thompson'
WHERE role = 'parent';