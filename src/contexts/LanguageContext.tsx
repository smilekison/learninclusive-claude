import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Fallback safely when provider isn't mounted yet
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Cookie management functions
const getLanguageFromCookie = (): Language => {
  try {
    const cookies = document.cookie.split(';');
    const langCookie = cookies.find(cookie => cookie.trim().startsWith('language='));
    if (langCookie) {
      const lang = langCookie.split('=')[1].trim() as Language;
      return ['en', 'fi'].includes(lang) ? lang : 'en';
    }
  } catch (error) {
    console.error('Error reading language cookie:', error);
  }
  return 'en';
};

const setLanguageCookie = (lang: Language) => {
  try {
    // Set cookie to expire in 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `language=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Error setting language cookie:', error);
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Load translations dynamically
  const loadTranslations = async (lang: Language) => {
    try {
      const module = await import(`../locales/${lang}.json`);
      setTranslations(module.default);
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      // Fallback to English if loading fails
      if (lang !== 'en') {
        const fallback = await import('../locales/en.json');
        setTranslations(fallback.default);
      }
    }
  };

  // Initialize language from cookie on component mount
  useEffect(() => {
    const savedLanguage = getLanguageFromCookie();
    setLanguageState(savedLanguage);
    loadTranslations(savedLanguage);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setLanguageCookie(lang);
    loadTranslations(lang);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};