"use client";

import React, { useState, useRef, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../../../../../lib/auth-client";
import { 
  getDocuments, 
  getKnowledgeEntries, 
  getWebsiteSources,
  getQuotaUsage,
  createKnowledgeEntry, 
  updateKnowledgeEntry,
  uploadDocument,
  addWebsiteSource,
  deleteDocument,
  deleteKnowledgeEntry,
  deleteWebsiteSource
} from "../../../actions";

import UploadedFilesTab from "./components/UploadedFilesTab";
import ManualEntriesTab from "./components/ManualEntriesTab";
import WebsiteUrlsTab from "./components/WebsiteUrlsTab";

const CATEGORIES = [
  { id: "work_experience", label: "Work Experience", icon: "work" },
  { id: "projects", label: "Projects & Portfolio", icon: "code" },
  { id: "skills", label: "Skills & Tech Stack", icon: "psychology" },
  { id: "education", label: "Education & Certifications", icon: "school" },
  { id: "bio", label: "Bio & Contact Info", icon: "person" },
  { id: "other", label: "Other / General", icon: "description" },
];

export default function KnowledgeBasePage({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState("files"); // 'files' | 'text' | 'websites'
  const [isUploading, setIsUploading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [entries, setEntries] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [quota, setQuota] = useState(null);

  // Category Filter for Text Entries
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
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null); // { type: 'document' | 'entry' | 'website', id: string, title: string }
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [copiedDeleteId, setCopiedDeleteId] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Notification State
  const [notification, setNotification] = useState(null); // { type: 'error' | 'success', message: string }

  // Expanded Content Card IDs
  const [expandedCardIds, setExpandedCardIds] = useState({});

  const loadData = async (silent = false) => {
    if (!session?.user?.id) return;
    if (!silent) setLoading(true);
    const [docs, ents, webs, qData] = await Promise.all([
      getDocuments(session.user.id, projectId),
      getKnowledgeEntries(session.user.id, projectId),
      getWebsiteSources(session.user.id, projectId),
      getQuotaUsage(session.user.id, projectId)
    ]);
    setDocuments(docs || []);
    setEntries(ents || []);
    setWebsites(webs || []);
    setQuota(qData || null);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [session?.user?.id, projectId]);

  // Real-time polling when any item is in 'processing' / 'pending' / 'scraping' status
  const hasProcessingItem = 
    documents.some(doc => doc.status === 'processing' || doc.status === 'pending' || doc.status === 'scraping') ||
    entries.some(entry => entry.status === 'processing' || entry.status === 'pending' || entry.status === 'scraping') ||
    websites.some(web => web.status === 'processing' || web.status === 'pending' || web.status === 'scraping');

  useEffect(() => {
    if (!hasProcessingItem) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 1200);

    return () => clearInterval(interval);
  }, [hasProcessingItem, session?.user?.id, projectId]);

  // Handlers
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
      setNotification({ type: 'error', message: `File size exceeds the ${MAX_SIZE_MB}MB limit.` });
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

  const handleAddWebsite = async (url, title = null, content = null) => {
    if (!url || !session?.user?.id) return;
    setIsScraping(true);
    setNotification(null);

    const res = await addWebsiteSource(session.user.id, projectId, url, title, content);
    if (res.success) {
      setNotification({
        type: 'success',
        message: content 
          ? `GitHub README successfully saved and indexed into project vector DB!` 
          : `Website content successfully scraped and indexed into project vector DB!`
      });
      await loadData(true);
    } else {
      setNotification({ type: 'error', message: res.error || "Failed to crawl website URL" });
    }
    setIsScraping(false);
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
    if (deleteConfirmInput.trim() !== deleteConfirmItem.id) {
      setNotification({ type: 'error', message: "ID mismatch. Deletion cancelled." });
      return;
    }

    setIsDeleting(true);
    try {
      if (deleteConfirmItem.type === 'document') {
        await deleteDocument(session.user.id, projectId, deleteConfirmItem.id);
      } else if (deleteConfirmItem.type === 'entry') {
        await deleteKnowledgeEntry(session.user.id, projectId, deleteConfirmItem.id);
      } else if (deleteConfirmItem.type === 'website') {
        await deleteWebsiteSource(session.user.id, projectId, deleteConfirmItem.id);
      }
      await loadData(true);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || "Failed to delete item" });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmItem(null);
      setDeleteConfirmInput("");
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

      {/* Quota & Capacity Usage Card */}
      {quota && (
        <div className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-black dark:text-white">
                pie_chart
              </span>
              <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider font-mono">
                Free Tier Quota & Capacity Usage
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#888]">
              Daily limits reset at 00:00 UTC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PDF Quota */}
            <div className="p-3.5 rounded-2xl bg-[#fafafa] dark:bg-[#09090b] border border-[#e5e5e5]/80 dark:border-[#1f1f23] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-black dark:text-white">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  PDF Uploads
                </span>
                <span className="font-mono text-[11px] text-[#666] dark:text-[#aaa]">
                  {quota.pdf.dailyUsed}/{quota.pdf.dailyLimit} Today
                </span>
              </div>
              <div className="w-full bg-[#eaeaea] dark:bg-[#1f1f23] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-black dark:bg-white h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (quota.pdf.dailyUsed / quota.pdf.dailyLimit) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-[#888]">
                <span>Chunk Storage</span>
                <span className="font-semibold text-black dark:text-white">{quota.pdf.chunksUsed} / {quota.pdf.chunksLimit} chunks</span>
              </div>
            </div>

            {/* Knowledge Entries Quota */}
            <div className="p-3.5 rounded-2xl bg-[#fafafa] dark:bg-[#09090b] border border-[#e5e5e5]/80 dark:border-[#1f1f23] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-black dark:text-white">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">edit_note</span>
                  Knowledge Entries
                </span>
                <span className="font-mono text-[11px] text-[#666] dark:text-[#aaa]">
                  {quota.knowledge.dailyUsed}/{quota.knowledge.dailyLimit} Today
                </span>
              </div>
              <div className="w-full bg-[#eaeaea] dark:bg-[#1f1f23] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-black dark:bg-white h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (quota.knowledge.dailyUsed / quota.knowledge.dailyLimit) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-[#888]">
                <span>Chunk Storage</span>
                <span className="font-semibold text-black dark:text-white">{quota.knowledge.chunksUsed} / {quota.knowledge.chunksLimit} chunks</span>
              </div>
            </div>

            {/* Web & GitHub Imports Quota */}
            <div className="p-3.5 rounded-2xl bg-[#fafafa] dark:bg-[#09090b] border border-[#e5e5e5]/80 dark:border-[#1f1f23] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-black dark:text-white">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">language</span>
                  Web & GitHub URLs
                </span>
                <span className="font-mono text-[11px] text-[#666] dark:text-[#aaa]">
                  {quota.web.dailyUsed}/{quota.web.dailyLimit} Today
                </span>
              </div>
              <div className="w-full bg-[#eaeaea] dark:bg-[#1f1f23] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-black dark:bg-white h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (quota.web.dailyUsed / quota.web.dailyLimit) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-[#888]">
                <span>Stored: {quota.web.urlsStored}/{quota.web.urlsLimit}</span>
                <span className="font-semibold text-black dark:text-white">{quota.web.chunksUsed} / {quota.web.chunksLimit} chunks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modular Section Tabs */}
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
          Manual Entries ({entries.length})
          {activeTab === 'text' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("websites")}
          className={`relative px-2 py-3 text-sm font-medium transition-colors ${activeTab === 'websites' ? 'text-black dark:text-white font-semibold' : 'text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white'}`}
        >
          Website URLs ({websites.length})
          {activeTab === 'websites' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === "files" && (
          <UploadedFilesTab
            key="files"
            documents={documents}
            loading={loading}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            setSelectedDocForView={setSelectedDocForView}
            setDeleteConfirmItem={setDeleteConfirmItem}
          />
        )}

        {activeTab === "text" && (
          <ManualEntriesTab
            key="text"
            entries={entries}
            loading={loading}
            CATEGORIES={CATEGORIES}
            selectedCategoryFilter={selectedCategoryFilter}
            setSelectedCategoryFilter={setSelectedCategoryFilter}
            newEntryTitle={newEntryTitle}
            setNewEntryTitle={setNewEntryTitle}
            newEntryCategory={newEntryCategory}
            setNewEntryCategory={setNewEntryCategory}
            newEntryTags={newEntryTags}
            setNewEntryTags={setNewEntryTags}
            newEntryContent={newEntryContent}
            setNewEntryContent={setNewEntryContent}
            isSavingText={isSavingText}
            handleAddEntry={handleAddEntry}
            handleStartEdit={handleStartEdit}
            setDeleteConfirmItem={setDeleteConfirmItem}
            expandedCardIds={expandedCardIds}
            toggleExpandCard={toggleExpandCard}
            getCategoryMeta={getCategoryMeta}
          />
        )}

        {activeTab === "websites" && (
          <WebsiteUrlsTab
            key="websites"
            websites={websites}
            loading={loading}
            isScraping={isScraping}
            handleAddWebsite={handleAddWebsite}
            setSelectedDocForView={setSelectedDocForView}
            setDeleteConfirmItem={setDeleteConfirmItem}
          />
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

              <div className="flex items-center gap-4 text-xs font-mono text-[#666] dark:text-[#888] border-y border-[#e5e5e5] dark:border-[#222] py-2.5">
                <div>Length: <span className="text-black dark:text-white font-semibold">{selectedDocForView.extractedText?.length || 0}</span> chars</div>
                <div>•</div>
                <div>Chunks: <span className="text-black dark:text-white font-semibold">{selectedDocForView.chunkCount || 0}</span></div>
                <div>•</div>
                <div>Status: <span className="text-green-600 dark:text-green-400 font-semibold uppercase">{selectedDocForView.status}</span></div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[55vh] bg-[#fafafa] dark:bg-[#080808] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#333] font-mono text-xs text-[#222] dark:text-[#ddd] whitespace-pre-wrap leading-relaxed select-text">
                {selectedDocForView.extractedText || "(No extracted text content found)"}
              </div>

              <div className="flex justify-between items-center pt-2">
                <div />
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
                    Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal with ID Typing Verification */}
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
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    Delete {deleteConfirmItem.type === 'document' ? 'Document' : deleteConfirmItem.type === 'website' ? 'Website Source' : 'Knowledge Entry'}?
                  </h3>
                  <p className="text-xs text-[#666] dark:text-[#999] leading-relaxed">
                    You are deleting <span className="font-semibold text-black dark:text-white">"{deleteConfirmItem.title}"</span>. This will permanently remove its vector embeddings and context.
                  </p>
                </div>
              </div>

              {/* Target ID Display & Non-Pastable Input */}
              <div className="flex flex-col gap-2 bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222] p-4 rounded-2xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#888]">
                    Target {deleteConfirmItem.type === 'document' ? 'documentId' : deleteConfirmItem.type === 'website' ? 'websiteId' : 'knowledgeId'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(deleteConfirmItem.id);
                      setCopiedDeleteId(true);
                      setTimeout(() => setCopiedDeleteId(false), 2000);
                    }}
                    className="text-[10px] font-mono text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white flex items-center gap-1 bg-[#eaeaea] dark:bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#ddd] dark:border-[#333] transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">{copiedDeleteId ? 'check' : 'content_copy'}</span>
                    {copiedDeleteId ? 'Copied' : 'Copy ID'}
                  </button>
                </div>

                <div className="font-mono text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl break-all select-all font-semibold">
                  {deleteConfirmItem.id}
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-xs text-black dark:text-white font-medium">
                    Type the exact {deleteConfirmItem.type === 'document' ? 'documentId' : deleteConfirmItem.type === 'website' ? 'websiteId' : 'knowledgeId'} below to confirm deletion:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    placeholder="Type ID here..."
                    className="w-full bg-white dark:bg-[#151515] border border-[#ccc] dark:border-[#333] text-black dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-red-500 transition-colors select-none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <span className="text-[10px] text-[#888] font-mono italic">
                    * Copy-pasting into this input is disabled. ID must be typed manually.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0f0f0] dark:border-[#222]">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setDeleteConfirmItem(null);
                    setDeleteConfirmInput("");
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#666] dark:text-[#aaa] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f1f] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || deleteConfirmInput.trim() !== deleteConfirmItem.id}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 transition-all shadow-md hover:shadow-red-500/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
