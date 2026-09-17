-- Security fix: soft_delete_item took table_name and deleter_id directly from
-- the client (useSoftDelete in src/hooks/useSupabaseQuery.ts passes both
-- straight through to supabase.rpc), then used table_name in dynamic SQL
-- (EXECUTE format('UPDATE %I ...')) inside a SECURITY DEFINER function with
-- no allow-list and no check that deleter_id was actually the caller.
--
-- That let any authenticated user soft-delete (and, after
-- permanently_delete_item was added, hard-delete) an arbitrary row in ANY
-- table by name, while forging deleter_id to equal their own profile id —
-- which was exactly the check permanently_delete_item relied on to decide
-- who's allowed to finish the deletion. Fixed by deriving the deleter from
-- auth.uid() server-side (ignoring the client-supplied deleter_id) and
-- restricting table_name to the four tables these functions actually know
-- how to handle.

CREATE OR REPLACE FUNCTION public.soft_delete_item(table_name text, item_id uuid, deleter_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item_data JSONB;
  item_name TEXT;
  item_details TEXT;
  actual_deleter_id uuid;
BEGIN
  SELECT id INTO actual_deleter_id FROM profiles WHERE user_id = auth.uid();
  IF actual_deleter_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF table_name NOT IN ('profiles', 'classes', 'subjects', 'assignments') THEN
    RAISE EXCEPTION 'Invalid table_name: %', table_name;
  END IF;

  EXECUTE format('SELECT row_to_json(t) FROM %I t WHERE id = $1', table_name)
  INTO item_data USING item_id;

  IF item_data IS NULL THEN
    RETURN FALSE;
  END IF;

  CASE table_name
    WHEN 'profiles' THEN
      item_name := COALESCE(item_data->>'first_name', '') || ' ' || COALESCE(item_data->>'last_name', '');
      item_details := COALESCE(item_data->>'role', 'Unknown role');
    WHEN 'classes' THEN
      item_name := COALESCE(item_data->>'name', 'Unnamed class');
      item_details := COALESCE(item_data->>'description', 'No description');
    WHEN 'subjects' THEN
      item_name := COALESCE(item_data->>'name', 'Unnamed subject');
      item_details := COALESCE(item_data->>'description', 'No description');
    WHEN 'assignments' THEN
      item_name := COALESCE(item_data->>'title', 'Unnamed assignment');
      item_details := COALESCE(item_data->>'description', 'No description');
  END CASE;

  INSERT INTO deleted_items (item_type, item_id, item_name, item_details, original_data, deleted_by)
  VALUES (table_name, item_id, item_name, item_details, item_data, actual_deleter_id);

  EXECUTE format('UPDATE %I SET is_active = false WHERE id = $1', table_name)
  USING item_id;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_deleted_item(deleted_item_id uuid)
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

  IF deleted_record.item_type NOT IN ('profiles', 'classes', 'subjects', 'assignments') THEN
    RAISE EXCEPTION 'Invalid item_type on deleted_items row: %', deleted_record.item_type;
  END IF;

  IF NOT (is_principal() OR deleted_record.deleted_by = caller_profile_id) THEN
    RAISE EXCEPTION 'Not authorized to restore this item';
  END IF;

  EXECUTE format('UPDATE %I SET is_active = true WHERE id = $1', deleted_record.item_type)
  USING deleted_record.item_id;

  DELETE FROM deleted_items WHERE id = deleted_item_id;

  RETURN TRUE;
END;
$function$;

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

  IF deleted_record.item_type NOT IN ('profiles', 'classes', 'subjects', 'assignments') THEN
    RAISE EXCEPTION 'Invalid item_type on deleted_items row: %', deleted_record.item_type;
  END IF;

  IF NOT (is_principal() OR deleted_record.deleted_by = caller_profile_id) THEN
    RAISE EXCEPTION 'Not authorized to permanently delete this item';
  END IF;

  EXECUTE format('DELETE FROM %I WHERE id = $1', deleted_record.item_type)
  USING deleted_record.item_id;

  DELETE FROM deleted_items WHERE id = deleted_item_id;

  RETURN TRUE;
END;
$function$;
