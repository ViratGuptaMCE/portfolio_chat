import React, { useState, useRef } from "react";
import Image from "next/image";

function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      className="relative w-full aspect-[16/8] md:aspect-[21/10] bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden border border-[#e5e5e5] dark:border-[#333] shadow-2xl cursor-ew-resize select-none mx-auto max-w-5xl mt-20"
    >
      {/* Base Layer (AI Chat - After) */}
      <div className="absolute inset-0 pointer-events-none">
        <Image 
          src="/after.png" 
          alt="After: Interactive AI Chat" 
          fill
          priority
          className="object-cover" 
        />
      </div>

      {/* Top Layer (Static - Before) */}
      <div 
        className="absolute inset-0 pointer-events-none border-r-2 border-cyan-500"
        style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
      >
        <Image 
          src="/before.png" 
          alt="Before: Static Document" 
          fill
          priority
          className="object-cover" 
        />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-cyan-500 pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.5)]"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-black border-2 border-cyan-500 rounded-full flex items-center justify-center shadow-xl pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
           <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400">swipe</span>
        </div>
      </div>
    </div>
  );
}

export default BeforeAfterSlider;