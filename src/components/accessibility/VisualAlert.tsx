import React, { useEffect, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisualAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onDismiss?: () => void;
}

export const VisualAlert: React.FC<VisualAlertProps> = ({
  type,
  message,
  duration = 5000,
  onDismiss
}) => {
  const { settings } = useAccessibility();
  const [isVisible, setIsVisible] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (settings.visualAlerts) {
      // Flash the alert for attention
      setIsFlashing(true);
      const flashTimer = setTimeout(() => setIsFlashing(false), 1000);

      // Auto-dismiss after duration
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      // Standard dismissal without flashing
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [settings.visualAlerts, duration, onDismiss]);

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[type];

  const alertStyles = {
    success: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300',
    error: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300',
    warning: 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-300',
    info: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300',
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm p-4 border-2 rounded-lg shadow-lg',
        'transition-all duration-300 transform',
        alertStyles[type],
        isFlashing && settings.visualAlerts && 'animate-pulse border-4',
        settings.largeClickTargets && 'min-h-[60px] text-lg'
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <Icon 
          className={cn(
            'h-5 w-5 mt-0.5 flex-shrink-0',
            settings.largeClickTargets && 'h-6 w-6'
          )} 
        />
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium',
            settings.largeClickTargets && 'text-base'
          )}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className={cn(
            'text-current hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-current rounded',
            settings.largeClickTargets && 'p-1 min-w-[44px] min-h-[44px]'
          )}
          aria-label="Dismiss alert"
        >
          <XCircle className={cn(
            'h-4 w-4',
            settings.largeClickTargets && 'h-5 w-5'
          )} />
        </button>
      </div>
    </div>
  );
};

// Hook for triggering visual alerts
export const useVisualAlert = () => {
  const { settings } = useAccessibility();

  const showAlert = (alert: Omit<VisualAlertProps, 'onDismiss'>) => {
    if (settings.visualAlerts) {
      // Enhanced visual feedback
      const event = new CustomEvent('visual-alert', { detail: alert });
      window.dispatchEvent(event);
    }

    // Also announce to screen readers
    const announcements = document.getElementById('accessibility-announcements');
    const alerts = document.getElementById('accessibility-alerts');
    
    if (alert.type === 'error' && alerts) {
      alerts.textContent = alert.message;
    } else if (announcements) {
      announcements.textContent = alert.message;
    }
  };

  return { showAlert };
};