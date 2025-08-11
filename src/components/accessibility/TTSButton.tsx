import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useTTS } from '@/contexts/TTSContext';
import { cn } from '@/lib/utils';

interface TTSButtonProps {
  text: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  ariaLabel?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  className,
  variant = "ghost",
  size = "sm",
  children,
  ariaLabel
}) => {
  const { speak, stop, isSpeaking, isPaused, pause, resume, settings } = useTTS();

  const handleClick = () => {
    if (!settings.enabled) return;
    
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(text);
    }
  };

  const getIcon = () => {
    if (!settings.enabled) return <VolumeX className="h-4 w-4" />;
    if (isSpeaking && !isPaused) return <Pause className="h-4 w-4" />;
    if (isSpeaking && isPaused) return <Play className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (!settings.enabled) return "Text-to-speech disabled";
    if (isSpeaking && !isPaused) return "Pause text-to-speech";
    if (isSpeaking && isPaused) return "Resume text-to-speech";
    return "Read text aloud";
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("flex items-center gap-2", className)}
      onClick={handleClick}
      disabled={!settings.enabled}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      {getIcon()}
      {children}
    </Button>
  );
};