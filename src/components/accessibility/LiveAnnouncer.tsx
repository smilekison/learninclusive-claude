import React, { useEffect, useRef, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useTTS } from '@/contexts/TTSContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

// Context for dynamic announcements
interface LiveAnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType | undefined>(undefined);

export const useLiveAnnouncer = () => {
  const context = useContext(LiveAnnouncerContext);
  if (!context) {
    throw new Error('useLiveAnnouncer must be used within LiveAnnouncerProvider');
  }
  return context;
};

// Provider for dynamic announcements
export const LiveAnnouncerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const { speak } = useTTS();
  const { settings } = useAccessibility();

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (settings.announcementLevel === 'none') return;
    
    // Screen reader announcement
    const targetRef = priority === 'assertive' ? assertiveRef : politeRef;
    if (targetRef.current) {
      targetRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (targetRef.current) targetRef.current.textContent = '';
      }, 100);
    }
    
    // TTS announcement based on level
    if (settings.announcementLevel !== 'low' || priority === 'assertive') {
      speak(message);
    }
  };

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      {/* ARIA Live Regions for screen readers */}
      <div 
        ref={politeRef}
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      <div 
        ref={assertiveRef}
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
    </LiveAnnouncerContext.Provider>
  );
};

// Main LiveAnnouncer component for page changes
export const LiveAnnouncer: React.FC = () => {
  const location = useLocation();
  const { speak } = useTTS();
  const { settings } = useAccessibility();

  useEffect(() => {
    const level = settings.announcementLevel;
    if (level === 'none') return;
    
    // Wait for page content to load
    const timeout = setTimeout(() => {
      const title = document.title || 'Untitled page';
      const h1 = document.querySelector('main h1, [role="main"] h1, h1')?.textContent?.trim();
      const landmark = document.querySelector('main, [role="main"]');
      
      if (level === 'low') {
        speak(`Page loaded: ${title}`);
        return;
      }
      
      if (level === 'medium') {
        const message = `Page loaded: ${title}${h1 ? `. Main heading: ${h1}` : ''}`;
        speak(message);
        return;
      }
      
      if (level === 'high') {
        const sections = document.querySelectorAll('main section, [role="main"] section, section');
        const buttons = document.querySelectorAll('main button, [role="main"] button');
        const links = document.querySelectorAll('main a, [role="main"] a');
        
        let message = `Page loaded: ${title}${h1 ? `. Main heading: ${h1}` : ''}`;
        message += `. ${sections.length} sections, ${buttons.length} buttons, ${links.length} links available`;
        
        speak(message);
      }
    }, 500); // Delay to ensure DOM is ready

    return () => clearTimeout(timeout);
  }, [location.pathname, settings.announcementLevel, speak]);

  return null;
};

export default LiveAnnouncer;
