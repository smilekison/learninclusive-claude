import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type VideoSource = 'youtube' | 'mp4';

interface TrackerOptions {
  device?: string;
}

export const useVideoViewTracker = (videoId?: string, source: VideoSource = 'youtube', opts: TrackerOptions = {}) => {
  const { user, loading } = useAuth();
  const viewIdRef = useRef<string | null>(null);
  const playingRef = useRef(false);
  const lastProgressAtRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const watchedRef = useRef<number>(0);
  const flushTimerRef = useRef<number | null>(null);

  const device = opts.device || (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : 'unknown');
  const sessionId = ((): string => {
    try {
      const key = 'ils-video-session';
      let sid = localStorage.getItem(key);
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(key, sid);
      }
      return sid;
    } catch {
      return Math.random().toString(36).slice(2);
    }
  })();

  const flush = async (completed = false, ended = false) => {
    if (!videoId || !viewIdRef.current) return;
    try {
      await supabase.from('video_views')
        .update({
          updated_at: new Date().toISOString(),
          watch_seconds: Math.max(0, Math.round(watchedRef.current)),
          completed,
          ended_at: ended ? new Date().toISOString() : null,
        })
        .eq('id', viewIdRef.current);
    } catch (e) {
      console.warn('[VideoAnalytics] flush failed', e);
    }
  };

  const startPlaying = async () => {
    if (!videoId) return;
    playingRef.current = true;
    if (!viewIdRef.current) {
      // create view row
      try {
        const payload: any = {
          video_id: videoId,
          source,
          device,
          session_id: sessionId,
        };
        if (user?.id) payload.user_id = user.id; // profiles.id
        const { data, error } = await supabase.from('video_views').insert(payload).select('id').single();
        if (!error && data) viewIdRef.current = data.id as string;
      } catch {}
    }
    // start periodic flush
    if (!flushTimerRef.current) {
      flushTimerRef.current = window.setInterval(() => { flush(false, false); }, 10000) as unknown as number;
    }
  };

  const pausePlaying = async () => {
    playingRef.current = false;
    await flush(false, false);
    if (flushTimerRef.current) {
      window.clearInterval(flushTimerRef.current as unknown as number);
      flushTimerRef.current = null;
    }
  };

  const reportProgress = (currentTime: number, duration?: number) => {
    const now = Date.now();
    // only accumulate when playing
    if (!playingRef.current) {
      lastTimeRef.current = currentTime;
      lastProgressAtRef.current = now;
      return;
    }
    if (lastProgressAtRef.current === 0) {
      lastProgressAtRef.current = now;
      lastTimeRef.current = currentTime;
      return;
    }
    const dt = (now - lastProgressAtRef.current) / 1000;
    const dTime = currentTime - lastTimeRef.current;
    // guard against large jumps (seeking)
    if (dTime >= 0 && dTime <= dt + 1.5) {
      watchedRef.current += dTime;
    }
    lastProgressAtRef.current = now;
    lastTimeRef.current = currentTime;
  };

  const endPlaying = async (completed = false) => {
    playingRef.current = false;
    await flush(completed, true);
    if (flushTimerRef.current) {
      window.clearInterval(flushTimerRef.current as unknown as number);
      flushTimerRef.current = null;
    }
  };

  // flush on unmount
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) window.clearInterval(flushTimerRef.current as unknown as number);
      // fire-and-forget
      void flush(false, false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { startPlaying, pausePlaying, reportProgress, endPlaying };
};
