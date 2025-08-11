import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VideoEngagementData {
  views: number;
  likes: number;
  dislikes: number;
  userLiked?: boolean;
  userDisliked?: boolean;
  isLoading: boolean;
}

export const useVideoEngagement = (videoId: string) => {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState<VideoEngagementData>({
    views: 0,
    likes: 0,
    dislikes: 0,
    userLiked: false,
    userDisliked: false,
    isLoading: true,
  });

  const fetchEngagementData = async () => {
    if (!videoId) return;

    try {
      // Get view count
      const { count: viewCount } = await supabase
        .from('video_views')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      // Get like counts
      const { data: likesData } = await supabase
        .from('video_likes')
        .select('liked, user_id')
        .eq('video_id', videoId);

      const likes = likesData?.filter(l => l.liked).length || 0;
      const dislikes = likesData?.filter(l => !l.liked).length || 0;

      // Check user's like status if logged in
      let userLiked = false;
      let userDisliked = false;
      if (user?.id && likesData) {
        const userProfile = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (userProfile.data) {
          const userLike = likesData.find(l => l.user_id === userProfile.data.id);
          if (userLike) {
            userLiked = userLike.liked;
            userDisliked = !userLike.liked;
          }
        }
      }

      setEngagement({
        views: viewCount || 0,
        likes,
        dislikes,
        userLiked,
        userDisliked,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      setEngagement(prev => ({ ...prev, isLoading: false }));
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like videos');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('Profile not found');
        return;
      }

      // Check if user already has a like/dislike
      const { data: existingLike } = await supabase
        .from('video_likes')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingLike) {
        if (existingLike.liked) {
          // Remove like
          await supabase
            .from('video_likes')
            .delete()
            .eq('id', existingLike.id);
          
          setEngagement(prev => ({
            ...prev,
            likes: prev.likes - 1,
            userLiked: false,
          }));
        } else {
          // Change from dislike to like
          await supabase
            .from('video_likes')
            .update({ liked: true })
            .eq('id', existingLike.id);
          
          setEngagement(prev => ({
            ...prev,
            likes: prev.likes + 1,
            dislikes: prev.dislikes - 1,
            userLiked: true,
            userDisliked: false,
          }));
        }
      } else {
        // Add new like
        await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: profile.id,
            liked: true,
          });
        
        setEngagement(prev => ({
          ...prev,
          likes: prev.likes + 1,
          userLiked: true,
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const toggleDislike = async () => {
    if (!user) {
      toast.error('Please sign in to dislike videos');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('Profile not found');
        return;
      }

      // Check if user already has a like/dislike
      const { data: existingLike } = await supabase
        .from('video_likes')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingLike) {
        if (!existingLike.liked) {
          // Remove dislike
          await supabase
            .from('video_likes')
            .delete()
            .eq('id', existingLike.id);
          
          setEngagement(prev => ({
            ...prev,
            dislikes: prev.dislikes - 1,
            userDisliked: false,
          }));
        } else {
          // Change from like to dislike
          await supabase
            .from('video_likes')
            .update({ liked: false })
            .eq('id', existingLike.id);
          
          setEngagement(prev => ({
            ...prev,
            likes: prev.likes - 1,
            dislikes: prev.dislikes + 1,
            userLiked: false,
            userDisliked: true,
          }));
        }
      } else {
        // Add new dislike
        await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: profile.id,
            liked: false,
          });
        
        setEngagement(prev => ({
          ...prev,
          dislikes: prev.dislikes + 1,
          userDisliked: true,
        }));
      }
    } catch (error) {
      console.error('Error toggling dislike:', error);
      toast.error('Failed to update dislike status');
    }
  };

  const shareVideo = async () => {
    const shareUrl = `${window.location.origin}/videos/details/${videoId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this video',
          url: shareUrl,
        });
        toast.success('Video shared successfully');
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare(shareUrl);
        }
      }
    } else {
      fallbackShare(shareUrl);
    }
  };

  const fallbackShare = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Video link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  useEffect(() => {
    fetchEngagementData();
  }, [videoId, user]);

  return {
    engagement,
    toggleLike,
    toggleDislike,
    shareVideo,
    refreshData: fetchEngagementData,
  };
};