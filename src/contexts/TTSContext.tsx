import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const TTS_LOCALE_PREFIX: Record<string, string> = { en: 'en', lt: 'lt' };

interface TTSSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
}

interface TTSContextType {
  settings: TTSSettings;
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  updateSettings: (newSettings: Partial<TTSSettings>) => void;
  availableVoices: SpeechSynthesisVoice[];
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};

interface TTSProviderProps {
  children: React.ReactNode;
}

export const TTSProvider: React.FC<TTSProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<TTSSettings>({
    enabled: true,
    rate: 1,
    pitch: 1,
    volume: 0.8,
    voice: '',
  });
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const { language } = useLanguage();
  // Tracks whether the current voice came from an explicit user choice
  // (via updateSettings) rather than the language-matching default, so
  // switching the app language doesn't clobber a deliberate pick.
  const voiceManuallySet = useRef(false);

  const pickVoiceForLanguage = useCallback((voices: SpeechSynthesisVoice[]) => {
    const prefix = TTS_LOCALE_PREFIX[language] || 'en';
    return voices.find(voice => voice.lang.toLowerCase().startsWith(prefix))
      || voices.find(voice => voice.lang.toLowerCase().startsWith('en'))
      || voices[0];
  }, [language]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);

      if (voices.length > 0 && !voiceManuallySet.current) {
        const match = pickVoiceForLanguage(voices);
        setSettings(prev => (match && prev.voice !== match.name ? { ...prev, voice: match.name } : prev));
      }
    };

    // Load voices immediately
    loadVoices();

    // Also load when voices change (some browsers load voices asynchronously)
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [pickVoiceForLanguage]);

  const speak = useCallback((text: string) => {
    if (!settings.enabled || !text.trim()) return;

    // Stop any currently speaking utterance
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    
    // Set voice if available
    if (settings.voice) {
      const selectedVoice = availableVoices.find(voice => voice.name === settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Set up event listeners
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    setCurrentUtterance(utterance);
    speechSynthesis.speak(utterance);
  }, [settings, availableVoices]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtterance(null);
  }, []);

  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSpeaking && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSpeaking, isPaused]);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    if (newSettings.voice) voiceManuallySet.current = true;
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const value: TTSContextType = useMemo(() => ({
    settings,
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    updateSettings,
    availableVoices,
  }), [settings, speak, stop, pause, resume, isSpeaking, isPaused, updateSettings, availableVoices]);

  return (
    <TTSContext.Provider value={value}>
      {children}
    </TTSContext.Provider>
  );
};