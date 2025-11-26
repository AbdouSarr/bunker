import {useState, useRef, useEffect} from 'react';
import {Volume2, VolumeX} from '~/components/icons';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export default function AudioPlayer({src, className = ''}: AudioPlayerProps) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.loop = true;
    audio.volume = 0.6;

    // Handle play/pause based on audioEnabled state
    if (audioEnabled) {
      audio.play().catch((error) => {
        console.log('Audio play failed:', error);
      });
    } else {
      audio.pause();
    }

    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [audioEnabled]);

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <audio ref={audioRef} src={src} preload="auto" />
      <button
        onClick={toggleAudio}
        className="p-2 bg-black text-white hover:bg-gray-800 transition-colors"
        aria-label={audioEnabled ? 'Mute audio' : 'Play audio'}
      >
        {audioEnabled ? (
          <Volume2 size={20} strokeWidth={2} />
        ) : (
          <VolumeX size={20} strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

