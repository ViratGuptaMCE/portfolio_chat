"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getProjectSetupStatus } from "../../../actions";

export default function ProjectSetupNotification({ userId, projectId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (userId && projectId) {
        setLoading(true);
        const result = await getProjectSetupStatus(userId, projectId);
        setStatus(result);
        setLoading(false);
      }
    }
    checkStatus();
  }, [userId, projectId]);

  if (loading || !status || status.isFullyConfigured) {
    return null;
  }

  const { hasSettings, hasWidgetConfig } = status;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative overflow-hidden bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/5 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-6 md:p-7 shadow-[0_8px_32px_rgba(244,63,94,0.12)] flex flex-col gap-5"
      >
        {/* Subtle Ambient Glowing Aura */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/15 blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />

        {/* Header Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-xl">tune</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                Project Configuration Incomplete
              </h3>
              <p className="text-xs text-rose-200/90">
                Configure your AI settings and widget customizer before embedding to ensure seamless responses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-full">
              Setup Pending
            </span>
          </div>
        </div>

        {/* Action Item Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Project Settings */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
            hasSettings 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90" 
              : "bg-surface-elevated/80 border-surface-border hover:border-rose-500/40 text-text-primary"
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-lg ${hasSettings ? "text-emerald-400" : "text-rose-400"}`}>
                  {hasSettings ? "check_circle" : "settings_suggest"}
                </span>
                <span className="text-xs font-semibold font-mono uppercase tracking-wider text-text-primary">
                  1. Project & AI Settings
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${
                hasSettings 
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" 
                  : "bg-rose-500/20 border-rose-500/30 text-rose-300"
              }`}>
                {hasSettings ? "Configured ✓" : "Action Required"}
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              {hasSettings 
                ? "AI Model, System Prompt, and Tone settings are configured." 
                : "Configure your AI Model, System Prompt, Tone, and Allowed Website Domains."}
            </p>

            {!hasSettings && (
              <Link
                href={`/dashboard/projects/${projectId}/settings`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-white transition-colors mt-1 group"
              >
                <span>Configure Settings</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            )}
          </div>

          {/* Card 2: Widget Customizer */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
            hasWidgetConfig 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90" 
              : "bg-surface-elevated/80 border-surface-border hover:border-rose-500/40 text-text-primary"
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-lg ${hasWidgetConfig ? "text-emerald-400" : "text-rose-400"}`}>
                  {hasWidgetConfig ? "check_circle" : "palette"}
                </span>
                <span className="text-xs font-semibold font-mono uppercase tracking-wider text-text-primary">
                  2. Widget Customization
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${
                hasWidgetConfig 
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" 
                  : "bg-rose-500/20 border-rose-500/30 text-rose-300"
              }`}>
                {hasWidgetConfig ? "Configured ✓" : "Action Required"}
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              {hasWidgetConfig 
                ? "Widget theme, launcher style, and greetings are configured." 
                : "Customize widget theme, bot avatar, launcher style, and published welcome greeting."}
            </p>

            {!hasWidgetConfig && (
              <Link
                href={`/dashboard/projects/${projectId}/customizer`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-white transition-colors mt-1 group"
              >
                <span>Customize Widget</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
