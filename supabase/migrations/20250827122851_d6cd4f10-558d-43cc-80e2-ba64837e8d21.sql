-- Create lesson_videos table for advanced video uploads
CREATE TABLE IF NOT EXISTS lesson_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  file_path TEXT,
  thumbnail_path TEXT,
  sign_language_video_url TEXT,
  sign_language_file_path TEXT,
  visibility TEXT NOT NULL DEFAULT 'class' CHECK (visibility IN ('public', 'private', 'class', 'school')),
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  mime_type TEXT,
  transcript_text TEXT,
  captions_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  accessibility_features JSONB DEFAULT '{"screen_reader_compatible": true, "keyboard_navigation": true, "high_contrast_support": true}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson_id ON lesson_videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_visibility ON lesson_videos(visibility);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_created_by ON lesson_videos(created_by);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_created_at ON lesson_videos(created_at DESC);

-- Enable RLS
ALTER TABLE lesson_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_videos
DROP POLICY IF EXISTS "Students can view videos in their enrolled classes" ON lesson_videos;
CREATE POLICY "Students can view videos in their enrolled classes"
ON lesson_videos FOR SELECT
USING (
  visibility = 'public' OR
  (visibility = 'school' AND lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN student_enrollments se ON c.id = se.class_id
    WHERE se.student_id = get_current_profile_id() AND se.status = 'active'
  )) OR
  (visibility = 'class' AND lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN student_enrollments se ON c.id = se.class_id
    WHERE se.student_id = get_current_profile_id() AND se.status = 'active'
  ))
);

DROP POLICY IF EXISTS "Teachers can manage videos for their lessons" ON lesson_videos;
CREATE POLICY "Teachers can manage videos for their lessons"
ON lesson_videos FOR ALL
USING (
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR is_principal()
)
WITH CHECK (
  lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR is_principal()
);

DROP POLICY IF EXISTS "Public videos viewable by everyone" ON lesson_videos;
CREATE POLICY "Public videos viewable by everyone"
ON lesson_videos FOR SELECT
USING (visibility = 'public');

-- Create video_interactions table for engagement tracking
CREATE TABLE IF NOT EXISTS video_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_video_id UUID NOT NULL REFERENCES lesson_videos(id) ON DELETE CASCADE,
  user_id UUID,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'dislike', 'share', 'complete')),
  interaction_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for video_interactions
CREATE INDEX IF NOT EXISTS idx_video_interactions_lesson_video_id ON video_interactions(lesson_video_id);
CREATE INDEX IF NOT EXISTS idx_video_interactions_user_id ON video_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_interactions_type ON video_interactions(interaction_type);

-- Enable RLS for video_interactions
ALTER TABLE video_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_interactions
DROP POLICY IF EXISTS "Users can manage their own interactions" ON video_interactions;
CREATE POLICY "Users can manage their own interactions"
ON video_interactions FOR ALL
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers can view interactions for their lesson videos" ON video_interactions;
CREATE POLICY "Teachers can view interactions for their lesson videos"
ON video_interactions FOR SELECT
USING (
  lesson_video_id IN (
    SELECT lv.id FROM lesson_videos lv
    JOIN lessons l ON lv.lesson_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ) OR is_principal()
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_lesson_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lesson_videos_updated_at_trigger ON lesson_videos;
CREATE TRIGGER update_lesson_videos_updated_at_trigger
  BEFORE UPDATE ON lesson_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_videos_updated_at();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_video_view_count(video_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE lesson_videos 
  SET view_count = view_count + 1, 
      updated_at = NOW()
  WHERE id = video_id;
  
  -- Record the view interaction
  INSERT INTO video_interactions (lesson_video_id, user_id, interaction_type, interaction_data)
  VALUES (
    video_id, 
    get_current_profile_id(), 
    'view', 
    jsonb_build_object('timestamp', NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;