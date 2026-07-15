"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, forgetPassword } from "../../../lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("password"); 
  const [successMsg, setSuccessMsg] = useState(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("verify") === "true") {
        setSuccessMsg("Account created! A verification link has been sent to your email.");
      } else if (urlParams.get("verified") === "true") {
        setSuccessMsg("Email has been verified successfully. You can Login now.");
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (mode === "magic-link") {
        const { error } = await signIn.magicLink({ email });
        if (error) setError(error.message);
        else setSuccessMsg("Magic link sent! Check your email.");
      } else if (mode === "forgot-password") {
        const { error } = await forgetPassword({ email, redirectTo: "/reset-password" });
        if (error) setError(error.message);
        else setSuccessMsg("Password reset link sent! Check your email.");
      } else {
        const { error } = await signIn.email({ email, password });
        if (error) setError(error.message);
        else router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn.social({ provider: "google" });
  };

  // Emil Design Spring
  const spring = { type: "spring", bounce: 0, duration: 0.4 };

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#111] dark:text-[#f3f4f6] font-inter flex flex-col items-center justify-center p-4 relative overflow-hidden z-0">
      
      {/* Subtle Background Gradient Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#eaeaea] to-transparent dark:from-[#1a1a1a] opacity-50 blur-[100px] pointer-events-none -z-10 rounded-full" />

      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.push("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors text-sm font-medium"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </motion.button>

      <motion.article 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-[420px] p-8 bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col gap-8 relative z-10"
      >
        <header className="text-center flex flex-col gap-3">
          <div className="w-12 h-12 rounded-full bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] mx-auto flex items-center justify-center mb-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-black dark:text-white">lock</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'forgot-password' ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-[#666] dark:text-[#888]">
            {mode === 'forgot-password' ? 'We will send you a reset link.' : 'Sign in to access your dashboard.'}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span> {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="name@company.com"
            />
          </div>

          <AnimatePresence mode="popLayout">
            {mode === "password" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                className="flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setMode("forgot-password")}
                    className="text-[12px] text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
                  placeholder="••••••••"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3 mt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[14px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
            >
              {loading ? "Processing..." : mode === "magic-link" ? "Send Magic Link" : mode === "forgot-password" ? "Send Reset Link" : "Sign In"}
            </button>

            
            {/* Mode Switcher Tabs (Emil Design LayoutId) */}
            <div className="flex items-center p-1 bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222] rounded-xl mt-4">
              <button 
                type="button" 
                onClick={() => setMode("password")} 
                className="flex-1 py-1.5 text-xs font-medium relative z-10"
              >
                <span className={`relative z-20 transition-colors ${mode === 'password' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#888]'}`}>Password</span>
                {mode === 'password' && (
                  <motion.div layoutId="authTab" className="absolute inset-0 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-[#e5e5e5] dark:border-[#333] z-10" transition={spring} />
                )}
              </button>
              <button 
                type="button" 
                onClick={() => setMode("magic-link")} 
                className="flex-1 py-1.5 text-xs font-medium relative z-10"
              >
                <span className={`relative z-20 transition-colors ${mode === 'magic-link' ? 'text-black dark:text-white' : 'text-[#666] dark:text-[#888]'}`}>Magic Link</span>
                {mode === 'magic-link' && (
                  <motion.div layoutId="authTab" className="absolute inset-0 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-[#e5e5e5] dark:border-[#333] z-10" transition={spring} />
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="text-center mt-2">
          <p className="text-[13px] text-[#666] dark:text-[#888]">
            Don't have an account?{" "}
            <button onClick={() => router.push("/signup")} className="text-black dark:text-white font-medium hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </motion.article>
    </main>
  );
}
