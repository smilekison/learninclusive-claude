-- Three real gaps found in a security review:
--
-- 1. assignment_submissions has a single "students manage their own
--    submissions" RLS policy (FOR ALL, keyed only on student_id = caller).
--    RLS operates at row granularity, not column granularity, so that same
--    policy that lets a student update their own submission_text also lets
--    them UPDATE score/feedback/graded_by/graded_at on their own row —
--    i.e. a student can grade their own assignment via a direct client
--    call, exactly the shape already present as a "fallback" in
--    src/pages/SubmissionsPage.tsx. A trigger is the only way to add a
--    column-aware check on top of a row-level policy.
--
-- 2. late_submission was computed client-side (in the submit-assignment
--    edge function) and only for requests that go through that function —
--    a direct insert/update via supabase-js from the browser could set
--    submitted_at/late_submission to anything, or omit late_submission
--    entirely, misrepresenting a late submission as on-time.
--
-- 3. assignments.due_date had no constraint at all, so it could be created
--    or edited to a timestamp before the assignment even existed.

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_grading()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_role text;
  caller_profile_id uuid;
BEGIN
  IF (NEW.score IS DISTINCT FROM OLD.score)
     OR (NEW.feedback IS DISTINCT FROM OLD.feedback)
     OR (NEW.graded_by IS DISTINCT FROM OLD.graded_by)
     OR (NEW.graded_at IS DISTINCT FROM OLD.graded_at)
     OR (NEW.grading_notes IS DISTINCT FROM OLD.grading_notes)
     OR (NEW.rubric_scores IS DISTINCT FROM OLD.rubric_scores)
     OR (NEW.submission_quality IS DISTINCT FROM OLD.submission_quality)
  THEN
    SELECT id, role INTO caller_profile_id, caller_role FROM profiles WHERE user_id = auth.uid();

    IF caller_role IS DISTINCT FROM 'teacher' AND caller_role IS DISTINCT FROM 'principal' THEN
      RAISE EXCEPTION 'Only teachers or principals can grade a submission';
    END IF;

    IF NEW.graded_by IS NOT NULL AND NEW.graded_by IS DISTINCT FROM caller_profile_id THEN
      RAISE EXCEPTION 'graded_by must match the authenticated grader';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_unauthorized_grading ON assignment_submissions;
CREATE TRIGGER trg_prevent_unauthorized_grading
BEFORE UPDATE ON assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unauthorized_grading();

CREATE OR REPLACE FUNCTION public.set_late_submission_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  due timestamptz;
BEGIN
  SELECT due_date INTO due FROM assignments WHERE id = NEW.assignment_id;
  NEW.late_submission := (due IS NOT NULL AND NEW.submitted_at > due);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_late_submission_flag ON assignment_submissions;
CREATE TRIGGER trg_set_late_submission_flag
BEFORE INSERT OR UPDATE ON assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.set_late_submission_flag();

-- NOT VALID: only governs new inserts/updates going forward. Existing seed
-- data intentionally includes assignments with a due_date before created_at
-- (demo "overdue" rows), so validating the whole table would break replay.
ALTER TABLE assignments
  DROP CONSTRAINT IF EXISTS assignments_due_date_not_before_creation;
ALTER TABLE assignments
  ADD CONSTRAINT assignments_due_date_not_before_creation
  CHECK (due_date IS NULL OR due_date >= created_at) NOT VALID;

-- 5. Generic rate-limiting primitive for the unauthenticated/spammable edge
--    functions (send-contact-email, send-invitation) — a request identifier
--    (caller IP or email address) plus an event type, checked and recorded
--    atomically so an edge function can cap how often something fires
--    without needing external infra.
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_lookup
  ON public.rate_limit_events (event_type, identifier, created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
-- Only accessed via the SECURITY DEFINER function below (service-role edge
-- functions bypass RLS anyway); no direct client policies are needed.

CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
  p_event_type text,
  p_identifier text,
  p_max_count integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_count integer;
BEGIN
  SELECT count(*) INTO recent_count
  FROM rate_limit_events
  WHERE event_type = p_event_type
    AND identifier = p_identifier
    AND created_at > now() - make_interval(secs => p_window_seconds);

  IF recent_count >= p_max_count THEN
    RETURN FALSE;
  END IF;

  INSERT INTO rate_limit_events (event_type, identifier) VALUES (p_event_type, p_identifier);
  RETURN TRUE;
END;
$function$;

-- 4. subject_invitation_codes: a 2025-08-17 "security hardening" migration
--    renamed "Students can view active invitation codes" to "Authenticated
--    users can view invitation codes for enrollment" but kept the same
--    unrestricted `get_user_role() = 'student'` branch — any authenticated
--    student can still SELECT every active code for every subject
--    school-wide, making the code effectively public and brute-forcing
--    unnecessary. This table isn't even read by the current frontend (the
--    join-by-code flow in src/pages/JoinSubjectPage.tsx queries
--    subjects.invitation_code directly, not this table), so there's no
--    legitimate reason for students to have blanket read access to it.
DROP POLICY IF EXISTS "Authenticated users can view invitation codes for enrollment" ON subject_invitation_codes;
CREATE POLICY "Teachers and principals can view invitation codes for their subjects"
ON subject_invitation_codes
FOR SELECT
USING (
  is_active = true
  AND auth.uid() IS NOT NULL
  AND (
    subject_id IN (
      SELECT s.id
      FROM subjects s
      JOIN classes c ON s.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR is_principal()
  )
);
