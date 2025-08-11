import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Play, Pause, Captions, Hand, Minimize2, RotateCcw, RotateCw } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useTTS } from '@/contexts/TTSContext';

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
  title?: string;
  captionLang?: string; // e.g., 'en', 'fi'
  className?: string;
}

export const AccessibleYouTubePlayer: React.FC<AccessibleYouTubePlayerProps> = ({
  videoId,
  title,
  captionLang = 'en',
  className,
}) => {
  const apiReady = useYouTubeAPI();
  const playerRef = useRef<any>(null);
  const miniRef = useRef<any>(null);
  const containerId = useMemo(() => `ytp_${videoId}_${Math.random().toString(36).slice(2)}`, [videoId]);
  const miniContainerId = useMemo(() => `ytp_mini_${videoId}_${Math.random().toString(36).slice(2)}`, [videoId]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [openSign, setOpenSign] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);


  // Draggable sign-language overlay (viewport)
  const overlayRef = useRef<HTMLDivElement>(null);
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
const grabOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    const oRect = ov.getBoundingClientRect();
    grabOffset.current = { x: e.clientX - oRect.left, y: e.clientY - oRect.top };
    setDragging(true);
    e.preventDefault();
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

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const ov = overlayRef.current;
      if (!ov) return;
      const oRect = ov.getBoundingClientRect();
      let x = e.clientX - grabOffset.current.x;
      let y = e.clientY - grabOffset.current.y;
      x = Math.max(0, Math.min(x, window.innerWidth - oRect.width));
      y = Math.max(0, Math.min(y, window.innerHeight - oRect.height));
      setOverlayPos({ x, y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  // Persist position and size
  useEffect(() => {
    if (openSign) localStorage.setItem('sign-overlay-pos', JSON.stringify(overlayPos));
  }, [overlayPos, openSign]);
  useEffect(() => {
    localStorage.setItem('sign-overlay-width', String(Math.round(overlayWidth)));
  }, [overlayWidth]);

  // Handle resizing via mouse drag on the corner handle
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing) return;
      const ov = overlayRef.current; if (!ov) return;
      const rect = ov.getBoundingClientRect();
      let newW = e.clientX - rect.left;
      newW = Math.max(minWidth, Math.min(newW, maxWidth));
      setOverlayWidth(newW);
    };
    const onUp = () => {
      if (resizing) {
        setResizing(false);
        announce(`Size ${Math.round(overlayWidth)} by ${Math.round(overlayWidth * aspect)}`);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, announce, overlayWidth]);

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
          } catch { }
        },
        onStateChange: (e: any) => {
          const YT = window.YT;
          if (!YT) return;
          if (e.data === YT.PlayerState.PLAYING) setIsPlaying(true);
          if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setIsPlaying(false);
        },
      },
    });
    playerRef.current = p;

    return () => {
      try { p.destroy?.(); } catch { }
      playerRef.current = null;
    };
  }, [apiReady, containerId, videoId, captionLang]);

  // Track current time and duration
  useEffect(() => {
    if (!apiReady) return;
    const p = playerRef.current; if (!p) return;
    const update = () => {
      try {
        setCurrentTime(p.getCurrentTime?.() ?? 0);
        setDuration(p.getDuration?.() ?? 0);
      } catch { }
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
    try { p.setVolume?.(val); } catch { }
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    try {
      if (p.isMuted?.()) { p.unMute?.(); setVolume(p.getVolume?.() ?? 100); }
      else { p.mute?.(); }
    } catch { }
  }, []);

  const changeSpeed = useCallback((value: string) => {
    const rate = parseFloat(value);
    setSpeed(rate);
    const p = playerRef.current; if (!p) return;
    try { p.setPlaybackRate?.(rate); } catch { }
    // mirror to mini if open
    const m = miniRef.current; if (m) { try { m.setPlaybackRate?.(rate); } catch { } }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const p = playerRef.current; if (!p) return;
    try {
      const t = p.getCurrentTime?.() ?? 0;
      const d = p.getDuration?.() ?? 0;
      const nt = Math.max(0, Math.min(t + delta, d || t + delta));
      p.seekTo?.(nt, true);
    } catch { }
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
    } catch { }
  }, [captionsOn, captionLang]);

  // Sign language popup: create muted mirrored player and keep in sync
  useEffect(() => {
    if (!apiReady) return;
    if (!openSign) {
      if (miniRef.current) {
        try { miniRef.current.destroy?.(); } catch { }
        miniRef.current = null;
      }
      return;
    }

    // Create mini player
    const m = new window.YT.Player(miniContainerId, {
      height: '100%', width: '100%', videoId,
      playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e: any) => {
          try {
            e.target.mute?.();
            e.target.setPlaybackRate?.(speed);
          } catch { }
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
          const mainTime = p.getCurrentTime?.();
          const miniTime = m.getCurrentTime?.();
          if (typeof mainTime === 'number' && typeof miniTime === 'number') {
            const diff = Math.abs(mainTime - miniTime);
            if (diff > 0.35) m.seekTo?.(mainTime, true);
          }
          const isMainPlaying = p.getPlayerState?.() === window.YT?.PlayerState?.PLAYING;
          const isMiniPlaying = m.getPlayerState?.() === window.YT?.PlayerState?.PLAYING;
          if (isMainPlaying && !isMiniPlaying) m.playVideo?.();
          if (!isMainPlaying && isMiniPlaying) m.pauseVideo?.();
        } catch { }
      }, 500);
    };
    const stopSync = () => { if (syncTimer) { window.clearInterval(syncTimer); syncTimer = undefined; } };

    startSync();

    return () => {
      stopSync();
      try { m.destroy?.(); } catch { }
      miniRef.current = null;
    };
  }, [apiReady, openSign, miniContainerId, videoId, speed]);

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

          <Button variant="outline" onClick={() => setOpenSign(true)} aria-label="Open sign language window">
            <Hand className="h-4 w-4" />
            <span className="ml-2">Sign language</span>
          </Button>

          <div className="ml-auto text-sm tabular-nums text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {openSign && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-label="Sign language window (mirrored)"
          tabIndex={0}
          className="fixed z-40 rounded-md ring-1 ring-border shadow-lg bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 pointer-events-none"
          style={{ left: overlayPos.x, top: overlayPos.y }}
          onKeyDown={handleOverlayKeyDown}
          onMouseEnter={() => announce('Sign language window')}
        >
          <div
            className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted/40 pointer-events-auto"
            onMouseDown={onDragStart}
            onMouseEnter={() => announce('Sign language window header. Drag to move')}
            aria-label="Drag sign language window"
            role="button"
            tabIndex={-1}
          >
            <span className="text-xs text-muted-foreground">Sign language</span>
            <Button variant="ghost" size="icon" onClick={() => setOpenSign(false)} aria-label="Close sign language window">
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative bg-black overflow-hidden pointer-events-auto">
            <div className="aspect-video yt-mini-frame" style={{ width: overlayWidth }}>
              <div id={miniContainerId} className="w-full h-full" aria-label="Mini YouTube player (muted)" />
            </div>
            {/* Resize handle */}
            <div
              className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize rounded-sm bg-muted/70"
              onMouseDown={(e) => { e.preventDefault(); setResizing(true); announce('Resizing sign language window'); }}
              onMouseEnter={() => announce('Resize handle')}
              role="slider"
              aria-label="Resize sign language window"
              aria-valuemin={minWidth}
              aria-valuemax={maxWidth}
              aria-valuenow={Math.round(overlayWidth)}
              title="Drag to resize"
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default AccessibleYouTubePlayer;
