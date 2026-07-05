"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resetPassword } from "../../../lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const spring = { type: "spring", bounce: 0, duration: 0.4 };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await resetPassword({
        newPassword: password,
        token: token,
      });

      if (error) {
        setError(error.message || "Failed to reset password. Token may be expired.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#111] dark:text-[#f3f4f6] font-inter flex flex-col items-center justify-center p-4 relative overflow-hidden z-0">
      {/* Subtle Background Gradient Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#eaeaea] to-transparent dark:from-[#1a1a1a] opacity-50 blur-[100px] pointer-events-none -z-10 rounded-full" />

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.push("/login")}
        className="absolute top-8 left-8 flex items-center gap-2 text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors text-sm font-medium"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Sign In
      </motion.button>

      <motion.article
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-[420px] p-8 bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col gap-8 relative z-10"
      >
        <header className="text-center flex flex-col gap-3">
          <div className="w-12 h-12 rounded-full bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] mx-auto flex items-center justify-center mb-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-black dark:text-white">
              key
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
          <p className="text-sm text-[#666] dark:text-[#888]">
            Enter your new password below to complete the reset process.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm flex flex-col gap-3 items-center text-center"
            >
              <div className="flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Password Reset Successfully!
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Your password has been updated. You can now log in with your new credentials.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-2 w-full py-2.5 rounded-xl bg-green-600 text-white font-medium text-xs hover:bg-green-700 transition-colors"
              >
                Go to Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[14px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center mt-2"
            >
              {loading ? "Resetting Password..." : "Update Password"}
            </button>
          </form>
        )}
      </motion.article>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center text-sm text-[#666]">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
