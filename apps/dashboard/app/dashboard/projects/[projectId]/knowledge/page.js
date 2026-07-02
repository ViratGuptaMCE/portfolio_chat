"use client";

import React, { useState, useRef, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../../../../../lib/auth-client";
import { 
  getDocuments, 
  getKnowledgeEntries, 
  createKnowledgeEntry, 
  uploadDocument,
  deleteDocument,
  deleteKnowledgeEntry 
} from "../../../actions";

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

  const loadData = async (silent = false) => {
    if (!session?.user?.id) return;
    if (!silent) setLoading(true);
    const [docs, ents] = await Promise.all([
      getDocuments(session.user.id, projectId),
      getKnowledgeEntries(session.user.id, projectId)
    ]);
    setDocuments(docs);
    setEntries(ents);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [session?.user?.id, projectId]);

  // Real-time polling when any document is in 'processing' status
  useEffect(() => {
    const hasProcessingDoc = documents.some(doc => doc.status === 'processing');
    if (!hasProcessingDoc) return;

    console.log("[UI POLL] Processing document detected. Starting real-time status polling...");
    const interval = setInterval(() => {
      loadData(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [documents, session?.user?.id, projectId]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !session?.user?.id) return;

    if (files.length > 1) {
      alert("Please select only 1 PDF file at a time.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const file = files[0];
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      alert("Only PDF files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File size exceeds the ${MAX_SIZE_MB}MB limit. Please select a smaller file.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    console.log(`[UI LOG] Selected 1 PDF file for upload: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadDocument(session.user.id, projectId, formData);
    console.log("[UI LOG] Upload server response:", res);

    if (res.success) {
      await loadData(true);
    } else {
      alert(res.error || "Failed to upload document");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
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
      await loadData(true);
    }
    setIsSavingText(false);
  };

  const handleDeleteDoc = async (id) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await deleteDocument(session.user.id, projectId, id);
      await loadData(true);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (confirm("Are you sure you want to delete this text entry?")) {
      await deleteKnowledgeEntry(session.user.id, projectId, id);
      await loadData(true);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-[#111] dark:text-[#f3f4f6]">
      {/* Local Tabs */}
      <div className="flex gap-4 border-b border-[#e5e5e5] dark:border-[#222] pb-px overflow-x-auto relative z-10">
        <button 
          onClick={() => setActiveTab("files")}
          className={`relative px-2 py-3 text-sm font-medium transition-colors ${activeTab === 'files' ? 'text-black dark:text-white font-semibold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}
        >
          Uploaded Files
          {activeTab === 'files' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("text")}
          className={`relative px-2 py-3 text-sm font-medium transition-colors ${activeTab === 'text' ? 'text-black dark:text-white font-semibold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}
        >
          Manual Text Entries
          {activeTab === 'text' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
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
              className="w-full bg-white dark:bg-[#111] border border-dashed border-[#ccc] dark:border-[#333] hover:border-black dark:hover:border-white rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-3xl text-black dark:text-white">cloud_upload</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-black dark:text-white">Upload PDF Document</h3>
                <p className="text-sm text-[#666] dark:text-[#888] font-mono mt-1">Single PDF file up to 5MB</p>
              </div>
              <button disabled={isUploading} className="mt-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Select PDF File"
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,application/pdf" 
                onChange={handleFileUpload}
              />
            </div>

            {/* Documents List */}
            <div className="bg-white dark:bg-[#111] rounded-[2rem] overflow-hidden border border-[#e5e5e5] dark:border-[#222] shadow-sm">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#e5e5e5] dark:border-[#222] text-[11px] uppercase tracking-widest text-[#888] font-mono bg-[#fafafa] dark:bg-[#151515]">
                <div className="col-span-5">File Name</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Chunks</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="flex flex-col divide-y divide-[#e5e5e5] dark:divide-[#222]">
                {loading ? (
                  <div className="px-6 py-12 text-center text-[#666] dark:text-[#888] flex items-center justify-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
                    Loading...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[#666] dark:text-[#888]">
                    No PDF documents uploaded yet.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <motion.div variants={item} key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#fafafa] dark:hover:bg-[#151515] transition-colors">
                      <div className="col-span-5 flex items-center gap-3 text-sm font-medium text-black dark:text-white">
                        <span className="material-symbols-outlined text-lg text-[#666] dark:text-[#888]">description</span>
                        <span className="truncate">{doc.fileName}</span>
                      </div>
                      <div className="col-span-3">
                        {doc.status === 'ready' || doc.status === 'active' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[11px] font-mono uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Ready
                          </div>
                        ) : doc.status === 'failed' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-mono uppercase tracking-widest">
                            <span className="material-symbols-outlined text-xs">error</span>
                            <span>Failed</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono uppercase tracking-widest">
                            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                            <span>Processing...</span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-[13px] font-mono text-[#666] dark:text-[#888]">
                        {doc.chunkCount}
                      </div>
                      <div className="col-span-2 text-right">
                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-[#888] hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-lg">delete</span>
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
            <form onSubmit={handleAddEntry} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-4 shadow-sm">
              <h3 className="text-lg font-semibold text-black dark:text-white">Add Knowledge Context</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Entry Title</label>
                <input
                  type="text"
                  value={newEntryTitle}
                  onChange={(e) => setNewEntryTitle(e.target.value)}
                  placeholder="e.g. Work Experience 2024"
                  required
                  className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-2.5 outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Raw Context Content</label>
                <textarea
                  value={newEntryContent}
                  onChange={(e) => setNewEntryContent(e.target.value)}
                  placeholder="Paste context here for the AI to learn..."
                  required
                  className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl p-4 min-h-[150px] outline-none focus:border-black dark:focus:border-white transition-colors resize-y text-sm"
                />
              </div>

              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  disabled={isSavingText}
                  className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingText ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">save</span>
                  )}
                  Save & Process
                </button>
              </div>
            </form>

            {/* Entries List */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading && entries.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#666] dark:text-[#888] flex justify-center items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
                  Loading...
                </div>
              )}
              {entries.map((entry) => (
                <motion.div variants={item} key={entry.id} className="bg-white dark:bg-[#111] p-5 rounded-[1.5rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-3 shadow-sm">
                  <header className="flex justify-between items-start gap-2">
                    <h4 className="text-base font-semibold text-black dark:text-white truncate">{entry.title}</h4>
                    {entry.status === 'ready' || entry.status === 'active' ? (
                      <div className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-mono uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Ready
                      </div>
                    ) : (
                      <div className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono uppercase tracking-widest">
                        <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                        <span>Processing</span>
                      </div>
                    )}
                  </header>
                  <p className="text-xs text-[#666] dark:text-[#888] font-mono">Processed into <span className="text-black dark:text-white font-bold">{entry.chunkCount}</span> vector chunks.</p>
                  <footer className="flex justify-end gap-2 mt-2 pt-2 border-t border-[#e5e5e5] dark:border-[#222]">
                    <button onClick={() => handleDeleteEntry(entry.id)} className="text-[#888] hover:text-red-500 px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-xs font-medium">
                      <span className="material-symbols-outlined text-sm">delete</span> Delete
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
