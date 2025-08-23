import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  // Visual accessibility
  highContrast: boolean;
  fontSize: number; // 100-200% scale
  darkMode: boolean;
  reducedMotion: boolean;
  colorBlindFriendly: boolean;
  contrastLevel: number; // 0-100 custom contrast
  
  // Hearing accessibility
  visualAlerts: boolean;
  captionsEnabled: boolean;
  
  // Motor accessibility
  largeClickTargets: boolean;
  keyboardNavigation: boolean;
  voiceInput: boolean;
  
  // Cognitive accessibility
  simplifiedInterface: boolean;
  readingAssistance: boolean;
  autoplayDisabled: boolean;
  focusAssistance: boolean;
  
  // Screen reader
  screenReaderOptimized: boolean;
  skipLinks: boolean;
  ariaLive: boolean;

  // Announcements
  announcementLevel: 'none' | 'low' | 'medium' | 'high';
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  applySettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 100,
  darkMode: false,
  reducedMotion: false,
  colorBlindFriendly: false,
  contrastLevel: 0,
  visualAlerts: false,
  captionsEnabled: false,
  largeClickTargets: false,
  keyboardNavigation: true,
  voiceInput: false,
  simplifiedInterface: false,
  readingAssistance: false,
  autoplayDisabled: false,
  focusAssistance: false,
  screenReaderOptimized: false,
  skipLinks: true,
  ariaLive: true,
  announcementLevel: 'medium',
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const stored = localStorage.getItem('accessibility-settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
  };

  const applySettings = () => {
    const root = document.documentElement;
    
    // Import accessibility utilities
    import('@/utils/accessibilityHelpers').then(({ trackKeyboardUsage, updateDocumentLanguage }) => {
      trackKeyboardUsage();
    });
    
    // Update document language (this should be connected to language context)
    const currentLang = localStorage.getItem('language') || 'en';
    import('@/utils/accessibilityHelpers').then(({ updateDocumentLanguage }) => {
      updateDocumentLanguage(currentLang);
    });
    
    // Apply font size scaling
    root.style.fontSize = `${settings.fontSize}%`;
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply color blind friendly
    if (settings.colorBlindFriendly) {
      root.classList.add('colorblind-friendly');
    } else {
      root.classList.remove('colorblind-friendly');
    }

    // Apply contrast level (0 means no change)
    const factor = 1 + Math.max(0, Math.min(100, settings.contrastLevel)) / 100;
    root.style.setProperty('--contrast-factor', String(factor));
    root.style.filter = `contrast(${factor})`;
    
    // Apply large click targets
    if (settings.largeClickTargets) {
      root.classList.add('large-targets');
    } else {
      root.classList.remove('large-targets');
    }
    
    // Apply simplified interface
    if (settings.simplifiedInterface) {
      root.classList.add('simplified');
    } else {
      root.classList.remove('simplified');
    }
    
    // Apply focus assistance
    if (settings.focusAssistance) {
      root.classList.add('focus-assist');
    } else {
      root.classList.remove('focus-assist');
    }
    
    // Apply screen reader optimizations
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  };

  useEffect(() => {
    applySettings();
  }, [settings]);

  // Detect user preferences
  useEffect(() => {
    const mediaQueries = {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)'),
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const handleMediaChange = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: mediaQueries.prefersReducedMotion.matches || prev.reducedMotion,
        // Do not auto-toggle dark mode based on system to avoid unexpected switches
        highContrast: mediaQueries.prefersHighContrast.matches || prev.highContrast,
      }));
    };

    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', handleMediaChange);
    });

    handleMediaChange();

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', handleMediaChange);
      });
    };
  }, []);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings, applySettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};