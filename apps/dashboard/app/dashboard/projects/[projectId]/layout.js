"use client";

import React, { use } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

if (typeof window !== "undefined") {
  import("@material/web/icon/icon.js");
}

export default function ProjectLayout({ children, params }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Need to unwrap params in Next.js 15+
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;

  const tabs = [
    { label: "Overview", path: `/dashboard/projects/${projectId}`, icon: "dashboard" },
    { label: "Knowledge Base", path: `/dashboard/projects/${projectId}/knowledge`, icon: "library_books" },
    { label: "Conversations", path: `/dashboard/projects/${projectId}/conversations`, icon: "forum" },
    { label: "Customizer", path: `/dashboard/projects/${projectId}/customizer`, icon: "palette" },
    { label: "Settings", path: `/dashboard/projects/${projectId}/settings`, icon: "settings" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pt-6 px-4 md:px-0">
      {/* Project Header */}
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-xl bg-surface-glass border border-surface-border flex items-center justify-center hover:bg-surface-border/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all active:scale-[0.95]"
          >
            <md-icon style={{ color: "var(--text-secondary)", fontSize: 20 }}>arrow_back</md-icon>
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Project Command Center</h1>
            <p className="text-xs text-text-tertiary font-mono uppercase tracking-widest">{projectId}</p>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex items-center gap-1 border-b border-surface-border pb-px overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 rounded-t-lg ${
                  isActive 
                    ? "text-accent-indigo bg-accent-indigo/5" 
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-border/30"
                }`}
              >
                <md-icon style={{ fontSize: 16 }}>{tab.icon}</md-icon>
                {tab.label}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-indigo shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Page Content */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="w-full relative z-0"
      >
        {children}
      </motion.div>
    </div>
  );
}
