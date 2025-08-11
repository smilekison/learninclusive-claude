-- Remove the problematic triggers that try to set invite_code on classes
DROP TRIGGER IF EXISTS trg_classes_invite_code ON public.classes;
DROP TRIGGER IF EXISTS trg_ensure_class_invite_code ON public.classes;

-- Remove the function that tries to set invite_code on classes (since classes don't have invite codes)
DROP FUNCTION IF EXISTS public.ensure_class_invite_code();