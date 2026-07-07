import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="relative  pb-12 px-6 md:px-12 bg-white dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#222] overflow-hidden mt-24">
      {/* Decorative Glow Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none -z-10 rounded-t-full" />
      
      <div className="max-w-full mx-auto flex flex-col items-center text-center gap-16">
        
        {/* Main Open Source CTA Card */}
        <div className="flex flex-col items-center gap-6 p-12 w-full max-w-4xl bg-[#fafafa] dark:bg-[#111] border border-[#e5e5e5] dark:border-[#333] rounded-[2rem] shadow-xl relative overflow-hidden group">
          {/* Animated Hover Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-2">
             <span className="material-symbols-outlined text-3xl">public</span>
          </div>

          <h3 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Open Source & Community Driven</h3>
          <p className="text-[#666] dark:text-[#aaa] text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
            PortfolioChat is completely open-source. If this project helps you kill your static resume, please consider giving a star to my repo!
          </p>
          
          <a 
            href="https://github.com/viratguptamce/portfolio_chat" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.12)] hover:shadow-cyan-500/20"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Star the Repository
          </a>
        </div>

        {/* Bottom Credits & Branding */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 pt-10 border-t border-[#e5e5e5] dark:border-[#333]">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl p-2 flex items-center justify-center overflow-hidden shrink-0 bg-white">
              <Image
                src="/icon.svg"
                alt="PortfolioChat Logo"
                width={32}
                height={32}
                className="w-full h-full"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black tracking-tighter text-xl uppercase leading-none">PortfolioChat</span>
              <span className="text-[#888] dark:text-[#555] text-xs font-semibold mt-1">
                © 2026. ALL RIGHTS RESERVED.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm md:text-base font-medium text-[#666] dark:text-[#aaa] bg-[#fafafa] dark:bg-[#111] px-6 py-2.5 rounded-full border border-[#e5e5e5] dark:border-[#333] shadow-sm">
            Made with <span className="text-red-500 animate-pulse text-lg">❤️</span> by Virat Gupta
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-[11px] font-bold tracking-widest uppercase border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 rounded-full text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              SYSTEM NORMAL
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}

export default Footer;