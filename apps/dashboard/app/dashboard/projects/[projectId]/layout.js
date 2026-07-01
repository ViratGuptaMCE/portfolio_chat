"use client";

import React, { use } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

if (typeof window !== "undefined") {
  import("@material/web/tabs/tabs.js");
  import("@material/web/tabs/primary-tab.js");
  import("@material/web/icon/icon.js");
}

export default function ProjectLayout({ children, params }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Need to unwrap params in Next.js 15
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;

  const tabs = [
    { label: "Overview", path: `/dashboard/projects/${projectId}`, icon: "dashboard" },
    { label: "Knowledge Base", path: `/dashboard/projects/${projectId}/knowledge`, icon: "library_books" },
    { label: "Conversations", path: `/dashboard/projects/${projectId}/conversations`, icon: "forum" },
    { label: "Customizer", path: `/dashboard/projects/${projectId}/customizer`, icon: "palette" },
    { label: "Settings", path: `/dashboard/projects/${projectId}/settings`, icon: "settings" },
  ];

  const activeTabIndex = tabs.findIndex(tab => pathname === tab.path) !== -1 
    ? tabs.findIndex(tab => pathname === tab.path) 
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Project Header */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <md-icon style={{ color: "var(--md-sys-color-primary)", cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>arrow_back</md-icon>
          <h1 className="text-display-small font-medium text-on-background">Project Settings</h1>
        </div>

        {/* MD3 Tabs */}
        <md-tabs activeTabIndex={activeTabIndex} onChange={(e) => {
          const index = e.target.activeTabIndex;
          if (tabs[index]) router.push(tabs[index].path);
        }}>
          {tabs.map((tab, idx) => (
            <md-primary-tab key={tab.path} active={idx === activeTabIndex}>
              <md-icon slot="icon">{tab.icon}</md-icon>
              {tab.label}
            </md-primary-tab>
          ))}
        </md-tabs>
      </header>

      {/* Page Content */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
