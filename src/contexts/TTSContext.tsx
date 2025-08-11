import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice if none selected
      if (!settings.voice && voices.length > 0) {
        // Try to find an English voice, otherwise use the first one
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        setSettings(prev => ({
          ...prev,
          voice: englishVoice?.name || voices[0].name
        }));
      }
    };

    // Load voices immediately
    loadVoices();
    
    // Also load when voices change (some browsers load voices asynchronously)
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [settings.voice]);

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
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const value: TTSContextType = {
    settings,
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    updateSettings,
    availableVoices,
  };

  return (
    <TTSContext.Provider value={value}>
      {children}
    </TTSContext.Provider>
  );
};