"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

// Import Material Web Components securely for Next.js App Router (Client Side)
// In a real app we might wrap these or ensure they only load on the client.
if (typeof window !== "undefined") {
  import("@material/web/button/filled-button.js");
  import("@material/web/button/outlined-button.js");
  import("@material/web/icon/icon.js");
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  // Emil's animation rules: Spring-based mouse interactions
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const springX = useSpring(0, { stiffness: 100, damping: 10 });
  const springY = useSpring(0, { stiffness: 100, damping: 10 });

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    
    const handleMouseMove = (e) => {
      // Calculate offset from center for subtle parallax
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      springX.set(x);
      springY.set(y);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [springX, springY]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-8 overflow-hidden relative">
      
      {/* Subtle decorative background (Emil's rule: beauty is leverage) */}
      <motion.div 
        className="absolute w-[800px] h-[800px] bg-primary-container/20 rounded-full blur-[120px] -z-10"
        style={{ x: springX, y: springY }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ 
          duration: 0.6, 
          // Emil's recommended ease-out for entering elements
          ease: [0.23, 1, 0.32, 1] 
        }}
        className="max-w-3xl text-center flex flex-col items-center gap-8"
      >
        <div className="bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant flex items-center gap-2">
          <md-icon style={{ fontSize: 18 }} slot="icon">auto_awesome</md-icon>
          <span className="text-label-large font-medium">PortfolioChat v1.0</span>
        </div>

        <h1 className="text-display-large font-bold tracking-tight text-on-background">
          Give your portfolio a <span className="text-primary">voice</span>.
        </h1>
        
        <p className="text-headline-small text-on-surface-variant max-w-2xl leading-relaxed">
          Upload your resume, blogs, and project docs. Deploy an intelligent widget that answers recruiter questions instantly.
        </p>

        <div className="flex gap-4 mt-8">
          <md-filled-button onClick={() => window.location.href = "/dashboard"}>
            Get Started
            <md-icon slot="icon">arrow_forward</md-icon>
          </md-filled-button>
          
          <md-outlined-button onClick={() => window.open("https://github.com/viratguptamce/portfolio_chat", "_blank")}>
            View Source
            <md-icon slot="icon">code</md-icon>
          </md-outlined-button>
        </div>
      </motion.div>
    </main>
  );
}
