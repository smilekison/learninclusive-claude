-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can INSERT into their own folder - assignment-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can SELECT their own files - assignment-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can UPDATE their own files - assignment-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can DELETE their own files - assignment-submissions" ON storage.objects;

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions','assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: allow authenticated users to upload to their own folder (auth.uid as top-level folder)
DROP POLICY IF EXISTS "Users can INSERT into their own folder - assignment-submissions" ON storage.objects;
CREATE POLICY "Users can INSERT into their own folder - assignment-submissions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: allow authenticated users to SELECT their own files
DROP POLICY IF EXISTS "Users can SELECT their own files - assignment-submissions" ON storage.objects;
CREATE POLICY "Users can SELECT their own files - assignment-submissions"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: allow authenticated users to UPDATE their own files
DROP POLICY IF EXISTS "Users can UPDATE their own files - assignment-submissions" ON storage.objects;
CREATE POLICY "Users can UPDATE their own files - assignment-submissions"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: allow authenticated users to DELETE their own files
DROP POLICY IF EXISTS "Users can DELETE their own files - assignment-submissions" ON storage.objects;
CREATE POLICY "Users can DELETE their own files - assignment-submissions"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );