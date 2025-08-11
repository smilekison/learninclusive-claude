import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  children: React.ReactNode;
  ariaLabel?: string;
  description?: string;
  clickSound?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  ariaLabel,
  description,
  clickSound = false,
  className,
  onClick,
  ...props
}) => {
  const { settings } = useAccessibility();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Visual feedback for users with hearing impairments
    if (settings.visualAlerts && clickSound) {
      e.currentTarget.style.transform = 'scale(0.95)';
      setTimeout(() => {
        e.currentTarget.style.transform = '';
      }, 100);
    }

    // Announce action to screen readers
    if (settings.screenReaderOptimized && ariaLabel) {
      const announcement = document.getElementById('accessibility-announcements');
      if (announcement) {
        announcement.textContent = `${ariaLabel} activated`;
      }
    }

    onClick?.(e);
  };

  return (
    <Button
      {...props}
      aria-label={ariaLabel}
      aria-describedby={description ? `${props.id}-description` : undefined}
      className={cn(
        className,
        settings.largeClickTargets && 'min-h-[44px] min-w-[44px] px-4 py-3',
        settings.focusAssistance && 'focus:scale-105 focus:shadow-lg transition-transform',
        settings.highContrast && 'border-2 border-current'
      )}
      onClick={handleClick}
    >
      {children}
      {description && (
        <span id={`${props.id}-description`} className="sr-only">
          {description}
        </span>
      )}
    </Button>
  );
};