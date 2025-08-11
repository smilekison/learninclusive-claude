-- Remove class enrollment code system
-- Drop enrollment_requests table
DROP TABLE IF EXISTS enrollment_requests;

-- Remove enrollment_code column from classes table
ALTER TABLE classes DROP COLUMN IF EXISTS enrollment_code;