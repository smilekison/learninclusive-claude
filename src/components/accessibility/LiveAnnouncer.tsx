import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTTS } from '@/contexts/TTSContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

// Announces page changes via TTS based on user's announcement level
export const LiveAnnouncer: React.FC = () => {
  const location = useLocation();
  const { speak } = useTTS();
  const { settings } = useAccessibility();

  useEffect(() => {
    const level = settings.announcementLevel;
    if (level === 'none') return;
    const title = document.title || 'Untitled page';
    const h1 = document.querySelector('main h1, h1')?.textContent?.trim();
    if (level === 'low') {
      speak(`Page: ${title}`);
      return;
    }
    if (level === 'medium') {
      speak(`Page: ${title}${h1 ? `. Heading: ${h1}` : ''}`);
      return;
    }
    if (level === 'high') {
      const sections = document.querySelectorAll('main section, section');
      speak(`Page: ${title}${h1 ? `. Heading: ${h1}` : ''}. ${sections.length} sections.`);
    }
  }, [location.pathname, settings.announcementLevel, speak]);

  return null;
};

export default LiveAnnouncer;
