-- Fix the soft_delete_item function to handle JSON extraction properly
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