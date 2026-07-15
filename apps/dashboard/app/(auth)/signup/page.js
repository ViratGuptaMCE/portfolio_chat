"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signUp, signIn } from "../../../lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/login?verified=true",
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/login?verify=true");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    await signIn.social({ provider: "google" });
  };

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
            <span className="material-symbols-outlined text-[20px] text-black dark:text-white">person_add</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-[#666] dark:text-[#888]">
            Deploy your technical identity.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="Alice Engineer"
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[14px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>

        <div className="text-center mt-2">
          <p className="text-[13px] text-[#666] dark:text-[#888]">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="text-black dark:text-white font-medium hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </motion.article>
    </main>
  );
}
