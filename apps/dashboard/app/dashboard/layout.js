"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession, signOut } from "../../lib/auth-client";

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
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-[#666] dark:text-[#888] font-mono text-[11px] uppercase tracking-[0.2em] flex items-center gap-3"
        >
          <div className="w-4 h-4 rounded-full border border-black dark:border-white border-t-transparent animate-spin" />
          Loading Project
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-[#111] dark:text-[#f3f4f6] font-inter flex flex-col relative z-0 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAwaDQwdjQwaC00MHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAwaDQwdjQwaC00MHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] pointer-events-none -z-10" />
      
      <header className="h-16 w-full sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#e5e5e5] dark:border-[#222] flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <div className="w-8 h-8 rounded-xl p-2 flex items-center justify-center overflow-hidden shrink-0 bg-white">
            <Image src="/icon.svg" alt="PortfolioChat Logo" width={32} height={32} className="w-full h-full" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-black dark:text-white">PortfolioChat</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-[12px] font-mono text-[#888] hidden md:block">
            {session.user?.email}
          </div>
          <button 
            onClick={() => router.push("/dashboard/profile")}
            className="text-[13px] font-medium text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-all hover:scale-[1.05] active:scale-[0.95] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            Profile
          </button>
          <button 
            onClick={handleSignOut}
            className="text-[13px] font-medium text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-all hover:scale-[1.05] active:scale-[0.95]"
          >
            Sign Out
          </button>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex-1 w-full max-w-400 mx-auto p-6 md:p-12"
      >
        {children}
      </motion.main>
    </div>
  );
}
