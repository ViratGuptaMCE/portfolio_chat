"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "../../lib/auth-client";
import { getUserProjects, createProject } from "./actions";

if (typeof window !== "undefined") {
  import("@material/web/icon/icon.js");
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.4 } }
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      if (session?.user?.id) {
        setLoading(true);
        const data = await getUserProjects(session.user.id);
        setProjects(data);
        setLoading(false);
      }
    }
    loadProjects();
  }, [session?.user?.id]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!session?.user?.id || !newProjectName.trim()) return;
    
    setIsCreating(true);
    const result = await createProject(session.user.id, newProjectName.trim());
    
    if (result.success) {
      const data = await getUserProjects(session.user.id);
      setProjects(data);
      setShowModal(false);
      setNewProjectName("");
    } else {
      alert("Failed to create project");
    }
    setIsCreating(false);
  };

  return (
    <>
      <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full pt-8 px-4 md:px-0">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Projects</h1>
            <p className="text-sm text-text-secondary font-mono tracking-tight">Manage and configure your intelligent widgets.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-[0.97] shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2"
          >
            <md-icon style={{ fontSize: 18 }}>add</md-icon>
            New Project
          </button>
        </header>

        <motion.div 
          variants={container} 
          initial="hidden" 
          animate="show"
          className="bg-surface-glass backdrop-blur-xl border border-surface-border-strong rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-surface-border text-[11px] uppercase tracking-widest text-text-tertiary font-mono bg-bg-elevated/30">
            <div className="col-span-5">Project</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Sources</div>
            <div className="col-span-2 text-right">Updated</div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col divide-y divide-surface-border min-h-[200px]">
            {loading ? (
              <div className="px-6 py-12 text-center flex flex-col items-center justify-center gap-4 h-full text-text-secondary">
                <div className="w-6 h-6 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
                <p className="text-sm">Loading your projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="px-6 py-12 text-center text-text-secondary flex flex-col items-center gap-4">
                <md-icon style={{ fontSize: 32, color: 'var(--text-tertiary)' }}>folder_open</md-icon>
                <p>No projects found. Create your first intelligent widget.</p>
              </div>
            ) : (
              projects.map((project) => (
                <motion.div 
                  key={project.id}
                  variants={item}
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center group cursor-pointer hover:bg-surface-border/30 transition-colors"
                >
                  {/* Name & ID */}
                  <div className="col-span-5 flex flex-col gap-1">
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent-indigo transition-colors">{project.name}</span>
                    <span className="text-[11px] font-mono text-text-tertiary">{project.id.slice(0, 13)}...</span>
                  </div>

                  {/* Status Pill */}
                  <div className="col-span-3 flex items-center">
                    {project.status === 'ready' || project.status === 'active' ? (
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-[11px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        Ready
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo text-[11px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.15)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent-indigo/10 animate-pulse" />
                        <md-icon style={{ fontSize: 12 }} className="animate-spin relative z-10">sync</md-icon>
                        <span className="relative z-10">Processing</span>
                      </div>
                    )}
                  </div>

                  {/* Docs Count */}
                  <div className="col-span-2 text-right text-[13px] font-mono text-text-secondary">
                    {project.docsCount}
                  </div>

                  {/* Last Updated */}
                  <div className="col-span-2 text-right text-[13px] text-text-tertiary">
                    {project.lastUpdated}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Custom Glassmorphic Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isCreating && setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-surface-glass backdrop-blur-2xl border border-surface-border-strong rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <form onSubmit={handleCreateProject} className="flex flex-col">
                <div className="p-6 pb-4">
                  <h2 className="text-xl font-semibold text-text-primary mb-1">Create New Project</h2>
                  <p className="text-sm text-text-secondary">Set up a new intelligent widget for your workspace.</p>
                </div>
                
                <div className="p-6 pt-0 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">Project Name</label>
                    <input
                      type="text"
                      autoFocus
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g. My Portfolio AI"
                      className="w-full bg-bg-elevated text-text-primary border border-surface-border-strong rounded-xl px-4 py-3 outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/50 transition-all text-sm placeholder:text-text-tertiary"
                    />
                  </div>
                </div>

                <div className="p-4 bg-bg-elevated/50 border-t border-surface-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isCreating}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newProjectName.trim()}
                    className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-lg px-5 py-2 text-sm font-medium transition-all active:scale-[0.97] shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isCreating ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      "Create Project"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
