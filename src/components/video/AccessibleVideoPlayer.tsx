import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Captions } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useVideoViewTracker } from '@/hooks/useVideoAnalytics';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tracker = useVideoViewTracker(videoDbId, 'mp4');

  useEffect(() => {
    const video = videoRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
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
  }, [onProgress, onComplete]);

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
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration,
            videoRef.current.currentTime + 10
          );
        }
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
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-background">
      <div
        ref={containerRef}
        className="relative focus-within:ring-2 focus-within:ring-primary rounded-lg overflow-hidden"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label={`Video player for ${title}`}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-auto bg-black"
          poster={thumbnailUrl}
          aria-describedby="video-description"
          preload="metadata"
        >
          {/* YouTube embed alternative for demo */}
          <iframe
            src={videoUrl}
            title={title}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          Your browser does not support the video tag.
        </video>

        {/* Video Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
                aria-label="Video progress"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="text-white hover:bg-white/20 min-w-[44px] min-h-[44px]"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="text-white hover:bg-white/20 min-w-[44px] min-h-[44px]"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                <div className="w-24">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    aria-label="Volume"
                  />
                </div>

                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Playback Speed */}
                <select
                  value={playbackSpeed}
                  onChange={(e) => changePlaybackSpeed(Number(e.target.value))}
                  className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm"
                  aria-label="Playback speed"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                  aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'}
                  className="text-white hover:bg-white/20 min-w-[44px] min-h-[44px]"
                >
                  <Captions className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => containerRef.current?.requestFullscreen()}
                  aria-label="Fullscreen"
                  className="text-white hover:bg-white/20 min-w-[44px] min-h-[44px]"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="text-xs">
            Press ? for keyboard shortcuts
          </Badge>
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
                <li>• ← →: Seek backward/forward 10s</li>
                <li>• ↑ ↓: Volume up/down</li>
                <li>• M: Toggle mute</li>
                <li>• F: Toggle fullscreen</li>
                <li>• C: Toggle transcript</li>
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
                <li>• Progress tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};