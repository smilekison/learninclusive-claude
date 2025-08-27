import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Maximize, 
  RotateCcw, 
  RotateCw,
  Subtitles,
  Languages,
  Eye,
  EyeOff,
  Hand,
  Timer,
  Clock
} from 'lucide-react';

interface UnifiedVideoPlayerProps {
  videoId?: string; // YouTube video ID
  videoUrl?: string; // Custom video URL
  videoType: 'youtube' | 'custom';
  title?: string;
  captionLang?: string;
  className?: string;
  videoDbId?: string;
  signLanguageVideoUrl?: string;
  captions?: Array<{ start: number; end: number; text: string }>;
}

// Hook for YouTube API
const useYouTubeAPI = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
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

export const UnifiedVideoPlayer: React.FC<UnifiedVideoPlayerProps> = ({
  videoId,
  videoUrl,
  videoType,
  title,
  captionLang = 'en',
  className,
  videoDbId,
  signLanguageVideoUrl,
  captions = []
}) => {
  const apiReady = useYouTubeAPI();
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerId = useMemo(() => `unified_player_${Math.random().toString(36).slice(2)}`, []);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  // Accessibility features
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Time tracking
  const [timeWatched, setTimeWatched] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (videoType === 'youtube' && apiReady && videoId) {
      initializeYouTubePlayer();
    }
  }, [apiReady, videoId, videoType]);

  useEffect(() => {
    if (videoType === 'custom' && videoRef.current) {
      initializeCustomPlayer();
    }
  }, [videoType, videoUrl]);

  // Time tracking effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      if (!sessionStartTime) {
        setSessionStartTime(Date.now());
      }
      
      interval = setInterval(() => {
        setTimeWatched(prev => prev + 1);
        
        if (videoType === 'youtube' && playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          setCurrentTime(currentTime);
          setDuration(duration);
          setProgress((currentTime / duration) * 100);
        } else if (videoType === 'custom' && videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          setDuration(videoRef.current.duration);
          setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sessionStartTime, videoType]);

  const initializeYouTubePlayer = () => {
    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      playerVars: {
        cc_load_policy: captionsOn ? 1 : 0,
        cc_lang_pref: captionLang,
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          setDuration(event.target.getDuration());
        },
        onStateChange: (event: any) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
        }
      }
    });
  };

  const initializeCustomPlayer = () => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (videoRef.current) {
          setDuration(videoRef.current.duration);
        }
      });

      videoRef.current.addEventListener('timeupdate', () => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
      });

      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'f':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          event.preventDefault();
          toggleMute();
          break;
        case 'c':
          event.preventDefault();
          setCaptionsOn(!captionsOn);
          break;
        case 's':
          event.preventDefault();
          setShowSignLanguage(!showSignLanguage);
          break;
        case 't':
          event.preventDefault();
          setShowTranscript(!showTranscript);
          break;
        case 'arrowleft':
          event.preventDefault();
          seekBackward();
          break;
        case 'arrowright':
          event.preventDefault();
          seekForward();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [captionsOn, showSignLanguage, showTranscript]);

  const togglePlayPause = () => {
    if (videoType === 'youtube' && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } else if (videoType === 'custom' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoType === 'youtube' && playerRef.current) {
      if (playerRef.current.isMuted()) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    } else if (videoType === 'custom' && videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById(containerId);
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const seekBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    seekTo(newTime);
  };

  const seekForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    seekTo(newTime);
  };

  const seekTo = (time: number) => {
    if (videoType === 'youtube' && playerRef.current) {
      playerRef.current.seekTo(time);
    } else if (videoType === 'custom' && videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    seekTo(newTime);
  };

  // Sign language overlay drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragOffset({
      x: e.clientX - overlayPos.x,
      y: e.clientY - overlayPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setOverlayPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => setDragging(false);

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragOffset]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentCaption = () => {
    return captions.find(caption => 
      currentTime >= caption.start && currentTime <= caption.end
    );
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} id={containerId}>
      {/* Video Player */}
      {videoType === 'youtube' ? (
        <div className="w-full aspect-video">
          <div id={containerId} className="w-full h-full" />
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full aspect-video"
          src={videoUrl}
          controls={false}
          preload="metadata"
        >
          <track kind="captions" srcLang={captionLang} label="English" />
        </video>
      )}

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <div className="text-white text-xs flex items-center gap-2">
              <Timer className="w-3 h-3" />
              <span>Watched: {Math.floor(timeWatched / 60)}m {timeWatched % 60}s</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCaptionsOn(!captionsOn)}
              className={`text-white hover:bg-white/20 ${captionsOn ? 'bg-white/20' : ''}`}
            >
              <Subtitles className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSignLanguage(!showSignLanguage)}
              className={`text-white hover:bg-white/20 ${showSignLanguage ? 'bg-white/20' : ''}`}
              title="Toggle Sign Language (S)"
            >
              <Hand className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              className={`text-white hover:bg-white/20 ${showTranscript ? 'bg-white/20' : ''}`}
            >
              {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Captions */}
      {captionsOn && getCurrentCaption() && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded text-center max-w-md">
          {getCurrentCaption()?.text}
        </div>
      )}

      {/* Sign Language Overlay */}
      {showSignLanguage && (
        <div
          className="fixed bg-background/95 rounded-lg shadow-xl border-2 border-primary/20 z-50 cursor-move"
          style={{
            left: `${overlayPos.x}px`,
            top: `${overlayPos.y}px`,
            width: '320px',
            height: '240px'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="p-2 border-b border-border flex items-center justify-between bg-primary/10">
            <span className="text-sm font-medium flex items-center gap-2">
              <Hand className="w-4 h-4" />
              Sign Language
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSignLanguage(false)}
              className="p-1 h-6 w-6"
            >
              ×
            </Button>
          </div>
          
          <div className="p-3 h-full">
            {signLanguageVideoUrl ? (
              <video
                className="w-full h-full object-cover rounded"
                controls
                muted
                autoPlay={isPlaying}
                src={signLanguageVideoUrl}
              >
                <track kind="captions" srcLang="asl" label="ASL" />
              </video>
            ) : (
              <div className="w-full h-full bg-muted rounded flex items-center justify-center text-center p-4">
                <div>
                  <div className="text-2xl mb-2">🤟</div>
                  <p className="text-sm text-muted-foreground">
                    Sign language interpretation is not available for this video yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact your instructor if you need sign language support.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript Panel */}
      {showTranscript && (
        <Card className="absolute top-4 right-4 w-80 max-h-96 z-40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Transcript
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(false)}
              >
                ×
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
              {captions.length > 0 ? (
                captions.map((caption, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      currentTime >= caption.start && currentTime <= caption.end
                        ? 'bg-primary/20 border-primary/30 border'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => seekTo(caption.start)}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {formatTime(caption.start)} - {formatTime(caption.end)}
                    </div>
                    <div>{caption.text}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Transcript not available for this video.</p>
                  <p className="text-xs mt-1">Captions may be auto-generated.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Stats */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-black/50 text-white">
          <Clock className="w-3 h-3 mr-1" />
          {Math.round(progress)}%
        </Badge>
        {timeWatched > 0 && (
          <Badge variant="secondary" className="bg-black/50 text-white">
            <Timer className="w-3 h-3 mr-1" />
            {Math.floor(timeWatched / 60)}:{(timeWatched % 60).toString().padStart(2, '0')}
          </Badge>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
        <Card className="p-2">
          <div className="text-xs space-y-1">
            <div><kbd className="px-1 bg-muted rounded">Space</kbd> Play/Pause</div>
            <div><kbd className="px-1 bg-muted rounded">F</kbd> Fullscreen</div>
            <div><kbd className="px-1 bg-muted rounded">M</kbd> Mute</div>
            <div><kbd className="px-1 bg-muted rounded">C</kbd> Captions</div>
            <div><kbd className="px-1 bg-muted rounded">S</kbd> Sign Language</div>
            <div><kbd className="px-1 bg-muted rounded">T</kbd> Transcript</div>
            <div><kbd className="px-1 bg-muted rounded">←/→</kbd> Seek ±10s</div>
          </div>
        </Card>
      </div>
    </div>
  );
};