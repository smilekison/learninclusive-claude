-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION soft_delete_item(
  table_name TEXT,
  item_id UUID,
  deleter_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  item_data JSONB;
  item_name TEXT;
  item_details TEXT;
BEGIN
  -- Get item data before deletion
  EXECUTE format('SELECT row_to_json(t) FROM %I t WHERE id = $1', table_name) 
  INTO item_data USING item_id;
  
  IF item_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Extract name and details based on table
  CASE table_name
    WHEN 'profiles' THEN
      item_name := item_data->>'first_name' || ' ' || item_data->>'last_name';
      item_details := item_data->>'role';
    WHEN 'classes' THEN
      item_name := item_data->>'name';
      item_details := item_data->>'description';
    WHEN 'subjects' THEN
      item_name := item_data->>'name';
      item_details := item_data->>'description';
    WHEN 'assignments' THEN
      item_name := item_data->>'title';
      item_details := item_data->>'description';
    ELSE
      item_name := 'Unknown';
      item_details := '';
  END CASE;
  
  -- Insert into deleted_items
  INSERT INTO deleted_items (item_type, item_id, item_name, item_details, original_data, deleted_by)
  VALUES (table_name, item_id, item_name, item_details, item_data, deleter_id);
  
  -- Soft delete the item
  EXECUTE format('UPDATE %I SET is_active = false WHERE id = $1', table_name) 
  USING item_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Function to restore items
CREATE OR REPLACE FUNCTION restore_deleted_item(deleted_item_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  deleted_record RECORD;
BEGIN
  -- Get the deleted item record
  SELECT * INTO deleted_record FROM deleted_items WHERE id = deleted_item_id;
  
  IF deleted_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Restore the item
  EXECUTE format('UPDATE %I SET is_active = true WHERE id = $1', deleted_record.item_type) 
  USING deleted_record.item_id;
  
  -- Remove from deleted_items
  DELETE FROM deleted_items WHERE id = deleted_item_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';