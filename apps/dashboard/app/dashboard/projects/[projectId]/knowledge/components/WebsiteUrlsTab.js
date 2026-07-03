"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.4 } }
};

export default function WebsiteUrlsTab({
  websites,
  loading,
  isScraping,
  handleAddWebsite,
  setSelectedDocForView,
  setDeleteConfirmItem
}) {
  const [urlInput, setUrlInput] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    handleAddWebsite(urlInput);
    setUrlInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6"
    >
      {/* Website Submission Form */}
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-black dark:text-white">
                language
              </span>
              Crawl & Index Website URL
            </h3>
            <p className="text-xs text-[#666] dark:text-[#888]">
              The ideal site for scraping is one that serves its content
              directly in the initial HTML response, without relying on loaders,
              JavaScript rendering, or scroll‑triggered events.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://your-portfolio-website.com"
            required
            className="flex-1 bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors text-sm font-mono"
          />
          <button
            type="submit"
            disabled={isScraping || !urlInput.trim()}
            className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            {isScraping ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                <span>Crawling Website...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  travel_explore
                </span>
                <span>Crawl & Index URL</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Website Sources Table */}
      <div className="bg-white dark:bg-[#111] rounded-[2rem] overflow-hidden border border-[#e5e5e5] dark:border-[#222] shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#e5e5e5] dark:border-[#222] text-[11px] uppercase tracking-widest text-[#888] font-mono bg-[#fafafa] dark:bg-[#151515]">
          <div className="col-span-5">Website URL / Title</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Chunks</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="flex flex-col divide-y divide-[#e5e5e5] dark:divide-[#222]">
          {loading ? (
            <div className="px-6 py-12 text-center text-[#666] dark:text-[#888] flex items-center justify-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
              Loading indexed websites...
            </div>
          ) : websites.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#666] dark:text-[#888]">
              No website URLs indexed yet.
            </div>
          ) : (
            websites.map((web) => (
              <motion.div
                variants={item}
                key={web.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#fafafa] dark:hover:bg-[#151515] transition-colors"
              >
                <div className="col-span-5 flex items-center gap-3 text-sm font-medium text-black dark:text-white overflow-hidden">
                  <span className="material-symbols-outlined text-lg text-[#666] dark:text-[#888] shrink-0">
                    public
                  </span>
                  <div className="flex flex-col overflow-hidden text-left">
                    <button
                      onClick={() =>
                        setSelectedDocForView({
                          fileName: web.title || web.url,
                          extractedText: web.extractedText,
                          chunkCount: web.chunkCount,
                          status: web.status,
                        })
                      }
                      title="Click to view scraped text"
                      className="truncate hover:underline text-left text-black dark:text-white font-medium flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span className="truncate">{web.title || web.url}</span>
                      <span className="material-symbols-outlined text-base text-[#888] group-hover:text-black dark:group-hover:text-white transition-colors">
                        visibility
                      </span>
                    </button>
                    <a
                      href={web.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#888] hover:underline truncate"
                    >
                      {web.url}
                    </a>
                  </div>
                </div>
                <div className="col-span-3">
                  {web.status === "ready" || web.status === "active" ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[11px] font-mono uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Ready
                    </div>
                  ) : web.status === "failed" ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-mono uppercase tracking-widest">
                      <span className="material-symbols-outlined text-xs">
                        error
                      </span>
                      <span>Failed</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono uppercase tracking-widest">
                      <span className="material-symbols-outlined text-xs animate-spin">
                        sync
                      </span>
                      <span>Scraping...</span>
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-right text-[13px] font-mono text-[#666] dark:text-[#888]">
                  {web.chunkCount || 0}
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      setSelectedDocForView({
                        fileName: web.title || web.url,
                        extractedText: web.extractedText,
                        chunkCount: web.chunkCount,
                        status: web.status,
                      })
                    }
                    title="View Scraped Text"
                    className="text-[#888] hover:text-black dark:hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      visibility
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirmItem({
                        type: "website",
                        id: web.id,
                        title: web.title || web.url,
                      })
                    }
                    title="Delete Website Source"
                    className="text-[#888] hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
