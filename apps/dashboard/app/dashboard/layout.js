"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "../../lib/auth-client";

if (typeof window !== "undefined") {
  import("@material/web/iconbutton/icon-button.js");
  import("@material/web/button/text-button.js");
  import("@material/web/icon/icon.js");
}

export default function DashboardLayout({ children }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);
  
  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-on-surface-variant text-body-large">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* MD3 Top App Bar */}
      <header className="h-16 bg-surface-container flex items-center justify-between px-4 border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <md-icon style={{ color: "var(--md-sys-color-primary)" }}>auto_awesome</md-icon>
          <span className="text-title-large font-medium text-on-surface">PortfolioChat</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-body-medium text-on-surface-variant hidden md:block">
            {session.user?.email}
          </div>
          <md-text-button onClick={handleSignOut}>
            Sign Out
          </md-text-button>
        </div>
      </header>

      {/* Main Content Area with Emil's Page Transition */}
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
