"use client";

import React, { useState, useRef, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../../../../../lib/auth-client";
import { 
  getDocuments, 
  getKnowledgeEntries, 
  createKnowledgeEntry, 
  mockUploadDocument,
  deleteDocument,
  deleteKnowledgeEntry 
} from "../../../actions";

if (typeof window !== "undefined") {
  import("@material/web/icon/icon.js");
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.4 } }
};

export default function KnowledgeBasePage({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState("files"); // 'files' | 'text'
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [entries, setEntries] = useState([]);

  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryContent, setNewEntryContent] = useState("");
  const [isSavingText, setIsSavingText] = useState(false);

  const loadData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const [docs, ents] = await Promise.all([
      getDocuments(session.user.id, projectId),
      getKnowledgeEntries(session.user.id, projectId)
    ]);
    setDocuments(docs);
    setEntries(ents);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [session?.user?.id, projectId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !session?.user?.id) return;

    setIsUploading(true);
    // Use server action to mock upload for now
    const res = await mockUploadDocument(session.user.id, projectId, file.name);
    if (res.success) {
      await loadData();
    }
    setIsUploading(false);
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntryTitle || !newEntryContent || !session?.user?.id) return;

    setIsSavingText(true);
    const res = await createKnowledgeEntry(session.user.id, projectId, {
      title: newEntryTitle,
      content: newEntryContent
    });
    
    if (res.success) {
      setNewEntryTitle("");
      setNewEntryContent("");
      await loadData();
    }
    setIsSavingText(false);
  };

  const handleDeleteDoc = async (id) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await deleteDocument(session.user.id, projectId, id);
      await loadData();
    }
  };

  const handleDeleteEntry = async (id) => {
    if (confirm("Are you sure you want to delete this text entry?")) {
      await deleteKnowledgeEntry(session.user.id, projectId, id);
      await loadData();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Local Tabs */}
      <div className="flex gap-4 border-b border-surface-border pb-px overflow-x-auto relative z-10">
        <button 
          onClick={() => setActiveTab("files")}
          className={`relative px-2 py-3 text-sm font-medium transition-colors ${activeTab === 'files' ? 'text-accent-indigo' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Uploaded Files
          {activeTab === 'files' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-indigo shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("text")}
          className={`relative px-2 py-3 text-sm font-medium transition-colors ${activeTab === 'text' ? 'text-accent-indigo' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Manual Text Entries
          {activeTab === 'text' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-indigo shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "files" ? (
          <motion.div 
            key="files"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Upload Zone */}
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="w-full bg-surface-glass backdrop-blur-md border border-dashed border-surface-border-strong hover:border-accent-indigo hover:bg-accent-indigo/5 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.99] group"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-border/50 flex items-center justify-center group-hover:bg-accent-indigo/20 transition-colors">
                <md-icon style={{ fontSize: 32, color: 'var(--accent-indigo)' }}>cloud_upload</md-icon>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-text-primary">Upload Document</h3>
                <p className="text-sm text-text-secondary font-mono mt-1">PDF, TXT, or MD up to 10MB</p>
              </div>
              <button disabled={isUploading} className="mt-2 bg-accent-indigo/10 text-accent-indigo hover:bg-accent-indigo hover:text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors border border-accent-indigo/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] flex items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin group-hover:border-white group-hover:border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  "Browse Files"
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt,.md" 
                onChange={handleFileUpload}
              />
            </div>

            {/* Documents List */}
            <div className="bg-surface-glass backdrop-blur-md rounded-2xl overflow-hidden border border-surface-border shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-surface-border text-[11px] uppercase tracking-widest text-text-tertiary font-mono bg-bg-elevated/30">
                <div className="col-span-5">File Name</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Chunks</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="flex flex-col divide-y divide-surface-border">
                {loading ? (
                  <div className="px-6 py-12 text-center text-text-secondary flex items-center justify-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
                    Loading...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="px-6 py-12 text-center text-text-secondary">
                    No documents uploaded yet.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <motion.div variants={item} key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-border/30 transition-colors">
                      <div className="col-span-5 flex items-center gap-3 text-sm text-text-primary">
                        <md-icon style={{ color: "var(--accent-indigo)" }}>description</md-icon>
                        <span className="truncate">{doc.fileName}</span>
                      </div>
                      <div className="col-span-3">
                        {doc.status === 'ready' || doc.status === 'active' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-[11px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            Ready
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo text-[11px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.15)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-accent-indigo/10 animate-pulse" />
                            <md-icon style={{ fontSize: 12 }} className="animate-spin relative z-10">sync</md-icon>
                            <span className="relative z-10">Processing</span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-[13px] font-mono text-text-secondary">
                        {doc.chunkCount}
                      </div>
                      <div className="col-span-2 text-right">
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-text-tertiary hover:text-accent-pink transition-colors">
                          <md-icon style={{ fontSize: 18 }}>delete</md-icon>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Add Entry Form */}
            <form onSubmit={handleAddEntry} className="bg-surface-glass backdrop-blur-md p-6 rounded-3xl border border-surface-border flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <h3 className="text-lg font-medium text-text-primary">Add Knowledge Context</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">Entry Title</label>
                <input
                  type="text"
                  value={newEntryTitle}
                  onChange={(e) => setNewEntryTitle(e.target.value)}
                  placeholder="e.g. Work Experience 2024"
                  required
                  className="w-full bg-bg-elevated text-text-primary border border-surface-border-strong rounded-xl px-4 py-2.5 outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/50 transition-all text-sm placeholder:text-text-tertiary"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">Raw Context Content</label>
                <textarea
                  value={newEntryContent}
                  onChange={(e) => setNewEntryContent(e.target.value)}
                  placeholder="Paste context here for the AI to learn..."
                  required
                  className="w-full bg-bg-elevated text-text-primary border border-surface-border-strong rounded-xl p-4 min-h-[150px] outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/50 transition-all resize-y text-sm placeholder:text-text-tertiary"
                />
              </div>

              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  disabled={isSavingText}
                  className="bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.97] shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSavingText ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <md-icon style={{ fontSize: 18 }}>save</md-icon>
                  )}
                  Save & Process
                </button>
              </div>
            </form>

            {/* Entries List */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading && entries.length === 0 && (
                <div className="col-span-full py-12 text-center text-text-secondary flex justify-center items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
                  Loading...
                </div>
              )}
              {entries.map((entry) => (
                <motion.div variants={item} key={entry.id} className="bg-surface-glass backdrop-blur-md p-5 rounded-2xl border border-surface-border flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <header className="flex justify-between items-start gap-2">
                    <h4 className="text-base font-medium text-text-primary truncate">{entry.title}</h4>
                    {entry.status === 'ready' || entry.status === 'active' ? (
                      <div className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        Ready
                      </div>
                    ) : (
                      <div className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.15)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent-indigo/10 animate-pulse" />
                        <md-icon style={{ fontSize: 10 }} className="animate-spin relative z-10">sync</md-icon>
                        <span className="relative z-10">Processing</span>
                      </div>
                    )}
                  </header>
                  <p className="text-xs text-text-secondary font-mono">Processed into <span className="text-accent-indigo font-semibold">{entry.chunkCount}</span> vector chunks.</p>
                  <footer className="flex justify-end gap-2 mt-2 pt-2 border-t border-surface-border-strong">
                    <button onClick={() => handleDeleteEntry(entry.id)} className="text-text-tertiary hover:text-accent-pink px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-xs font-medium">
                      <md-icon style={{ fontSize: 14 }}>delete</md-icon> Delete
                    </button>
                  </footer>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
