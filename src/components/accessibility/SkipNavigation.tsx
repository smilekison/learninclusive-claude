import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export const SkipNavigation: React.FC = () => {
  const { settings } = useAccessibility();

  if (!settings.skipLinks) return null;

  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-br-md focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring"
        onFocus={() => {
          // Announce to screen readers
          const announcement = document.getElementById('accessibility-announcements');
          if (announcement) {
            announcement.textContent = 'Skip navigation link focused. Press Enter to jump to main content.';
          }
        }}
      >
        Skip to main content
      </a>
      <a
        href="#accessibility-settings"
        className="absolute top-0 left-32 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-br-md focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to accessibility settings
      </a>
    </div>
  );
};

export const AccessibilityAnnouncements: React.FC = () => {
  const { settings } = useAccessibility();

  if (!settings.ariaLive) return null;

  return (
    <>
      {/* Polite announcements for non-urgent updates */}
      <div
        id="accessibility-announcements"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Assertive announcements for urgent updates */}
      <div
        id="accessibility-alerts"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
};