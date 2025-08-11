-- Force delete all data from main database tables
TRUNCATE TABLE 
  video_progress,
  video_materials,
  subject_enrollment_requests,
  student_subject_enrollments,
  student_enrollments,
  quiz_attempts,
  quizzes,
  notifications,
  materials,
  lessons,
  email_invitations,
  deleted_items,
  assignment_submissions,
  assignments,
  subjects,
  classes,
  profiles,
  schools
RESTART IDENTITY CASCADE;