-- Assign Alex Smith (student with most analytics) to the existing working parent account
-- Remove any existing relationship first, then add to the working parent
DELETE FROM parent_student_relationships 
WHERE student_id = '2930cd5c-69c2-4e0d-9d43-82a9887ac39e';

-- Add Alex Smith to the working parent account (Margaret Thompson)
INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
VALUES (
    'aa422ed7-c136-42e2-97ae-af8e13544fb3'::uuid,
    '2930cd5c-69c2-4e0d-9d43-82a9887ac39e'::uuid,
    'parent'
);

-- Update the student's parent_email to match
UPDATE profiles 
SET parent_email = 'parent@riverside.edu'
WHERE id = '2930cd5c-69c2-4e0d-9d43-82a9887ac39e';