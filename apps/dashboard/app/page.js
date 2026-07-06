"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "../lib/auth-client";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#111] dark:text-[#f3f4f6] font-inter overflow-x-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-20 px-6 md:px-12 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl p-2 flex items-center justify-center overflow-hidden shrink-0 bg-white">
            <Image src="/icon.svg" alt="PortfolioChat Logo" width={32} height={32} className="w-full h-full" />
          </div>
          <span className="text-lg font-semibold tracking-tight">PortfolioChat</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.open("https://github.com/viratguptamce/portfolio_chat", "_blank")}
            className="text-sm font-medium text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white transition-colors hidden sm:block"
          >
            GitHub
          </button>
          
          {isPending ? (
            <div className="w-[84px] h-[36px] bg-[#e5e5e5] dark:bg-[#222] animate-pulse rounded-full" />
          ) : session ? (
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              Go to Dashboard
            </button>
          ) : (
            <button 
              onClick={() => router.push("/login")}
              className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Container */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col justify-center items-center mt-12 md:mt-24 mb-12">
        {/* Subtle Background Gradient Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#eaeaea] to-transparent dark:from-[#1a1a1a] opacity-50 blur-[100px] pointer-events-none -z-10 rounded-full" />

        {/* Center-Aligned Typography */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto z-10 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="border border-[#e5e5e5] dark:border-[#333] bg-white/50 dark:bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 mb-8 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-medium text-[#444] dark:text-[#ccc]">Serverless AI Engine</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Add an intelligent AI to your <br className="hidden md:block" /> personal site in minutes.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-[#666] dark:text-[#888] leading-relaxed max-w-2xl mb-10"
          >
            We provide a simple JS widget and serverless API. Upload your context data, customize the aesthetics, and deploy without worrying about backend infrastructure.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button 
              onClick={() => session ? router.push("/dashboard") : router.push("/signup")}
              className="w-full sm:w-auto px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.12)] flex items-center justify-center gap-2"
            >
              {session ? "Go to Dashboard" : "Start Building"}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button 
              onClick={() => window.open("https://github.com/viratguptamce/portfolio_chat", "_blank")}
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-[#111] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] font-semibold rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              View Documentation
            </button>
          </motion.div>
        </div>
      </section>

      {/* Walkthrough Timeline Section */}
      <section className="py-32 px-6 md:px-12 bg-white dark:bg-[#0a0a0a] border-t border-b border-[#e5e5e5] dark:border-[#222]">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 md:mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">How it works</h2>
            <p className="text-[#666] dark:text-[#888] text-lg max-w-2xl">A seamless integration pipeline. Go from raw documents to a fully interactive portfolio assistant in three steps.</p>
          </motion.div>

          <div className="relative ml-4 md:ml-8 border-l border-[#e5e5e5] dark:border-[#333] pl-8 md:pl-16 flex flex-col gap-20 md:gap-32">
            
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -left-[41px] md:-left-[73px] top-1 w-6 h-6 rounded-full bg-[#fafafa] dark:bg-[#111] border-2 border-black dark:border-white flex items-center justify-center shadow-md">
                <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
              </div>
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center">
                <div className="flex-1">
                  <div className="text-sm font-mono text-[#666] dark:text-[#888] mb-2 uppercase tracking-widest">Step 01</div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Embed Your Data</h3>
                  <p className="text-[#666] dark:text-[#aaa] leading-relaxed text-base">
                    Upload your resume, engineering blogs, markdown files, or PDFs. Our ingestion engine automatically parses, vectorizes, and stores your custom knowledge securely for the AI to query.
                  </p>
                </div>
                <div className="flex-1 w-full bg-[#f5f5f5] dark:bg-[#111] rounded-3xl border border-[#e5e5e5] dark:border-[#222] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-[#e5e5e5] dark:border-[#333] flex items-center justify-center shadow-sm">
                         <span className="material-symbols-outlined text-blue-500 text-lg">description</span>
                       </div>
                       <span className="font-mono text-sm text-[#444] dark:text-[#ccc] font-medium">resume_2026.pdf</span>
                     </div>
                     <span className="material-symbols-outlined text-[#aaa] text-sm animate-pulse">cloud_upload</span>
                  </div>
                  <div className="w-full bg-[#e5e5e5] dark:bg-[#333] h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-black dark:bg-white"
                    />
                  </div>
                  <p className="text-xs font-mono text-[#888] mt-3 text-right">Vectorizing...</p>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -left-[41px] md:-left-[73px] top-1 w-6 h-6 rounded-full bg-[#fafafa] dark:bg-[#111] border-2 border-[#e5e5e5] dark:border-[#333] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#e5e5e5] dark:bg-[#333]" />
              </div>
              <div className="flex flex-col md:flex-row-reverse gap-8 md:gap-12 items-start md:items-center">
                <div className="flex-1">
                  <div className="text-sm font-mono text-[#666] dark:text-[#888] mb-2 uppercase tracking-widest">Step 02</div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Make it yours</h3>
                  <p className="text-[#666] dark:text-[#aaa] leading-relaxed text-base">
                    Adjust the system prompt to give your AI a unique personality. Customize the widget's colors, theme, and behavior to match your personal brand perfectly.
                  </p>
                </div>
                <div className="flex-1 w-full bg-[#f5f5f5] dark:bg-[#111] rounded-3xl border border-[#e5e5e5] dark:border-[#222] p-8 shadow-sm">
                   <div className="flex flex-col gap-4">
                     <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#333]">
                       <span className="text-sm font-medium text-[#444] dark:text-[#ccc]">Primary Color</span>
                       <div className="w-6 h-6 rounded-full bg-blue-500 shadow-sm" />
                     </div>
                     <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#333]">
                       <span className="text-sm font-medium text-[#444] dark:text-[#ccc]">Border Radius</span>
                       <span className="font-mono text-xs bg-[#f5f5f5] dark:bg-[#222] px-2 py-1 rounded text-[#666] dark:text-[#888]">16px</span>
                     </div>
                     <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#333]">
                       <span className="text-sm font-medium text-[#444] dark:text-[#ccc]">Tone</span>
                       <span className="font-mono text-xs bg-[#f5f5f5] dark:bg-[#222] px-2 py-1 rounded text-[#666] dark:text-[#888]">Professional</span>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative"
            >
              <div className="absolute -left-[41px] md:-left-[73px] top-1 w-6 h-6 rounded-full bg-[#fafafa] dark:bg-[#111] border-2 border-[#e5e5e5] dark:border-[#333] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#e5e5e5] dark:bg-[#333]" />
              </div>
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center">
                <div className="flex-1">
                  <div className="text-sm font-mono text-[#666] dark:text-[#888] mb-2 uppercase tracking-widest">Step 03</div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Drop the JS. <br/>Forget the backend.</h3>
                  <p className="text-[#666] dark:text-[#aaa] leading-relaxed text-base">
                    Paste a single {"<script>"} tag into your HTML. We provide the fully-managed serverless API, rate limiting, and chat completions under the hood. No servers to manage.
                  </p>

                </div>
                <div className="flex-1 w-full bg-[#0a0a0a] rounded-3xl border border-[#333] p-6 shadow-xl overflow-x-auto">
                   <div className="flex gap-2 mb-4">
                     <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                     <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                     <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                   </div>
                   <pre className="text-[12px] md:text-[13px] font-mono text-[#a3b1c6] leading-relaxed">
                     <span className="text-[#c678dd]">{"<script"}</span> <span className="text-[#d19a66]">src</span>=<span className="text-[#98c379]">"https://cdn.portfoliochat.io/widget.js"</span><span className="text-[#c678dd]">{">"}</span><span className="text-[#c678dd]">{"</script>"}</span>
                     <br/>
                     <span className="text-[#c678dd]">{"<script>"}</span>
                     <br/>
                     {"  "}PortfolioChat.init({"{"}
                     <br/>
                     {"    "}apiKey: <span className="text-[#98c379]">'pc_live_8f72...'</span>
                     <br/>
                     {"  "}{"}"});
                     <br/>
                     <span className="text-[#c678dd]">{"</script>"}</span>
                   </pre>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Serverless API Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fafafa] dark:bg-[#0a0a0a] border-b border-[#e5e5e5] dark:border-[#222]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <span className="material-symbols-outlined text-white dark:text-black">api</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Powerful Serverless API</h2>
                <p className="text-[#666] dark:text-[#888] text-lg leading-relaxed mb-8">
                  Don't want to use our JS widget? Build your own custom UI using our secure REST API. We provide a robust, edge-optimized serverless backend so you never have to worry about provisioning databases, managing AI pipelines, or scaling infrastructure.
                </p>
                <ul className="flex flex-col gap-4">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-xl">check_circle</span>
                    <span className="text-[#444] dark:text-[#ccc] font-medium text-base">Global Edge Routing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-xl">check_circle</span>
                    <span className="text-[#444] dark:text-[#ccc] font-medium text-base">Automatic Rate Limiting</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-xl">check_circle</span>
                    <span className="text-[#444] dark:text-[#ccc] font-medium text-base">Secure Vector Search Pipeline</span>
                  </li>
                </ul>
              </motion.div>
            </div>
            
            <div className="flex-1 w-full lg:w-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[#0a0a0a] p-6 md:p-8 rounded-3xl border border-[#333] shadow-2xl relative overflow-hidden"
              >
                {/* Subtle tech glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#222]">
                  <span className="text-[#888] font-mono text-xs uppercase tracking-widest font-semibold">POST /v1/chat/completions</span>
                </div>
                <pre className="text-[12px] md:text-[14px] font-mono text-[#a3b1c6] leading-relaxed overflow-x-auto">
                  <span className="text-[#c678dd]">await</span> <span className="text-[#61afef]">fetch</span>(<span className="text-[#98c379]">'https://api.portfoliochat.io/v1/chat'</span>, {"{"}
                  <br/>
                  {"  "}method: <span className="text-[#98c379]">'POST'</span>,
                  <br/>
                  {"  "}headers: {"{"}
                  <br/>
                  {"    "}<span className="text-[#98c379]">'Authorization'</span>: <span className="text-[#98c379]">'Bearer pc_live_...'</span>,
                  <br/>
                  {"    "}<span className="text-[#98c379]">'Content-Type'</span>: <span className="text-[#98c379]">'application/json'</span>
                  <br/>
                  {"  "}{"}"},
                  <br/>
                  {"  "}body: <span className="text-[#e5c07b]">JSON</span>.<span className="text-[#61afef]">stringify</span>({"{"}
                  <br/>
                  {"    "}messages: [{"{"} role: <span className="text-[#98c379]">'user'</span>, content: <span className="text-[#98c379]">'Hello'</span> {"}"}]
                  <br/>
                  {"  "}{"}"})
                  <br/>
                  {"}"});
                </pre>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/icon.svg" alt="PortfolioChat Logo" width={32} height={32} className="w-full h-full" />
            </div>
            <span className="font-semibold tracking-tight text-sm">PortfolioChat</span>
          </div>
          <span className="text-[#888] dark:text-[#555] text-[13px] font-medium">© 2026 PortfolioChat. All rights reserved.</span>
          <div className="flex gap-8">
            <span className="text-[#666] dark:text-[#888] text-[13px] font-medium hover:text-black dark:hover:text-white cursor-pointer transition-colors">Documentation</span>
            <span className="text-[#666] dark:text-[#888] text-[13px] font-medium hover:text-black dark:hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="text-[#666] dark:text-[#888] text-[13px] font-medium hover:text-black dark:hover:text-white cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
