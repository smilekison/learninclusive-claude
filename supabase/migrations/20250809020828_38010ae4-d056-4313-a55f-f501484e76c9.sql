-- Create 5 new student accounts
SELECT create_demo_user('student1@riverside.edu', 'demo123', 'Alex', 'Johnson', 'student');
SELECT create_demo_user('student2@riverside.edu', 'demo123', 'Sarah', 'Williams', 'student');
SELECT create_demo_user('student3@riverside.edu', 'demo123', 'David', 'Brown', 'student');
SELECT create_demo_user('student4@riverside.edu', 'demo123', 'Lisa', 'Miller', 'student');
SELECT create_demo_user('student5@riverside.edu', 'demo123', 'James', 'Wilson', 'student');

-- Create 1 new teacher account
SELECT create_demo_user('teacher1@riverside.edu', 'demo123', 'Jennifer', 'Anderson', 'teacher');