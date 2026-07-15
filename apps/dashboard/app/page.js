"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "../lib/auth-client";
import BeforeAfterSlider from "./slider";
import Footer from "./footer";


const Tag = ({ children, active }) => (
  <span
    className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-white transition-colors ${active ? "bg-white text-black" : "bg-black text-white hover:bg-zinc-800"}`}
  >
    {children}
  </span>
);

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const capabilities = [
    { icon: 'palette', tag: ' WIDGET ', title: 'Customizable UI', desc: 'Design an embeddable chat interface that matches your personal branding perfectly.' },
    { icon: 'picture_as_pdf', tag: ' PARSING ', title: 'PDF Embedding', desc: 'Upload your resume or docs and let the AI automatically index them into vectors.' },
    { icon: 'memory', tag: ' BRAIN ', title: 'Knowledge Base', desc: 'Type in raw text or structured notes to create a custom brain for your bot.' },
    { icon: 'public', tag: ' CRAWLER ', title: 'Website Scraping', desc: 'Point the platform at a URL and watch it absorb the content instantly.' },
    { icon: 'tune', tag: ' CONFIG ', title: 'Model Settings', desc: 'Tweak the AI\'s personality, tone, language, and creativity parameters.' },
    { icon: 'lock', tag: ' SECURITY ', title: 'Hashed Keys', desc: 'Enterprise-grade security with zero-hint secret keys and safe database hashing.' },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#111] dark:text-[#f3f4f6] font-inter overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-20 px-6 md:px-12 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl p-2 flex items-center justify-center overflow-hidden shrink-0 bg-white">
            <Image
              src="/icon.svg"
              alt="PortfolioChat Logo"
              width={32}
              height={32}
              className="w-full h-full"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            PortfolioChat
          </span>
        </div>
        <div className="flex items-center gap-4">
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
      <section className="relative pt-40 pb-24 px-6 md:px-12 w-full mx-auto flex flex-col justify-center items-center">
        {/* Subtle Background Gradient Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

        {/* Center-Aligned Typography */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto z-10 relative w-full">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Tag active>Living Documents</Tag>
            <Tag>AI Architecture</Tag>
            <Tag>Zero-Config</Tag>
            <Tag>Embeddable</Tag>
            <Tag active>Headless API</Tag>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.95] mb-8"
          >
            Kill the{" "}
            <span className="bg-black text-white dark:bg-white dark:text-black px-4 rounded-2xl mx-1 inline-block -rotate-2">
              Static
            </span>{" "}
            Resume. <br className="hidden md:block" /> Deploy a Living AI.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="border-l-4 border-cyan-500 pl-6 mb-12"
          >
            <p className="text-lg md:text-2xl text-[#666] dark:text-[#888] font-medium leading-relaxed max-w-2xl text-left">
              Turn your experience into an interactive dialogue. Ingest your
              documents, customize the logic, and embed the intelligence
              anywhere.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full relative"
          >
            <BeforeAfterSlider />
          </motion.div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-16 px-4 md:py-32 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((c, i) => (
            <div
              key={i}
              className="group p-6 md:p-8 rounded-3xl bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#333] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(6,182,212,0.1)] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">{c.icon}</span>
                </div>
                <Tag active>{c.tag}</Tag>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">
                {c.title}
              </h3>
              <p className="text-[#666] dark:text-[#888] leading-relaxed text-sm md:text-base">
                {c.desc}
              </p>
            </div>
          ))}

          {/* Visual tile */}
          <div className="w-full col-span-1 md:col-span-2 lg:col-span-3 max-w-7xl h-48 md:h-64 border-4 border-white overflow-hidden mb-12 relative flex flex-col md:flex-row">
            <img
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop&grayscale=true"
              alt="Code texture"
              className="w-full md:w-1/3 object-cover border-b-4 md:border-b-0 md:border-r-4 border-white"
            />
            <img
              src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop&grayscale=true"
              alt="Matrix texture"
              className="w-full md:w-1/3 object-cover border-b-4 md:border-b-0 md:border-r-4 border-white"
            />
            <img
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop&grayscale=true"
              alt="Circuit texture"
              className="w-full md:w-1/3 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black text-white border-4 border-white px-6 md:px-8 py-3 md:py-4 font-black uppercase tracking-widest text-lg md:text-2xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:invert-100">
                Ingest Everything
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Walkthrough Timeline Section */}
      <section className="py-32 px-6 md:px-12 bg-white dark:bg-[#0a0a0a] border-t border-[#e5e5e5] dark:border-[#222]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 md:mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-[#666] dark:text-[#888] text-lg max-w-2xl">
              A seamless integration pipeline. Go from raw documents to a fully
              interactive portfolio assistant in three steps.
            </p>
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
              <div className="absolute -left-[41px] md:-left-[73px] top-1 w-6 h-6 rounded-full bg-[#fafafa] dark:bg-[#111] border-2 border-cyan-500 flex items-center justify-center shadow-md">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
              </div>
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center">
                <div className="flex-1">
                  <div className="text-sm font-mono text-cyan-600 dark:text-cyan-400 mb-2 uppercase tracking-widest font-bold">
                    Step 01
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                    Embed Your Data
                  </h3>
                  <p className="text-[#666] dark:text-[#aaa] leading-relaxed text-base">
                    Upload your resume, engineering blogs, markdown files, or
                    PDFs. Our ingestion engine automatically parses, vectorizes,
                    and stores your custom knowledge securely for the AI to
                    query.
                  </p>
                </div>
                <div className="flex-1 w-full bg-[#f5f5f5] dark:bg-[#111] rounded-3xl border border-[#e5e5e5] dark:border-[#222] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-black border border-[#e5e5e5] dark:border-[#333] flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-cyan-500 text-lg">
                          description
                        </span>
                      </div>
                      <span className="font-mono text-sm text-[#444] dark:text-[#ccc] font-medium">
                        resume_2026.pdf
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[#aaa] text-sm animate-pulse">
                      cloud_upload
                    </span>
                  </div>
                  <div className="w-full bg-[#e5e5e5] dark:bg-[#333] h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-cyan-500"
                    />
                  </div>
                  <p className="text-xs font-mono text-[#888] mt-3 text-right">
                    Vectorizing...
                  </p>
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
                  <div className="text-sm font-mono text-[#666] dark:text-[#888] mb-2 uppercase tracking-widest font-bold">
                    Step 02
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                    Make it yours
                  </h3>
                  <p className="text-[#666] dark:text-[#aaa] leading-relaxed text-base">
                    Adjust the system prompt to give your AI a unique
                    personality. Customize the widget's colors, theme, and
                    behavior to match your personal brand perfectly.
                  </p>
                </div>
                <div className="flex-1 w-full bg-[#f5f5f5] dark:bg-[#111] rounded-3xl border border-[#e5e5e5] dark:border-[#222] p-8 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#333]">
                      <span className="text-sm font-medium text-[#444] dark:text-[#ccc]">
                        Primary Color
                      </span>
                      <div className="w-6 h-6 rounded-full bg-cyan-500 shadow-sm" />
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#333]">
                      <span className="text-sm font-medium text-[#444] dark:text-[#ccc]">
                        Border Radius
                      </span>
                      <span className="font-mono text-xs bg-[#f5f5f5] dark:bg-[#222] px-2 py-1 rounded text-[#666] dark:text-[#888]">
                        16px
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#333]">
                      <span className="text-sm font-medium text-[#444] dark:text-[#ccc]">
                        Tone
                      </span>
                      <span className="font-mono text-xs bg-[#f5f5f5] dark:bg-[#222] px-2 py-1 rounded text-[#666] dark:text-[#888]">
                        Professional
                      </span>
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
                  <div className="text-sm font-mono text-[#666] dark:text-[#888] mb-2 uppercase tracking-widest font-bold">
                    Step 03
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                    Drop the JS. <br />
                    Forget the backend.
                  </h3>
                  <p className="text-[#666] dark:text-[#aaa] leading-relaxed text-base">
                    Paste a single {"<script>"} tag into your HTML. We provide
                    the fully-managed serverless API, rate limiting, and chat
                    completions under the hood. No servers to manage.
                  </p>
                </div>
                <div className="flex-1 w-full bg-[#0a0a0a] rounded-3xl border border-[#333] p-6 shadow-xl overflow-x-auto">
                  <div className="flex gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <pre className="text-[12px] md:text-[13px] font-mono text-[#a3b1c6] leading-relaxed whitespace-pre-wrap break-words">
                    <span className="text-[#c678dd]">{"<script"}</span>{" "}
                    <span className="text-[#d19a66]">src</span>=
                    <span className="text-[#98c379]">
                      "https://cdn.portfoliochat.io/widget.js"
                    </span>
                    <span className="text-[#c678dd]">{">"}</span>
                    <span className="text-[#c678dd]">{"</script>"}</span>
                    <br />
                    <span className="text-[#c678dd]">{"<script>"}</span>
                    <br />
                    {"  "}PortfolioChat.init({"{"}
                    <br />
                    {"    "}apiKey:{" "}
                    <span className="text-[#98c379]">'pc_live_8f72...'</span>
                    <br />
                    {"  "}
                    {"}"});
                    <br />
                    <span className="text-[#c678dd]">{"</script>"}</span>
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Serverless API Section */}
      <section className="py-24 px-6 md:px-12 bg-[#fafafa] dark:bg-[#0a0a0a] border-y border-[#e5e5e5] dark:border-[#222]">
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
                  <span className="material-symbols-outlined text-white dark:text-black">
                    api
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                  Powerful Serverless API
                </h2>
                <p className="text-[#666] dark:text-[#888] text-lg leading-relaxed mb-8">
                  Don't want to use our JS widget? Build your own custom UI
                  using our secure REST API. We provide a robust, edge-optimized
                  serverless backend so you never have to worry about
                  provisioning databases, managing AI pipelines, or scaling
                  infrastructure.
                </p>
                <ul className="flex flex-col gap-4">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-xl">
                      check_circle
                    </span>
                    <span className="text-[#444] dark:text-[#ccc] font-medium text-base">
                      Global Edge Routing
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-xl">
                      check_circle
                    </span>
                    <span className="text-[#444] dark:text-[#ccc] font-medium text-base">
                      Automatic Rate Limiting
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-xl">
                      check_circle
                    </span>
                    <span className="text-[#444] dark:text-[#ccc] font-medium text-base">
                      Secure Vector Search Pipeline
                    </span>
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
                className="bg-[#111] p-6 md:p-8 rounded-3xl border border-[#333] shadow-2xl relative overflow-hidden"
              >
                {/* Subtle tech glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#222]">
                  <span className="text-[#888] font-mono text-xs uppercase tracking-widest font-semibold">
                    POST /v1/chat/completions
                  </span>
                </div>
                <pre className="text-[12px] md:text-[14px] font-mono text-[#a3b1c6] leading-relaxed overflow-x-auto">
                  <span className="text-[#c678dd]">await</span>{" "}
                  <span className="text-[#61afef]">fetch</span>(
                  <span className="text-[#98c379]">
                    'https://api.portfoliochat.io/v1/chat'
                  </span>
                  , {"{"}
                  <br />
                  {"  "}method: <span className="text-[#98c379]">'POST'</span>,
                  <br />
                  {"  "}headers: {"{"}
                  <br />
                  {"    "}
                  <span className="text-[#98c379]">'Authorization'</span>:{" "}
                  <span className="text-[#98c379]">'Bearer pc_live_...'</span>,
                  <br />
                  {"    "}
                  <span className="text-[#98c379]">'Content-Type'</span>:{" "}
                  <span className="text-[#98c379]">'application/json'</span>
                  <br />
                  {"  "}
                  {"}"},
                  <br />
                  {"  "}body: <span className="text-[#e5c07b]">JSON</span>.
                  <span className="text-[#61afef]">stringify</span>({"{"}
                  <br />
                  {"    "}messages: [{"{"} role:{" "}
                  <span className="text-[#98c379]">'user'</span>, content:{" "}
                  <span className="text-[#98c379]">'Hello'</span> {"}"}]
                  <br />
                  {"  "}
                  {"}"})
                  <br />
                  {"}"});
                </pre>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer/>
    </main>
  );
}
