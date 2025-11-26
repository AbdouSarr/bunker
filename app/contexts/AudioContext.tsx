import {createContext, useContext, useState, useCallback, ReactNode} from 'react';

interface AudioContextType {
  audioEnabled: boolean;
  toggleAudio: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({children}: {children: ReactNode}) {
  const [audioEnabled, setAudioEnabled] = useState(false);

  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => !prev);
  }, []);

  return (
    <AudioContext.Provider value={{audioEnabled, toggleAudio}}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
