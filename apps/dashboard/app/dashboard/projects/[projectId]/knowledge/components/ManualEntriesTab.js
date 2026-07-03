"use client";

import React from "react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.4 } }
};

export default function ManualEntriesTab({
  entries,
  loading,
  CATEGORIES,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  newEntryTitle,
  setNewEntryTitle,
  newEntryCategory,
  setNewEntryCategory,
  newEntryTags,
  setNewEntryTags,
  newEntryContent,
  setNewEntryContent,
  isSavingText,
  handleAddEntry,
  handleStartEdit,
  setDeleteConfirmItem,
  expandedCardIds,
  toggleExpandCard,
  getCategoryMeta
}) {
  const filteredEntries = selectedCategoryFilter === "all"
    ? entries
    : entries.filter(e => (e.category || "other") === selectedCategoryFilter);

  return (
    <motion.div
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
            Tell us about you
          </h3>
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
  );
}
