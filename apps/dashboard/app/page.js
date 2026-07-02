"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#111] dark:text-[#f3f4f6] font-inter overflow-x-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-20 px-6 md:px-12 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white dark:text-black text-lg">data_object</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">PortfolioChat</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.open("https://github.com/viratguptamce/portfolio_chat", "_blank")}
            className="text-sm font-medium text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white transition-colors"
          >
            GitHub
          </button>
          <button 
            onClick={() => router.push("/login")}
            className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Container */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 max-w-350 mx-auto min-h-screen flex flex-col">
        
        {/* Subtle Background Gradient Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-150 bg-linear-to-b from-[#eaeaea] to-transparent dark:from-[#1a1a1a] opacity-50 blur-[100px] pointer-events-none -z-10 rounded-full" />

        {/* Center-Aligned Typography */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 z-10 relative mt-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="border border-[#e5e5e5] dark:border-[#333] bg-white/50 dark:bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 mb-8 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-medium text-[#444] dark:text-[#ccc]">Nexus AI Engine v1.0</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Give your portfolio <br className="hidden md:block" /> a technical voice.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-[#666] dark:text-[#888] leading-relaxed max-w-2xl mb-10"
          >
            Upload your engineering documents. Deploy an intelligent, high-fidelity widget that engages recruiters with immediate precision.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4"
          >
            <button 
              onClick={() => router.push("/signup")}
              className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.12)] flex items-center gap-2"
            >
              Start Building
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button 
              onClick={() => window.open("https://github.com/viratguptamce/portfolio_chat", "_blank")}
              className="px-8 py-3.5 bg-white dark:bg-[#111] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] font-semibold rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              View Documentation
            </button>
          </motion.div>
        </div>

        {/* Asymmetric Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto flex-1 mt-8">
          
          {/* Central Focal Point: Simulated App Window */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-2 relative rounded-4xl bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden min-h-100 flex flex-col"
          >
            {/* Very light, fine-lined grid overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAwaDQwdjQwaC00MHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAwaDQwdjQwaC00MHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] pointer-events-none" />
            
            {/* App Window Header */}
            <div className="h-12 border-b border-[#e5e5e5] dark:border-[#222] flex items-center px-6 gap-2 bg-[#fafafa] dark:bg-[#0a0a0a] z-10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#e5e5e5] dark:bg-[#333]" />
                <div className="w-3 h-3 rounded-full bg-[#e5e5e5] dark:bg-[#333]" />
                <div className="w-3 h-3 rounded-full bg-[#e5e5e5] dark:bg-[#333]" />
              </div>
              <div className="mx-auto flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] rounded-md">
                <span className="material-symbols-outlined text-[12px] text-[#888]">lock</span>
                <span className="text-[11px] font-mono text-[#666] dark:text-[#888]">dashboard.portfoliochat.io</span>
              </div>
            </div>

            {/* App Content */}
            <div className="flex-1 p-8 flex gap-8 z-10 bg-transparent">
              {/* Fake Code / Terminal View */}
              <div className="flex-1 bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222] rounded-2xl p-6 flex flex-col font-mono text-[13px] shadow-inner">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#e5e5e5] dark:border-[#333]">
                  <span className="text-[#888]">widget.js</span>
                  <span className="text-[#ccc] dark:text-[#444]">Ready</span>
                </div>
                <div className="flex flex-col gap-2 text-[#444] dark:text-[#aaa]">
                  <p><span className="text-[#000] dark:text-[#fff]">import</span> {"{"} initWidget {"}"} <span className="text-[#000] dark:text-[#fff]">from</span> '@portfoliochat/client';</p>
                  <br/>
                  <p>initWidget({"{"}</p>
                  <p className="pl-4">apiKey: <span className="text-[#666] dark:text-[#888]">'pc_live_8f72...'</span>,</p>
                  <p className="pl-4">theme: <span className="text-[#666] dark:text-[#888]">'minimalist'</span>,</p>
                  <p className="pl-4">context: <span className="text-[#666] dark:text-[#888]">'resume.pdf'</span></p>
                  <p>{"}"});</p>
                  <br/>
                  <p className="text-[#888] dark:text-[#555]">// System operational.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Asymmetric Modular Card Layout (Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col gap-4"
          >
            <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-[#e5e5e5] dark:border-[#222] shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </div>
                <span className="material-symbols-outlined text-[#ccc] dark:text-[#444] text-sm">north_east</span>
              </div>
              <div>
                <h3 className="font-semibold text-[15px] mb-1">Instant Deployment</h3>
                <p className="text-[#666] dark:text-[#888] text-[13px] leading-relaxed">Embed your intelligent widget in seconds with zero complex pipelines.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-[#e5e5e5] dark:border-[#222] shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">database</span>
                </div>
                <span className="material-symbols-outlined text-[#ccc] dark:text-[#444] text-sm">north_east</span>
              </div>
              <div>
                <h3 className="font-semibold text-[15px] mb-1">Semantic Ingestion</h3>
                <p className="text-[#666] dark:text-[#888] text-[13px] leading-relaxed">Automatically vectorize and parse PDFs, markdown, and engineering blogs.</p>
              </div>
            </div>

            <div className="bg-black dark:bg-white p-6 rounded-3xl shadow-md group flex flex-col justify-between flex-1 min-h-[100px] cursor-pointer" onClick={() => router.push("/login")}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[15px] mb-1 text-white dark:text-black">Access Dashboard</h3>
                  <p className="text-[#aaa] dark:text-[#555] text-[13px]">Manage your API keys</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 dark:bg-black/5 flex items-center justify-center group-hover:bg-white/20 dark:group-hover:bg-black/10 transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-white dark:text-black">arrow_forward</span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] dark:border-[#222] py-8 px-6 md:px-12 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[#888] dark:text-[#555] text-xs font-mono">© 2026 PortfolioChat Engine.</span>
          <div className="flex gap-6">
            <span className="text-[#666] dark:text-[#888] text-sm hover:text-black dark:hover:text-white cursor-pointer transition-colors">Status</span>
            <span className="text-[#666] dark:text-[#888] text-sm hover:text-black dark:hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="text-[#666] dark:text-[#888] text-sm hover:text-black dark:hover:text-white cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
