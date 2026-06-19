import React, { useState, useEffect } from 'react';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 600); // Hang on 100 for a split second
          return 100;
        }
        return p + Math.floor(Math.random() * 12) + 2;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Format the number to always have 3 digits (e.g., 055, 100)
  const displayNum = progress > 100 ? 100 : progress;
  const formatted = displayNum.toString().padStart(3, '0');

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Top Left Branding */}
      <div className="absolute top-8 left-8 text-[10px] font-mono tracking-[0.3em] text-gray-500 uppercase">
        Phalanx AI
      </div>
      
      {/* Center Cinematic Text */}
      <div className="text-4xl md:text-6xl italic text-gray-300 tracking-widest opacity-90 transition-opacity duration-1000" style={{ fontFamily: 'Georgia, serif' }}>
        Connect
      </div>

      {/* Massive Background Number (The shadow effect from your screenshot) */}
      <div className="absolute -bottom-12 -right-6 text-[14rem] md:text-[24rem] font-sans font-light text-[#0a0a0a] tracking-tighter leading-none select-none z-0">
        {formatted}
      </div>
      
      {/* Foreground Crisp Number */}
      <div className="absolute bottom-12 right-12 text-6xl md:text-9xl font-sans font-light text-white tracking-tighter z-10">
        {formatted}
      </div>
    </div>
  );
}