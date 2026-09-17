-- The sign-language "popup" slot only supported a YouTube video
-- (sign_language_video_path held either a "youtube:<id>" marker or a raw
-- file path, and the player only knew how to build a YT.Player for it).
-- Mirror the primary video's own three-column pattern (file_path /
-- external_url / video_format) so the popup slot can independently be
-- either an uploaded file or a YouTube video, same as the primary slot.
ALTER TABLE video_materials
  ADD COLUMN IF NOT EXISTS sign_language_external_url text,
  ADD COLUMN IF NOT EXISTS sign_language_video_format text;
