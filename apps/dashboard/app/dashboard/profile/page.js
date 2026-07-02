"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, updateUser, changePassword } from "../../../lib/auth-client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const { error } = await updateUser({ name });
      if (error) setProfileMsg({ type: "error", text: error.message });
      else setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    setPasswordMsg({ type: "", text: "" });
    try {
      const { error } = await changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      });
      if (error) setPasswordMsg({ type: "error", text: error.message });
      else {
        setPasswordMsg({ type: "success", text: "Password changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err) {
      setPasswordMsg({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoadingPassword(false);
    }
  };

  const spring = { type: "spring", bounce: 0, duration: 0.4 };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
      
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-black dark:text-white">manage_accounts</span>
          </div>
          Profile Settings
        </h1>
        <p className="text-[#666] dark:text-[#888]">Manage your account details and security preferences.</p>
      </header>

      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] p-8 flex flex-col gap-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold border-b border-[#e5e5e5] dark:border-[#222] pb-4">Personal Information</h2>
        
        <AnimatePresence mode="wait">
          {profileMsg.text && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`p-3 rounded-xl text-sm flex items-center gap-2 ${profileMsg.type === 'error' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400'}`}>
              <span className="material-symbols-outlined text-[18px]">{profileMsg.type === 'error' ? 'error' : 'check_circle'}</span> {profileMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">Email (Read Only)</label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-[#f5f5f5] dark:bg-[#050505] border border-[#e5e5e5] dark:border-[#333] text-[#888] dark:text-[#555] focus:outline-none text-sm cursor-not-allowed"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="Alice Engineer"
            />
          </div>
          
          <div className="mt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={loadingProfile} 
              className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {loadingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.2 }}
        className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] p-8 flex flex-col gap-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold border-b border-[#e5e5e5] dark:border-[#222] pb-4">Change Password</h2>
        
        <AnimatePresence mode="wait">
          {passwordMsg.text && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`p-3 rounded-xl text-sm flex items-center gap-2 ${passwordMsg.type === 'error' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400'}`}>
              <span className="material-symbols-outlined text-[18px]">{passwordMsg.type === 'error' ? 'error' : 'check_circle'}</span> {passwordMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#444] dark:text-[#ccc]">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#333] focus:border-black dark:focus:border-white focus:outline-none transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>
          
          <div className="mt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={loadingPassword} 
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] text-black dark:text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {loadingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}
