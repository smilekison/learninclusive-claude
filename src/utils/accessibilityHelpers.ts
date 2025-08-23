/**
 * Accessibility utility functions for WCAG 2.1 AA compliance
 */

// Color contrast calculation utilities
export const getLuminance = (color: string): number => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const sRGB = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsWCAGContrast = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  } else {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }
};

// Focus management utilities
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll(selectors));
};

export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

// ARIA utilities
export const announceToScreenReader = (
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcer = document.getElementById(
    priority === 'assertive' ? 'accessibility-alerts' : 'accessibility-announcements'
  );
  
  if (announcer) {
    announcer.textContent = message;
    
    // Clear after announcement to allow repeat announcements
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
};

export const generateAriaLabel = (
  baseLabel: string,
  additionalContext?: string,
  state?: string
): string => {
  let label = baseLabel;
  
  if (additionalContext) {
    label += `, ${additionalContext}`;
  }
  
  if (state) {
    label += `, ${state}`;
  }
  
  return label;
};

// Form accessibility utilities
export const validateFormAccessibility = (form: HTMLFormElement): string[] => {
  const issues: string[] = [];
  const inputs = form.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    const element = input as HTMLInputElement;
    const id = element.id;
    const required = element.required;
    
    // Check for labels
    const label = form.querySelector(`label[for="${id}"]`);
    if (!label && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      issues.push(`Input ${id || element.name || 'unknown'} is missing a label`);
    }
    
    // Check required field indication
    if (required) {
      const hasRequiredIndication = 
        label?.textContent?.includes('*') ||
        element.getAttribute('aria-required') === 'true' ||
        element.getAttribute('aria-describedby');
      
      if (!hasRequiredIndication) {
        issues.push(`Required field ${id || element.name || 'unknown'} needs clear indication`);
      }
    }
    
    // Check for error association
    const hasError = element.getAttribute('aria-invalid') === 'true';
    if (hasError) {
      const errorId = element.getAttribute('aria-describedby');
      const errorElement = errorId ? document.getElementById(errorId) : null;
      
      if (!errorElement) {
        issues.push(`Field ${id || element.name || 'unknown'} has error state but no error message`);
      }
    }
  });
  
  return issues;
};

// Media accessibility utilities
export const checkVideoAccessibility = (video: HTMLVideoElement): {
  hasCaptions: boolean;
  hasAudioDescription: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  const tracks = video.querySelectorAll('track');
  
  const hasCaptions = Array.from(tracks).some(track => 
    track.getAttribute('kind') === 'captions' || track.getAttribute('kind') === 'subtitles'
  );
  
  const hasAudioDescription = Array.from(tracks).some(track => 
    track.getAttribute('kind') === 'descriptions'
  );
  
  if (!hasCaptions) {
    issues.push('Video is missing captions/subtitles');
  }
  
  if (!hasAudioDescription && video.duration > 30) {
    issues.push('Video longer than 30 seconds should have audio description');
  }
  
  // Check for autoplay
  if (video.autoplay) {
    issues.push('Autoplay video may cause accessibility issues');
  }
  
  return {
    hasCaptions,
    hasAudioDescription,
    issues
  };
};

// Keyboard navigation utilities
export const isKeyboardUser = (): boolean => {
  // Simple heuristic: if user has used Tab recently, assume keyboard user
  return document.documentElement.classList.contains('keyboard-user');
};

export const trackKeyboardUsage = (): void => {
  let hadKeyboardEvent = false;
  let hadMouseEvent = false;

  const keyboardHandler = () => {
    hadKeyboardEvent = true;
    document.documentElement.classList.add('keyboard-user');
    document.documentElement.classList.remove('mouse-user');
  };

  const mouseHandler = () => {
    if (hadKeyboardEvent) {
      hadMouseEvent = true;
      document.documentElement.classList.remove('keyboard-user');
      document.documentElement.classList.add('mouse-user');
    }
  };

  document.addEventListener('keydown', keyboardHandler, true);
  document.addEventListener('mousedown', mouseHandler, true);
  document.addEventListener('touchstart', mouseHandler, true);
};

// Language and content utilities
export const updateDocumentLanguage = (locale: string): void => {
  const langCode = locale.split('-')[0]; // Get primary language
  document.documentElement.lang = langCode;
  
  // Also update dir attribute for RTL languages
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  document.documentElement.dir = rtlLanguages.includes(langCode) ? 'rtl' : 'ltr';
};

export const generateReadableId = (prefix: string = 'element'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};