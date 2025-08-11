-- Fix the subject invitation code function that's causing ON CONFLICT errors
-- First drop the trigger, then the function
DROP TRIGGER IF EXISTS trg_after_subject_insert_create_inv_code ON public.subjects;
DROP FUNCTION IF EXISTS public.after_subject_insert_create_inv_code() CASCADE;

-- Recreate the function without ON CONFLICT clause since there's no unique constraint
CREATE OR REPLACE FUNCTION public.after_subject_insert_create_inv_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert current subject.invitation_code as active code in association table
  -- Remove the problematic ON CONFLICT clause since there's no unique constraint
  INSERT INTO public.subject_invitation_codes (subject_id, invitation_code, created_by, is_active)
  VALUES (NEW.id, NEW.invitation_code, public.get_user_profile_id(), true);
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trg_after_subject_insert_create_inv_code
  AFTER INSERT ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.after_subject_insert_create_inv_code();