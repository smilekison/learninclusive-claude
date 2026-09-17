-- Uploaded (non-YouTube) videos always got thumbnail_path = null — there
-- was no bucket to put a thumbnail image in, since 'videos' only accepts
-- video mime types and is private (thumbnails are rendered as plain <img
-- src> in listings, which needs a permanent public URL, not a short-lived
-- signed one). Add a small public bucket for thumbnail images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-thumbnails',
  'video-thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload thumbnails to their folder" ON storage.objects;
CREATE POLICY "Users can upload thumbnails to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'video-thumbnails'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Anyone can view video thumbnails" ON storage.objects;
CREATE POLICY "Anyone can view video thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'video-thumbnails');

DROP POLICY IF EXISTS "Users can replace their own thumbnails" ON storage.objects;
CREATE POLICY "Users can replace their own thumbnails"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'video-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'video-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects
FOR DELETE
USING (bucket_id = 'video-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
