"use client";

import React from "react";
import { motion } from "framer-motion";

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.4 } }
};

export default function UploadedFilesTab({
  documents,
  loading,
  isUploading,
  fileInputRef,
  handleFileUpload,
  setSelectedDocForView,
  setDeleteConfirmItem
}) {
  return (
    <motion.div
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
        <button
          disabled={isUploading}
          className="mt-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2"
        >
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
  );
}
