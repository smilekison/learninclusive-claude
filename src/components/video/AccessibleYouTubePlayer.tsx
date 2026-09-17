import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Play, Pause, Captions, Hand, X, RotateCcw, RotateCw } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useTTS } from '@/contexts/TTSContext';
import { useVideoViewTracker } from '@/hooks/useVideoAnalytics';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const useYouTubeAPI = () => {
  const [ready, setReady] = useState<boolean>(!!window.YT);

  useEffect(() => {
    if (window.YT) {
      setReady(true);
      return;
    }

    const existing = document.getElementById('youtube-iframe-api');
    if (existing) return;

    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => setReady(true);
  }, []);

  return ready;
};

interface AccessibleYouTubePlayerProps {
  videoId: string;
  /** A distinct sign-language interpretation video shown in the popup —
   * either a YouTube video id, or (with signLanguageVideoUrl set instead)
   * a direct file URL. Falls back to mirroring `videoId` when neither is
   * provided. */
  signLanguageVideoId?: string;
  /** A direct playable URL (e.g. a signed storage URL) for an uploaded
   * sign-language video file. Takes priority over signLanguageVideoId. */
  signLanguageVideoUrl?: string;
  title?: string;
  captionLang?: string; // e.g., 'en', 'lt'
  className?: string;
  videoDbId?: string; // database id of video_materials row for analytics
}

const AccessibleYouTubePlayer: React.FC<AccessibleYouTubePlayerProps> = ({
  videoId,
  signLanguageVideoId,
  signLanguageVideoUrl,
  title,
  captionLang = 'en',
  className,
  videoDbId,
}) => {
  const apiReady = useYouTubeAPI();
  const playerRef = useRef<any>(null);
  const miniRef = useRef<any>(null);
  const miniVideoId = signLanguageVideoId || videoId;
  const containerId = useMemo(() => `ytp_${videoId}_${Math.random().toString(36).slice(2)}`, [videoId]);
  const miniContainerId = useMemo(() => `ytp_mini_${videoId}_${Math.random().toString(36).slice(2)}`, [videoId]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [openSign, setOpenSign] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const tracker = useVideoViewTracker(videoDbId, 'youtube');
  // Draggable sign-language overlay (viewport)
  const overlayRef = useRef<HTMLDivElement>(null);
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('sign-overlay-pos');
      if (saved) return JSON.parse(saved);
    } catch { /* localStorage unavailable — fall through to default */ }
    // Default to the bottom-right corner rather than covering the top-left
    // controls, using the default popup dimensions (320 wide, 16:9 + header).
    const defaultWidth = 320;
    const defaultHeight = defaultWidth * 9 / 16 + 40;
    return {
      x: Math.max(20, window.innerWidth - defaultWidth - 20),
      y: Math.max(20, window.innerHeight - defaultHeight - 20),
    };
  });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resizable overlay size (persisted)
  const [overlayWidth, setOverlayWidth] = useState<number>(() => {
    const saved = localStorage.getItem('sign-overlay-width');
    const parsed = saved ? parseInt(saved, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 320;
  });
  const aspect = 9 / 16;
  const minWidth = 192;
  const maxWidth = 768;
  const [resizing, setResizing] = useState(false);
  const [popupMinimized, setPopupMinimized] = useState(false);
  const sizePresets: Record<'sm' | 'md' | 'lg' | 'xl', number> = { sm: 240, md: 320, lg: 480, xl: 640 };
  const miniFileVideoRef = useRef<HTMLVideoElement>(null);

  // Accessibility announcements
  const { settings } = useAccessibility();
  const { speak } = useTTS();
  const announce = useCallback((msg: string) => {
    const level = (settings as any)?.announcementLevel as 'none' | 'low' | 'medium' | 'high' | undefined;
    if (!level || level === 'none') return;
    // For low level, only announce critical things; resizing is medium/high
    if (msg.startsWith('Size') && level === 'low') return;
    speak(msg);
  }, [settings, speak]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    const ov = overlayRef.current;
    if (!ov) return;
    const rect = ov.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragging(true);
    e.preventDefault();
    e.stopPropagation();
    document.body.style.userSelect = 'none';
  }, []);

useEffect(() => {
    if (!openSign) return;
    const ov = overlayRef.current;
    if (!ov) return;
    // place near bottom-right of the viewport after render or restore saved position
    requestAnimationFrame(() => {
      const saved = localStorage.getItem('sign-overlay-pos');
      if (saved) {
        try {
          const pos = JSON.parse(saved) as { x: number; y: number };
          setOverlayPos({
            x: Math.max(0, Math.min(pos.x, window.innerWidth - ov.getBoundingClientRect().width)),
            y: Math.max(0, Math.min(pos.y, window.innerHeight - ov.getBoundingClientRect().height)),
          });
        } catch {
          // fallback to default placement
          const oRect = ov.getBoundingClientRect();
          const x = Math.max(8, window.innerWidth - oRect.width - 16);
          const y = Math.max(8, window.innerHeight - oRect.height - 16);
          setOverlayPos({ x, y });
        }
      } else {
        const oRect = ov.getBoundingClientRect();
        const x = Math.max(8, window.innerWidth - oRect.width - 16);
        const y = Math.max(8, window.innerHeight - oRect.height - 16);
        setOverlayPos({ x, y });
      }
      announce('Sign language window opened');
    });
  }, [openSign, announce]);

  // Handle dragging
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const ov = overlayRef.current;
      if (!ov) return;

      const rect = ov.getBoundingClientRect();
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
      newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));

      setOverlayPos({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setDragging(false);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.addEventListener('selectstart', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', (e) => e.preventDefault());
      document.body.style.userSelect = '';
    };
  }, [dragging, dragOffset]);

  // Persist position and size
  useEffect(() => {
    if (openSign) localStorage.setItem('sign-overlay-pos', JSON.stringify(overlayPos));
  }, [overlayPos, openSign]);
  useEffect(() => {
    localStorage.setItem('sign-overlay-width', String(Math.round(overlayWidth)));
  }, [overlayWidth]);

  // Handle resizing via mouse drag on the corner handle
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const ov = overlayRef.current;
      if (!ov) return;
      
      const rect = ov.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      
      setOverlayWidth(newWidth);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setResizing(false);
      announce(`Resized to ${Math.round(overlayWidth)} by ${Math.round(overlayWidth * aspect)} pixels`);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', (e) => e.preventDefault());
      document.body.style.userSelect = '';
    };
  }, [resizing, announce, overlayWidth, aspect, minWidth, maxWidth]);

  const handleOverlayKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpenSign(false);
      return;
    }
    const ov = overlayRef.current;
    if (!ov) return;
    const moveStep = e.shiftKey ? 16 : 8;
    const sizeStep = e.shiftKey ? 32 : 16;
    const oRect = ov.getBoundingClientRect();
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(e.key)) e.preventDefault();
    let { x, y } = overlayPos;
    // Move
    if (e.key === 'ArrowLeft') x = Math.max(0, x - moveStep);
    if (e.key === 'ArrowRight') x = Math.min(window.innerWidth - oRect.width, x + moveStep);
    if (e.key === 'ArrowUp') y = Math.max(0, y - moveStep);
    if (e.key === 'ArrowDown') y = Math.min(window.innerHeight - oRect.height, y + moveStep);
    if (x !== overlayPos.x || y !== overlayPos.y) setOverlayPos({ x, y });
    // Resize with +/- keys
    if (['+', '='].includes(e.key)) {
      setOverlayWidth((w) => Math.min(maxWidth, w + sizeStep));
      announce(`Size ${Math.round(Math.min(maxWidth, overlayWidth + sizeStep))} by ${Math.round((Math.min(maxWidth, overlayWidth + sizeStep)) * aspect)}`);
    }
    if (['-', '_'].includes(e.key)) {
      setOverlayWidth((w) => Math.max(minWidth, w - sizeStep));
      announce(`Size ${Math.round(Math.max(minWidth, overlayWidth - sizeStep))} by ${Math.round((Math.max(minWidth, overlayWidth - sizeStep)) * aspect)}`);
    }
  }, [overlayPos, announce, overlayWidth]);

  // Build main player
  useEffect(() => {
    if (!apiReady) return;

    const p = new window.YT.Player(containerId, {
      height: '100%',
      width: '100%',
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        cc_load_policy: 1,
        cc_lang_pref: captionLang,
      },
      events: {
        onReady: (e: any) => {
          try {
            e.target.setPlaybackRate(1);
            e.target.setVolume(100);
            // Best-effort captions config
            e.target.loadModule?.('captions');
            e.target.setOption?.('captions', 'track', { languageCode: captionLang });
          } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
        },
        onStateChange: (e: any) => {
          const YT = window.YT;
          if (!YT) return;
          if (e.data === YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            tracker.startPlaying();
          }
          if (e.data === YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            tracker.pausePlaying();
          }
          if (e.data === YT.PlayerState.ENDED) {
            setIsPlaying(false);
            tracker.endPlaying(true);
          }
        },
      },
    });
    playerRef.current = p;

    return () => {
      try { p.destroy?.(); } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
      playerRef.current = null;
    };
  }, [apiReady, containerId, videoId, captionLang]);

  // Track current time and duration
  useEffect(() => {
    if (!apiReady) return;
    const p = playerRef.current; if (!p) return;
    const update = () => {
      try {
        const ct = p.getCurrentTime?.() ?? 0;
        const dur = p.getDuration?.() ?? 0;
        setCurrentTime(ct);
        setDuration(dur);
        tracker.reportProgress(ct, dur);
      } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
    };
    update();
    const id = window.setInterval(update, 500);
    return () => window.clearInterval(id);
  }, [apiReady, videoId]);
  const togglePlay = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    const state = p.getPlayerState?.();
    const YT = window.YT;
    if (state === YT?.PlayerState?.PLAYING) {
      p.pauseVideo?.();
    } else {
      p.playVideo?.();
    }
  }, []);

  const handleVolume = useCallback((v: number[]) => {
    const val = v[0];
    setVolume(val);
    const p = playerRef.current; if (!p) return;
    try { p.setVolume?.(val); } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    try {
      if (p.isMuted?.()) { p.unMute?.(); setVolume(p.getVolume?.() ?? 100); }
      else { p.mute?.(); }
    } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
  }, []);

  const changeSpeed = useCallback((value: string) => {
    const rate = parseFloat(value);
    setSpeed(rate);
    const p = playerRef.current; if (!p) return;
    try { p.setPlaybackRate?.(rate); } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
    // mirror to mini if open
    const m = miniRef.current; if (m) { try { m.setPlaybackRate?.(rate); } catch { /* YouTube IFrame API call best-effort — player may not be ready */ } }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const p = playerRef.current; if (!p) return;
    try {
      const t = p.getCurrentTime?.() ?? 0;
      const d = p.getDuration?.() ?? 0;
      const nt = Math.max(0, Math.min(t + delta, d || t + delta));
      p.seekTo?.(nt, true);
    } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
  }, []);

  const seekTo = useCallback((time: number) => {
    const p = playerRef.current; if (!p) return;
    try {
      p.seekTo?.(time, true);
    } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
  }, []);

  const formatTime = useCallback((s: number) => {
    if (!isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(sec).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }, []);

  const toggleCaptions = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    const next = !captionsOn;
    setCaptionsOn(next);
    try {
      p.loadModule?.('captions');
      if (next) {
        p.setOption?.('captions', 'track', { languageCode: captionLang });
      } else {
        // There is no official toggle off; attempt to set an empty track and hide
        p.setOption?.('captions', 'track', {});
      }
    } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
  }, [captionsOn, captionLang]);

  // Sign language popup: create muted mirrored player and keep in sync.
  // Skipped entirely when the sign-language slot is an uploaded file — that
  // case renders a plain <video> tag in the JSX below instead, no YT.Player.
  useEffect(() => {
    if (!apiReady || signLanguageVideoUrl) return;
    if (!openSign) {
      if (miniRef.current) {
        try { miniRef.current.destroy?.(); } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
        miniRef.current = null;
      }
      return;
    }

    // Create mini player. If a distinct sign-language video was set, it has
    // its own timeline (an independently paced interpreter recording), so
    // only play/pause state is mirrored, not the playhead position — unlike
    // the mirror-same-video fallback, where seeking in lockstep makes sense.
    const isDistinctSignVideo = miniVideoId !== videoId;
    const m = new window.YT.Player(miniContainerId, {
      height: '100%', width: '100%', videoId: miniVideoId,
      playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e: any) => {
          try {
            e.target.mute?.();
            e.target.setPlaybackRate?.(speed);
          } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
        },
      },
    });
    miniRef.current = m;

    let syncTimer: number | undefined;
    const startSync = () => {
      stopSync();
      syncTimer = window.setInterval(() => {
        try {
          const p = playerRef.current; if (!p || !m) return;
          if (!isDistinctSignVideo) {
            const mainTime = p.getCurrentTime?.();
            const miniTime = m.getCurrentTime?.();
            if (typeof mainTime === 'number' && typeof miniTime === 'number') {
              const diff = Math.abs(mainTime - miniTime);
              if (diff > 0.35) m.seekTo?.(mainTime, true);
            }
          }
          const isMainPlaying = p.getPlayerState?.() === window.YT?.PlayerState?.PLAYING;
          const isMiniPlaying = m.getPlayerState?.() === window.YT?.PlayerState?.PLAYING;
          if (isMainPlaying && !isMiniPlaying) m.playVideo?.();
          if (!isMainPlaying && isMiniPlaying) m.pauseVideo?.();
        } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
      }, 500);
    };
    const stopSync = () => { if (syncTimer) { window.clearInterval(syncTimer); syncTimer = undefined; } };

    startSync();

    return () => {
      stopSync();
      try { m.destroy?.(); } catch { /* YouTube IFrame API call best-effort — player may not be ready */ }
      miniRef.current = null;
    };
  }, [apiReady, openSign, miniContainerId, videoId, miniVideoId, speed]);

  // The YT.Player-based mini popup above already syncs play/pause via a
  // polling interval, but that whole effect bails out early when the
  // sign-language slot is a file (signLanguageVideoUrl) — that case is a
  // plain <video> tag, so it needs its own, much simpler sync: mirror the
  // main player's play/pause state directly onto it.
  useEffect(() => {
    const el = miniFileVideoRef.current;
    if (!el || !signLanguageVideoUrl) return;
    if (isPlaying) {
      el.play().catch(() => { /* autoplay can be blocked before user interaction */ });
    } else {
      el.pause();
    }
  }, [isPlaying, signLanguageVideoUrl]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <style>{`.yt-mini-frame iframe{pointer-events:none!important;}`}</style>
      <div className="relative bg-black aspect-video" onMouseEnter={() => announce('Video player area')}>
        <div id={containerId} className="w-full h-full" aria-label={title || 'YouTube video player'} />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border flex flex-col gap-3" role="group" aria-label="Video controls">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => seekBy(-5)} aria-label="Rewind 5 seconds">
            <RotateCcw className="h-4 w-4" />
            <span className="ml-2">-5s</span>
          </Button>

          <Button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
          </Button>

          <Button variant="outline" onClick={() => seekBy(5)} aria-label="Forward 5 seconds">
            <RotateCw className="h-4 w-4" />
            <span className="ml-2">+5s</span>
          </Button>

          <div className="flex items-center gap-2 min-w-[200px]">
            <Button variant="outline" onClick={toggleMute} aria-label="Toggle mute">
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-40">
              <Slider value={[volume]} onValueChange={handleVolume} aria-label="Volume" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed</span>
            <Select value={String(speed)} onValueChange={changeSpeed}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="1x" />
              </SelectTrigger>
              <SelectContent>
                {['0.5', '0.75', '1', '1.25', '1.5', '1.75', '2'].map(r => (
                  <SelectItem key={r} value={r}>{r}x</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={toggleCaptions} aria-pressed={captionsOn} aria-label={`Captions ${captionsOn ? 'on' : 'off'}`}>
            <Captions className="h-4 w-4" />
            <span className="ml-2">Captions {captionsOn ? 'On' : 'Off'}</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setOpenSign(!openSign)} 
            aria-pressed={openSign}
            aria-label={`Sign language ${openSign ? 'on' : 'off'}`}
          >
            <Hand className="h-4 w-4" />
            <span className="ml-2">Sign language {openSign ? 'On' : 'Off'}</span>
          </Button>
        </div>

        {/* Enhanced Progress Bar with Clickable Seek */}
        <div className="w-full">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <div 
              className="flex-1 bg-muted rounded-full h-2 cursor-pointer relative group" 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const newTime = percentage * duration;
                if (duration > 0) {
                  seekTo(newTime);
                }
              }}
            >
              <div 
                className="bg-primary h-2 rounded-full transition-all group-hover:bg-primary/80"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, marginLeft: '-6px' }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Sign Language Overlay - Fixed and Enhanced */}
      {openSign && popupMinimized && (
        <button
          className="fixed z-50 flex items-center gap-2 rounded-full border bg-background/95 backdrop-blur px-3 py-2 shadow-lg hover:bg-muted transition-colors"
          style={{ left: overlayPos.x, top: overlayPos.y }}
          onClick={() => setPopupMinimized(false)}
          aria-label="Restore sign language window"
        >
          <Hand className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Sign Language</span>
        </button>
      )}
      {openSign && !popupMinimized && (
        <div
          ref={overlayRef}
          className="fixed border-2 border-primary/20 rounded-lg overflow-hidden shadow-2xl bg-background z-50 min-w-[192px] min-h-[108px] resize-none flex flex-col"
          style={{
            left: overlayPos.x,
            top: overlayPos.y,
            width: overlayWidth,
            height: overlayWidth * aspect + 40,
            cursor: dragging ? 'grabbing' : 'grab',
          }}
          tabIndex={0}
          role="dialog"
          aria-label="Sign language window (mirrored)"
          onKeyDown={handleOverlayKeyDown}
          onFocus={() => announce('Sign language window focused. Use arrow keys to move, +/- to resize, Escape to close')}
          onMouseEnter={() => announce('Sign language window')}
        >
          <div
            className="bg-primary/10 backdrop-blur px-3 py-2 cursor-move select-none border-b border-primary/20"
            onMouseDown={onDragStart}
            onMouseEnter={() => announce('Sign language window header. Drag to move window')}
            aria-label="Drag to move sign language window"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground truncate">Sign Language Interpreter</span>
              <div className="flex items-center gap-1 shrink-0">
                <Select value={String(overlayWidth)} onValueChange={(v) => setOverlayWidth(Number(v))}>
                  <SelectTrigger className="h-6 w-16 text-xs px-2" aria-label="Popup size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(sizePresets.sm)}>Small</SelectItem>
                    <SelectItem value={String(sizePresets.md)}>Medium</SelectItem>
                    <SelectItem value={String(sizePresets.lg)}>Large</SelectItem>
                    <SelectItem value={String(sizePresets.xl)}>X-Large</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setPopupMinimized(true)} aria-label="Minimize sign language window" className="h-6 w-6 p-0">
                  <span className="block h-0.5 w-3 bg-foreground" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setOpenSign(false); setPopupMinimized(false); }} aria-label="Turn off sign language" className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-black relative overflow-hidden">
            {signLanguageVideoUrl ? (
              <video
                ref={miniFileVideoRef}
                src={signLanguageVideoUrl}
                className="w-full h-full object-contain"
                muted
                loop
                playsInline
              />
            ) : (
              <div id={miniContainerId} className="w-full h-full" />
            )}
            <div className="absolute inset-0 bg-black/20 pointer-events-none flex items-center justify-center opacity-70">
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                Sign Language Video
              </div>
            </div>
          </div>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-primary/20 hover:bg-primary/40 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setResizing(true);
              announce('Started resizing sign language window'); 
              document.body.style.userSelect = 'none';
            }}
            aria-label="Resize sign language window"
            role="button"
            tabIndex={-1}
            title="Drag to resize sign language window"
          />
        </div>
      )}
    </Card>
  );
};

export { AccessibleYouTubePlayer };
export default AccessibleYouTubePlayer;
