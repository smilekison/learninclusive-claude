import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Captions, RotateCcw, RotateCw, Hand, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useVideoViewTracker } from '@/hooks/useVideoAnalytics';
import { signLanguageVideos } from '@/data/signLanguageVideos';

interface AccessibleVideoPlayerProps {
  title: string;
  description: string;
  videoUrl: string;
  transcript?: string;
  duration?: number;
  thumbnailUrl?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  videoDbId?: string; // database id for analytics tracking
}

export const AccessibleVideoPlayer: React.FC<AccessibleVideoPlayerProps> = ({
  title,
  description,
  videoUrl,
  transcript,
  duration = 0,
  thumbnailUrl,
  onProgress,
  onComplete,
  videoDbId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const [metaDuration, setMetaDuration] = useState<number>(duration || 0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const signVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tracker = useVideoViewTracker(videoDbId, 'mp4');

  // Sign language overlay state
  const [overlayPos, setOverlayPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [overlaySize, setOverlaySize] = useState({ width: 320, height: 180 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setMetaDuration(video.duration || 0);
      // analytics
      tracker.reportProgress(video.currentTime, video.duration);
      if (onProgress && video.duration) {
        onProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // analytics
      tracker.endPlaying(true);
      if (onComplete) onComplete();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      tracker.startPlaying();
    };

    const handlePause = () => {
      setIsPlaying(false);
      tracker.pausePlaying();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onProgress, onComplete, tracker]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = (value[0] / 100) * video.duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const seekBy = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        seekBy(-5);
        break;
      case 'ArrowRight':
        event.preventDefault();
        seekBy(5);
        break;
      case 'ArrowUp':
        event.preventDefault();
        handleVolumeChange([Math.min(100, (volume * 100) + 10)]);
        break;
      case 'ArrowDown':
        event.preventDefault();
        handleVolumeChange([Math.max(0, (volume * 100) - 10)]);
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        toggleMute();
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          containerRef.current?.requestFullscreen();
        }
        break;
      case 'c':
      case 'C':
        event.preventDefault();
        setShowTranscript(!showTranscript);
        break;
      case 's':
      case 'S':
        event.preventDefault();
        setShowSignLanguage(!showSignLanguage);
        break;
    }
  };

  // Sign language functions
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

  const getSignLanguageVideo = () => {
    // Check if sign language video is available for this content
    if (videoRef.current?.src) {
      // For custom videos, check if there's an associated sign language video
      return videoRef.current.src.replace('.mp4', '_sign.mp4');
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={thumbnailUrl || undefined}
          aria-describedby="video-description"
          preload="metadata"
          src={videoUrl}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) setMetaDuration(v.duration || 0);
          }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          Your browser does not support the video tag.
        </video>

        {/* Sign Language Overlay */}
        {showSignLanguage && (
          <div
            className="absolute border-2 border-white rounded-lg overflow-hidden shadow-lg bg-black resize"
            style={{
              left: overlayPos.x,
              top: overlayPos.y,
              width: overlaySize.width,
              height: overlaySize.height,
              cursor: dragging ? 'grabbing' : 'grab',
              zIndex: 10,
              minWidth: '200px',
              minHeight: '150px',
              maxWidth: '600px',
              maxHeight: '400px'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1 right-1 z-20">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setShowSignLanguage(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="absolute top-1 left-1 z-20">
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                Sign Language
              </div>
            </div>
            
            <video
              ref={signVideoRef}
              className="w-full h-full object-cover"
              muted={isMuted}
              src={getSignLanguageVideo()}
              onLoadedData={() => {
                // Sync with main video when sign language video loads
                const mainVideo = videoRef.current;
                const signVideo = signVideoRef.current;
                if (mainVideo && signVideo) {
                  signVideo.currentTime = mainVideo.currentTime;
                  if (!mainVideo.paused) {
                    signVideo.play();
                  }
                }
              }}
            >
              <div className="flex items-center justify-center h-full text-white">
                <p className="text-sm">Sign language video not available</p>
              </div>
            </video>
            
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white/20 hover:bg-white/40 transition-colors"></div>
          </div>
        )}
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
              {volume === 0 || isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-40">
              <Slider value={[isMuted ? 0 : volume * 100]} onValueChange={handleVolumeChange} aria-label="Volume" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed</span>
            <select
              value={playbackSpeed}
              onChange={(e) => changePlaybackSpeed(Number(e.target.value))}
              className="border border-border rounded px-2 py-1 text-sm bg-background"
              aria-label="Playback speed"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          <Button variant="outline" onClick={() => setShowTranscript(!showTranscript)} aria-pressed={showTranscript} aria-label={`Captions ${showTranscript ? 'on' : 'off'}`}>
            <Captions className="h-4 w-4" />
            <span className="ml-2">Captions {showTranscript ? 'On' : 'Off'}</span>
          </Button>

          <Button variant="outline" onClick={() => setShowSignLanguage(!showSignLanguage)} aria-pressed={showSignLanguage} aria-label={`Sign language ${showSignLanguage ? 'on' : 'off'}`}>
            <Hand className="h-4 w-4" />
            <span className="ml-2">Sign Language {showSignLanguage ? 'On' : 'Off'}</span>
          </Button>

          <div className="ml-auto text-sm tabular-nums text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(metaDuration || duration || 0)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <Slider
            value={[metaDuration > 0 ? (currentTime / metaDuration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
            aria-label="Video progress"
          />
        </div>
      </div>

      {/* Video Information */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p id="video-description" className="text-muted-foreground mb-4">
          {description}
        </p>

        {/* Transcript Section */}
        {showTranscript && transcript && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Transcript</h3>
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="leading-relaxed">{transcript}</p>
            </div>
          </div>
        )}

        {/* Accessibility Features */}
        <div className="mt-6 p-4 bg-accent/10 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Accessibility Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Keyboard Controls:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Space/Enter: Play/Pause</li>
                <li>• ← →: Seek backward/forward 5s</li>
                <li>• ↑ ↓: Volume up/down</li>
                <li>• M: Toggle mute</li>
                <li>• F: Toggle fullscreen</li>
                <li>• C: Toggle transcript</li>
                <li>• S: Toggle sign language</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• High contrast controls</li>
                <li>• Customizable playback speed</li>
                <li>• Full transcript available</li>
                <li>• Sign language interpretation</li>
                <li>• Progress tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};