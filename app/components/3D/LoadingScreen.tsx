import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [showText, setShowText] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timeline = [
      // Show logo for 1 second
      setTimeout(() => setShowText(true), 500),
      // Start hiding text after 3 seconds
      setTimeout(() => setHideText(true), 1500),
      // Start fadeout after 4 seconds  
      setTimeout(() => setFadeOut(true), 2000),
      // Complete loading after 4.5 seconds (extra 2 seconds total)
      setTimeout(() => onComplete(), 2250),
    ];

    return () => {
      timeline.forEach(timeout => clearTimeout(timeout));
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-transparent flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zIndex: 9999 }}
    >
      <div className="flex flex-col items-center">
        <img 
          src="/bunker.svg" 
          alt="Bunker Studio" 
          className="w-48 h-auto mt-20 mb-8"
        />
        
        <div 
          className={`text-black font-bold text-2xl tracking-widest text-center transition-all duration-700 ${
            showText && !hideText
              ? 'opacity-100 transform translate-y-0' 
              : showText && hideText
              ? 'opacity-0 transform -translate-y-4'
              : 'opacity-0 transform translate-y-4'
          }`}
        >
          <div className="leading-tight">
            BUNKER<br />
            STUDIO
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;