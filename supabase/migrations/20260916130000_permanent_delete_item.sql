-- The Bin page's "Permanently delete" / "Empty bin" actions previously showed
-- a destructive confirmation dialog and then only displayed a "coming soon"
-- toast, leaving the item in the bin. This adds the RPC to actually do it:
-- hard-delete the original row and remove its deleted_items tracking row.

CREATE OR REPLACE FUNCTION public.permanently_delete_item(deleted_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_record RECORD;
  caller_profile_id uuid;
BEGIN
  SELECT id INTO caller_profile_id FROM profiles WHERE user_id = auth.uid();

  SELECT * INTO deleted_record FROM deleted_items WHERE id = deleted_item_id;

  IF deleted_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Only a principal, or the teacher/staff member who originally deleted the
  -- item, may permanently remove it.
  IF NOT (is_principal() OR deleted_record.deleted_by = caller_profile_id) THEN
    RAISE EXCEPTION 'Not authorized to permanently delete this item';
  END IF;

  EXECUTE format('DELETE FROM %I WHERE id = $1', deleted_record.item_type)
  USING deleted_record.item_id;

  DELETE FROM deleted_items WHERE id = deleted_item_id;

  RETURN TRUE;
END;
$function$;
