-- Add soft delete fields to main tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create deleted_items table to track deletions
CREATE TABLE IF NOT EXISTS deleted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_details TEXT,
  original_data JSONB NOT NULL,
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on deleted_items
ALTER TABLE deleted_items ENABLE ROW LEVEL SECURITY;

-- Create policies for deleted_items
DROP POLICY IF EXISTS "Principals can manage all deleted items" ON deleted_items;
CREATE POLICY "Principals can manage all deleted items" ON deleted_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'principal'
  )
);

DROP POLICY IF EXISTS "Teachers can view their deleted items" ON deleted_items;
CREATE POLICY "Teachers can view their deleted items" ON deleted_items
FOR SELECT TO authenticated
USING (
  deleted_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Function to soft delete items
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to filter by is_active
-- For profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND is_active = true);

DROP POLICY IF EXISTS "Principals can view all profiles" ON profiles;
CREATE POLICY "Principals can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (is_principal() AND is_active = true);

-- For classes  
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON classes;
CREATE POLICY "Students can view their enrolled classes" ON classes
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT se.class_id FROM student_enrollments se
    JOIN profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  ) AND is_active = true
);

DROP POLICY IF EXISTS "Principals can manage all classes" ON classes;
CREATE POLICY "Principals can manage all classes" ON classes
FOR ALL TO authenticated
USING (is_principal() AND is_active = true);

DROP POLICY IF EXISTS "Teachers can manage all classes for demo" ON classes;
CREATE POLICY "Teachers can manage all classes for demo" ON classes
FOR ALL TO authenticated
USING (get_user_role() = 'teacher' AND is_active = true)
WITH CHECK (get_user_role() = 'teacher' AND is_active = true);