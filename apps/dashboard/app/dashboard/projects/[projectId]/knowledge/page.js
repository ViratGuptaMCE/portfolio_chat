"use client";

import React, { useState, useRef, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../../../../../lib/auth-client";
import { 
  getDocuments, 
  getKnowledgeEntries, 
  createKnowledgeEntry, 
  updateKnowledgeEntry,
  uploadDocument,
  deleteDocument,
  deleteKnowledgeEntry 
} from "../../../actions";

const CATEGORIES = [
  { id: "work_experience", label: "Work Experience", icon: "work" },
  { id: "projects", label: "Projects & Portfolio", icon: "code" },
  { id: "skills", label: "Skills & Tech Stack", icon: "psychology" },
  { id: "education", label: "Education & Certifications", icon: "school" },
  { id: "bio", label: "Bio & Contact Info", icon: "person" },
  { id: "other", label: "Other / General", icon: "description" },
];

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

  // Category Filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // New Entry Form State
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryCategory, setNewEntryCategory] = useState("work_experience");
  const [newEntryTags, setNewEntryTags] = useState("");
  const [newEntryContent, setNewEntryContent] = useState("");
  const [isSavingText, setIsSavingText] = useState(false);

  // Edit Entry State
  const [editingEntry, setEditingEntry] = useState(null);
  const [isUpdatingText, setIsUpdatingText] = useState(false);

  // View Parsed Extracted Text State
  const [selectedDocForView, setSelectedDocForView] = useState(null);
  const [copiedState, setCopiedState] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null); // { type: 'document' | 'entry', id: string, title: string }
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Notification State
  const [notification, setNotification] = useState(null); // { type: 'error' | 'success', message: string }

  // Expanded Content Card IDs
  const [expandedCardIds, setExpandedCardIds] = useState({});

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

  // Check if any document or knowledge entry is currently processing
  const hasProcessingItem = 
    documents.some(doc => doc.status === 'processing' || doc.status === 'pending') ||
    entries.some(entry => entry.status === 'processing' || entry.status === 'pending');

  // Real-time polling when any item is in 'processing' status
  useEffect(() => {
    if (!hasProcessingItem) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 1500);

    return () => clearInterval(interval);
  }, [hasProcessingItem, session?.user?.id, projectId]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !session?.user?.id) return;

    if (files.length > 1) {
      setNotification({ type: 'error', message: "Please select only 1 PDF file at a time." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const file = files[0];
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setNotification({ type: 'error', message: "Only PDF files are allowed." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setNotification({ type: 'error', message: `File size exceeds the ${MAX_SIZE_MB}MB limit. Please select a smaller file.` });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setNotification(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadDocument(session.user.id, projectId, formData);

    if (res.success) {
      await loadData(true);
    } else {
      setNotification({ type: 'error', message: res.error || "Failed to upload document" });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsUploading(false);
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntryTitle || !newEntryContent || !session?.user?.id) return;

    setIsSavingText(true);
    setNotification(null);

    const res = await createKnowledgeEntry(session.user.id, projectId, {
      title: newEntryTitle,
      category: newEntryCategory,
      tags: newEntryTags,
      content: newEntryContent
    });
    
    if (res.success) {
      setNewEntryTitle("");
      setNewEntryCategory("work_experience");
      setNewEntryTags("");
      setNewEntryContent("");
      await loadData(true);
    } else {
      setNotification({ type: 'error', message: res.error || "Failed to create knowledge entry" });
    }
    setIsSavingText(false);
  };

  const handleStartEdit = (entry) => {
    setEditingEntry({
      id: entry.id,
      title: entry.title || "",
      category: entry.category || "other",
      tags: Array.isArray(entry.tags) ? entry.tags.join(", ") : "",
      content: entry.content || ""
    });
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!editingEntry || !editingEntry.title || !editingEntry.content || !session?.user?.id) return;

    setIsUpdatingText(true);
    setNotification(null);

    const res = await updateKnowledgeEntry(session.user.id, projectId, editingEntry.id, {
      title: editingEntry.title,
      category: editingEntry.category,
      tags: editingEntry.tags,
      content: editingEntry.content
    });

    if (res.success) {
      setEditingEntry(null);
      await loadData(true);
    } else {
      setNotification({ type: 'error', message: res.error || "Failed to update entry" });
    }
    setIsUpdatingText(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem || !session?.user?.id) return;

    setIsDeleting(true);
    try {
      if (deleteConfirmItem.type === 'document') {
        await deleteDocument(session.user.id, projectId, deleteConfirmItem.id);
      } else {
        await deleteKnowledgeEntry(session.user.id, projectId, deleteConfirmItem.id);
      }
      await loadData(true);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || "Failed to delete item" });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmItem(null);
    }
  };

  const toggleExpandCard = (id) => {
    setExpandedCardIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const getCategoryMeta = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || { label: catId || "Other", icon: "description" };
  };

  const filteredEntries = selectedCategoryFilter === "all"
    ? entries
    : entries.filter(e => (e.category || "other") === selectedCategoryFilter);

  return (
    <div className="flex flex-col gap-8 text-[#111] dark:text-[#f3f4f6]">
      {/* Custom Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-medium ${
              notification.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                {notification.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{notification.message}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="hover:opacity-75 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Tabs */}
      <div className="flex gap-4 border-b border-[#e5e5e5] dark:border-[#222] pb-px overflow-x-auto relative z-10">
        <button 
          onClick={() => setActiveTab("files")}
          className={`relative px-2 py-3 text-sm font-medium transition-colors ${activeTab === 'files' ? 'text-black dark:text-white font-semibold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}
        >
          Uploaded Files ({documents.length})
          {activeTab === 'files' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("text")}
          className={`relative px-2 py-3 text-sm font-medium transition-colors ${activeTab === 'text' ? 'text-black dark:text-white font-semibold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}
        >
          Manual Text Entries ({entries.length})
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
                        <button
                          onClick={() => setSelectedDocForView(doc)}
                          title="Click to view parsed extracted text"
                          className="truncate hover:underline text-left text-black dark:text-white font-medium flex items-center gap-1.5 group cursor-pointer"
                        >
                          <span className="truncate">{doc.fileName}</span>
                          <span className="material-symbols-outlined text-base text-[#888] group-hover:text-black dark:group-hover:text-white transition-colors">visibility</span>
                        </button>
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
                      <div className="col-span-2 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedDocForView(doc)} 
                          title="View Parsed Extracted Text"
                          className="text-[#888] hover:text-black dark:hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmItem({ type: 'document', id: doc.id, title: doc.fileName })} 
                          title="Delete Document"
                          className="text-[#888] hover:text-red-500 transition-colors"
                        >
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
            {/* Add Knowledge Entry Form */}
            <form onSubmit={handleAddEntry} className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">post_add</span>
                  Add Knowledge Context Entry
                </h3>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Synced with TABLES.md</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Entry Title */}
                <div className="md:col-span-6 flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Entry Title *</label>
                  <input
                    type="text"
                    value={newEntryTitle}
                    onChange={(e) => setNewEntryTitle(e.target.value)}
                    placeholder="e.g. Senior Fullstack Engineer - Acme Corp"
                    required
                    className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-2.5 outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                  />
                </div>

                {/* Category Selector */}
                <div className="md:col-span-6 flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Category *</label>
                  <select
                    value={newEntryCategory}
                    onChange={(e) => setNewEntryCategory(e.target.value)}
                    className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-2.5 outline-none focus:border-black dark:focus:border-white transition-colors text-sm cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newEntryTags}
                  onChange={(e) => setNewEntryTags(e.target.value)}
                  placeholder="e.g. React, Next.js, System Architecture, Leadership"
                  className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-2.5 outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                />
              </div>

              {/* Content Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Raw Context Content *</label>
                <textarea
                  value={newEntryContent}
                  onChange={(e) => setNewEntryContent(e.target.value)}
                  placeholder="Detailed context, achievements, roles, project specifics, or bio details for your portfolio AI..."
                  required
                  className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl p-4 min-h-[140px] outline-none focus:border-black dark:focus:border-white transition-colors resize-y text-sm font-mono"
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
                  Save & Process Entry
                </button>
              </div>
            </form>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#888] shrink-0 mr-1">Filter:</span>
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  selectedCategoryFilter === "all"
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                    : "bg-[#f4f4f5] dark:bg-[#1f1f23] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
                }`}
              >
                All ({entries.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = entries.filter(e => (e.category || "other") === cat.id).length;
                if (count === 0 && selectedCategoryFilter !== cat.id) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                      selectedCategoryFilter === cat.id
                        ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                        : "bg-[#f4f4f5] dark:bg-[#1f1f23] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Entries Grid */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading && entries.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#666] dark:text-[#888] flex justify-center items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
                  Loading entries...
                </div>
              )}
              {!loading && filteredEntries.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#666] dark:text-[#888] bg-white dark:bg-[#111] rounded-[2rem] border border-[#e5e5e5] dark:border-[#222]">
                  No entries found in this category.
                </div>
              )}
              {filteredEntries.map((entry) => {
                const catMeta = getCategoryMeta(entry.category);
                const isExpanded = !!expandedCardIds[entry.id];
                const contentText = entry.content || "";
                const isLongContent = contentText.length > 180;
                const displayContent = (isLongContent && !isExpanded) 
                  ? contentText.slice(0, 180) + "..." 
                  : contentText;

                return (
                  <motion.div variants={item} key={entry.id} className="bg-white dark:bg-[#111] p-5 rounded-[1.5rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-3 shadow-sm hover:border-[#ccc] dark:hover:border-[#333] transition-colors">
                    {/* Entry Card Header */}
                    <header className="flex justify-between items-start gap-2">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f4f4f5] dark:bg-[#1f1f23] text-black dark:text-white text-[10px] font-medium uppercase tracking-wider border border-[#e5e5e5] dark:border-[#333]">
                            <span className="material-symbols-outlined text-xs">{catMeta.icon}</span>
                            {catMeta.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#888] bg-[#f4f4f5] dark:bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#e5e5e5] dark:border-[#222]">
                            v{entry.version || 1}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-black dark:text-white truncate mt-0.5">{entry.title}</h4>
                      </div>

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

                    {/* Tags Chips */}
                    {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f0f0f2] dark:bg-[#1a1a1c] text-[#555] dark:text-[#aaa] border border-[#e0e0e2] dark:border-[#2a2a2e]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="text-xs text-[#444] dark:text-[#bbb] font-mono whitespace-pre-wrap leading-relaxed bg-[#fafafa] dark:bg-[#0a0a0a] p-3 rounded-xl border border-[#eaeaea] dark:border-[#222]">
                      {displayContent}
                      {isLongContent && (
                        <button 
                          onClick={() => toggleExpandCard(entry.id)} 
                          className="ml-1 text-black dark:text-white font-semibold underline hover:no-underline text-[11px]"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>

                    {/* Card Footer */}
                    <footer className="flex justify-between items-center gap-2 mt-1 pt-2 border-t border-[#e5e5e5] dark:border-[#222]">
                      <span className="text-xs text-[#666] dark:text-[#888] font-mono">
                        <span className="text-black dark:text-white font-bold">{entry.chunkCount}</span> {entry.chunkCount === 1 ? "chunk" : "chunks"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStartEdit(entry)} 
                          className="text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span> Edit
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmItem({ type: 'entry', id: entry.id, title: entry.title })} 
                          className="text-[#888] hover:text-red-500 px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span> Delete
                        </button>
                      </div>
                    </footer>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Parsed Extracted Text Reader Modal */}
      <AnimatePresence>
        {selectedDocForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] p-6 w-full max-w-3xl shadow-2xl flex flex-col gap-4 max-h-[90vh]"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#888] bg-[#f4f4f5] dark:bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#e5e5e5] dark:border-[#222]">
                      Read-Only Parsed Text
                    </span>
                    {selectedDocForView.fileSizeBytes && (
                      <span className="text-[10px] font-mono text-[#888]">
                        {(selectedDocForView.fileSizeBytes / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-black dark:text-white truncate flex items-center gap-2 mt-0.5">
                    <span className="material-symbols-outlined text-xl text-[#666] dark:text-[#888]">description</span>
                    {selectedDocForView.fileName}
                  </h3>
                </div>

                <button 
                  onClick={() => setSelectedDocForView(null)}
                  className="text-[#888] hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f23] transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Subheader info badges */}
              <div className="flex items-center gap-4 text-xs font-mono text-[#666] dark:text-[#888] border-y border-[#e5e5e5] dark:border-[#222] py-2.5">
                <div>Total Length: <span className="text-black dark:text-white font-semibold">{selectedDocForView.extractedText?.length || 0}</span> chars</div>
                <div>•</div>
                <div>Vector Chunks: <span className="text-black dark:text-white font-semibold">{selectedDocForView.chunkCount}</span></div>
                <div>•</div>
                <div>Status: <span className="text-green-600 dark:text-green-400 font-semibold uppercase">{selectedDocForView.status}</span></div>
              </div>

              {/* Read-only Extracted Text Code Block */}
              <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[55vh] bg-[#fafafa] dark:bg-[#080808] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#333] font-mono text-xs text-[#222] dark:text-[#ddd] whitespace-pre-wrap leading-relaxed select-text">
                {selectedDocForView.extractedText || "(No extracted text found for this document)"}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] font-mono text-[#888]">Select and copy text freely</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopyText(selectedDocForView.extractedText)}
                    className="px-4 py-2 rounded-xl bg-[#f4f4f5] dark:bg-[#1f1f23] text-black dark:text-white text-xs font-medium hover:bg-[#eaeaea] dark:hover:bg-[#2a2a2e] transition-colors flex items-center gap-1.5 border border-[#e5e5e5] dark:border-[#333]"
                  >
                    <span className="material-symbols-outlined text-sm">{copiedState ? "check" : "content_copy"}</span>
                    {copiedState ? "Copied!" : "Copy Text"}
                  </button>
                  <button 
                    onClick={() => setSelectedDocForView(null)}
                    className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-5 py-2 text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Entry Modal */}
      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">edit_note</span>
                  Edit Knowledge Entry
                </h3>
                <button 
                  onClick={() => setEditingEntry(null)}
                  className="text-[#888] hover:text-black dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateEntry} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Entry Title */}
                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Entry Title *</label>
                    <input
                      type="text"
                      value={editingEntry.title}
                      onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                      required
                      className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-2.5 outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                    />
                  </div>

                  {/* Category Selector */}
                  <div className="md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Category *</label>
                    <select
                      value={editingEntry.category}
                      onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                      className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-2.5 outline-none focus:border-black dark:focus:border-white transition-colors text-sm cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editingEntry.tags}
                    onChange={(e) => setEditingEntry({ ...editingEntry, tags: e.target.value })}
                    placeholder="e.g. React, Next.js, Architecture"
                    className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-2.5 outline-none focus:border-black dark:focus:border-white transition-colors text-sm"
                  />
                </div>

                {/* Content Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Raw Context Content *</label>
                  <textarea
                    value={editingEntry.content}
                    onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                    required
                    className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl p-4 min-h-[160px] outline-none focus:border-black dark:focus:border-white transition-colors resize-y text-sm font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-sm font-medium hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUpdatingText}
                    className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUpdatingText ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-lg">save</span>
                    )}
                    Update & Re-process (Bumps Version)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.2 }}
              className="bg-white dark:bg-[#111] border border-red-500/20 dark:border-red-500/30 rounded-[2rem] p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 relative overflow-hidden"
            >
              {/* Subtle red ambient glow backdrop */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    Delete {deleteConfirmItem.type === 'document' ? 'Document' : 'Knowledge Entry'}?
                  </h3>
                  <p className="text-xs text-[#666] dark:text-[#999] leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-black dark:text-white">"{deleteConfirmItem.title}"</span>? This will permanently remove its record, extracted text, and vector embeddings from Cloudflare Vectorize.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0f0f0] dark:border-[#222]">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#666] dark:text-[#aaa] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f1f] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 transition-all shadow-md hover:shadow-red-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
