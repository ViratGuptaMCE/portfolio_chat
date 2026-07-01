"use client";

import React, { useState, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";

if (typeof window !== "undefined") {
  import("@material/web/button/filled-button.js");
  import("@material/web/button/outlined-button.js");
  import("@material/web/button/text-button.js");
  import("@material/web/textfield/outlined-text-field.js");
  import("@material/web/icon/icon.js");
}

export default function KnowledgeBasePage({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;

  const [activeTab, setActiveTab] = useState("files"); // 'files' | 'text'
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Mock states
  const [documents, setDocuments] = useState([
    { id: "doc_1", name: "Resume_2024.pdf", status: "ready", chunks: 14, date: "2 days ago" }
  ]);
  const [entries, setEntries] = useState([
    { id: "ent_1", title: "Latest Side Project", status: "ready", chunks: 3, date: "1 day ago" }
  ]);

  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryContent, setNewEntryContent] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setDocuments([{
        id: `doc_${Date.now()}`,
        name: file.name,
        status: "processing",
        chunks: 0,
        date: "Just now"
      }, ...documents]);
      setIsUploading(false);
    }, 1500);
  };

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!newEntryTitle || !newEntryContent) return;

    setEntries([{
      id: `ent_${Date.now()}`,
      title: newEntryTitle,
      status: "processing",
      chunks: 0,
      date: "Just now"
    }, ...entries]);

    setNewEntryTitle("");
    setNewEntryContent("");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Local Tabs */}
      <div className="flex gap-4 border-b border-outline-variant/30 pb-2">
        <button 
          onClick={() => setActiveTab("files")}
          className={`text-title-medium font-medium pb-2 px-1 relative transition-colors ${activeTab === 'files' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Uploaded Files
          {activeTab === 'files' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-[-8px] left-0 right-0 h-1 bg-primary rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("text")}
          className={`text-title-medium font-medium pb-2 px-1 relative transition-colors ${activeTab === 'text' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Manual Text Entries
          {activeTab === 'text' && (
            <motion.div layoutId="kb-tab" className="absolute bottom-[-8px] left-0 right-0 h-1 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "files" ? (
          <motion.div 
            key="files"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Upload Zone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container/50 hover:bg-surface-container rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors"
            >
              <md-icon style={{ fontSize: 48, color: 'var(--md-sys-color-primary)' }}>cloud_upload</md-icon>
              <div className="text-center">
                <h3 className="text-title-large font-medium text-on-surface">Upload Document</h3>
                <p className="text-body-medium text-on-surface-variant mt-1">PDF, TXT, or Markdown up to 10MB</p>
              </div>
              <md-filled-button disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Browse Files'}
              </md-filled-button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt,.md" 
                onChange={handleFileUpload}
              />
            </div>

            {/* Documents List */}
            <div className="bg-surface-container-high rounded-3xl overflow-hidden border border-outline-variant/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="p-4 text-label-large text-on-surface-variant font-medium">File Name</th>
                    <th className="p-4 text-label-large text-on-surface-variant font-medium">Status</th>
                    <th className="p-4 text-label-large text-on-surface-variant font-medium">Chunks</th>
                    <th className="p-4 text-label-large text-on-surface-variant font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest transition-colors">
                      <td className="p-4 text-body-large text-on-surface flex items-center gap-3">
                        <md-icon style={{ color: "var(--md-sys-color-primary)" }}>description</md-icon>
                        {doc.name}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-label-small uppercase font-bold tracking-wider ${
                          doc.status === 'ready' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 text-body-medium text-on-surface-variant">{doc.chunks}</td>
                      <td className="p-4 text-right">
                        <md-text-button style={{ '--md-text-button-label-text-color': 'var(--md-sys-color-error)' }}>
                          Delete
                        </md-text-button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="text"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Add Entry Form */}
            <form onSubmit={handleAddEntry} className="bg-surface-container-high p-6 rounded-3xl border border-outline-variant/30 flex flex-col gap-4">
              <h3 className="text-title-large font-medium text-on-surface">Add Knowledge</h3>
              <md-outlined-text-field
                label="Title (e.g., Side Projects)"
                value={newEntryTitle}
                onInput={(e) => setNewEntryTitle(e.target.value)}
                required
                className="w-full"
              ></md-outlined-text-field>
              
              <div className="relative w-full">
                <textarea
                  className="w-full bg-surface-container text-on-surface border border-outline-variant rounded-xl p-4 min-h-[150px] outline-none focus:border-primary transition-colors resize-y"
                  placeholder="Paste or type raw text here... e.g., 'I built a Next.js app that got 500 users...'"
                  value={newEntryContent}
                  onChange={(e) => setNewEntryContent(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end mt-2">
                <md-filled-button type="submit">
                  Save & Process
                  <md-icon slot="icon">save</md-icon>
                </md-filled-button>
              </div>
            </form>

            {/* Entries List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.map((entry) => (
                <article key={entry.id} className="bg-surface-container p-5 rounded-3xl border border-outline-variant/30 flex flex-col gap-3">
                  <header className="flex justify-between items-start">
                    <h4 className="text-title-medium font-medium text-on-surface">{entry.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-label-small uppercase font-bold tracking-wider ${
                      entry.status === 'ready' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      {entry.status}
                    </span>
                  </header>
                  <p className="text-body-small text-on-surface-variant">Processed into {entry.chunks} vector chunks.</p>
                  <footer className="flex justify-end gap-2 mt-2">
                    <md-outlined-button>Edit</md-outlined-button>
                    <md-text-button style={{ '--md-text-button-label-text-color': 'var(--md-sys-color-error)' }}>Delete</md-text-button>
                  </footer>
                </article>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
