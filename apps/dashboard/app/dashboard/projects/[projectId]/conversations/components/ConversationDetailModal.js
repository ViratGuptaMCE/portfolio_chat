"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function FormattedMarkdown({ content }) {
  if (!content) return null;

  const blocks = content.split(/\n\n+/);

  return (
    <div className="flex flex-col gap-2 text-xs leading-relaxed text-black dark:text-[#eee]">
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').filter(Boolean);

        // Check if block is a bullet list
        const isBulletList = lines.length > 0 && lines.every(line => /^\s*[-*•]\s+/.test(line));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="list-disc list-inside flex flex-col gap-1 pl-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*[-*•]\s+/, '');
                return <li key={lIdx}>{renderFormattedInline(cleanLine)}</li>;
              })}
            </ul>
          );
        }

        // Check if block is a numbered list
        const isNumberedList = lines.length > 0 && lines.every(line => /^\s*\d+\.\s+/.test(line));
        if (isNumberedList) {
          return (
            <ol key={bIdx} className="list-decimal list-inside flex flex-col gap-1 pl-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*\d+\.\s+/, '');
                return <li key={lIdx}>{renderFormattedInline(cleanLine)}</li>;
              })}
            </ol>
          );
        }

        // Standard paragraph
        return (
          <p key={bIdx} className="whitespace-pre-wrap">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderFormattedInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderFormattedInline(text) {
  if (!text) return null;

  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} className="font-bold text-black dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} className="italic text-[#333] dark:text-[#ddd]">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-[#eaeaea] dark:bg-[#222] font-mono text-[11px] text-cyan-600 dark:text-cyan-400">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 dark:text-cyan-400 underline font-medium hover:opacity-80"
          >
            {match[1]}
          </a>
        );
      }
    }

    return part;
  });
}

export default function ConversationDetailModal({
  selectedSession,
  conversationDetails,
  loadingDetails,
  onClose,
  onToggleFlag
}) {
  const [expandedSources, setExpandedSources] = useState({});
  const [expandedChunks, setExpandedChunks] = useState({});
  const [copiedState, setCopiedState] = useState(false);

  if (!selectedSession) return null;

  const toggleSourceExpand = (msgId) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleChunkExpand = (chunkKey) => {
    setExpandedChunks((prev) => ({ ...prev, [chunkKey]: !prev[chunkKey] }));
  };

  const handleCopyTranscript = () => {
    if (!conversationDetails || !conversationDetails.messages) return;
    const text = conversationDetails.messages
      .map((m) => `[${m.role.toUpperCase()}] (${m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}):\n${m.content}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleExportJson = () => {
    if (!conversationDetails) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversationDetails, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `session-${selectedSession.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.25 }}
        className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] p-6 w-full max-w-4xl shadow-2xl flex flex-col gap-5 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#e5e5e5] dark:border-[#222]">
          <div className="flex flex-col gap-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-black dark:text-white">
                forum
              </span>
              <h3 className="text-lg font-bold text-black dark:text-white font-mono truncate">
                Session: {selectedSession.id}
              </h3>
              {selectedSession.isFlagged && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">flag</span>
                  Flagged
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#666] dark:text-[#888]">
              <span>Date: {selectedSession.formattedDate} ({selectedSession.formattedTime})</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  {selectedSession.source === "api" ? "terminal" : "language"}
                </span>
                Source: <strong className="text-black dark:text-white uppercase">{selectedSession.source}</strong>
              </span>
              <span>•</span>
              <span>Turns: <strong className="text-black dark:text-white">{selectedSession.turnCount}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFlag(selectedSession.id, !selectedSession.isFlagged)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedSession.isFlagged
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "border-[#e5e5e5] dark:border-[#333] text-[#666] dark:text-[#aaa] hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a]"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {selectedSession.isFlagged ? "flag" : "outlined_flag"}
              </span>
              {selectedSession.isFlagged ? "Flagged" : "Flag"}
            </button>

            <button
              onClick={handleCopyTranscript}
              className="px-3 py-1.5 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-medium text-black dark:text-white hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">
                {copiedState ? "check" : "content_copy"}
              </span>
              {copiedState ? "Copied" : "Copy"}
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-medium text-black dark:text-white hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              JSON
            </button>

            <button
              onClick={onClose}
              className="text-[#888] hover:text-black dark:hover:text-white p-1.5 rounded-xl hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a] transition-colors ml-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[60vh] flex flex-col gap-4 pr-1">
          {loadingDetails ? (
            <div className="py-20 text-center text-[#666] dark:text-[#888] flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
              <span className="text-xs font-mono">Loading full conversation transcript...</span>
            </div>
          ) : !conversationDetails || !conversationDetails.messages || conversationDetails.messages.length === 0 ? (
            <div className="py-20 text-center text-[#888] text-xs font-mono">
              No message transcript recorded for this session.
            </div>
          ) : (
            conversationDetails.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-2 p-4 rounded-2xl border ${
                  msg.role === "user"
                    ? "bg-[#f4f4f5] dark:bg-[#18181b] border-[#e4e4e7] dark:border-[#27272a] ml-8 md:ml-16"
                    : "bg-white dark:bg-[#09090b] border-[#e5e5e5] dark:border-[#222] mr-8 md:mr-16"
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#e5e5e5]/60 dark:border-[#222] pb-2 text-[11px] font-mono text-[#888]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        msg.role === "user"
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {msg.role === "user" ? "Visitor Question" : "AI Assistant"}
                    </span>
                    {msg.latencyMs && (
                      <span>Latency: <strong className="text-black dark:text-white">{msg.latencyMs}ms</strong></span>
                    )}
                  </div>
                  <span>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                {/* Formatted Markdown Message Output */}
                <div className="pt-1 select-text">
                  <FormattedMarkdown content={msg.content} />
                </div>

                {/* Retrieved Vector Chunks Drawer (for Assistant Replies) */}
                {msg.role === "assistant" && msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#e5e5e5]/60 dark:border-[#1f1f23] flex flex-col gap-2">
                    <button
                      onClick={() => toggleSourceExpand(msg.id)}
                      className="text-[11px] font-mono text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer w-fit"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {expandedSources[msg.id] ? "expand_less" : "expand_more"}
                      </span>
                      <span>
                        Retrieved Context Sources ({msg.sources.length} chunks)
                      </span>
                    </button>

                    <AnimatePresence>
                      {expandedSources[msg.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-2 overflow-hidden pt-1"
                        >
                          {msg.sources.map((src, idx) => {
                            const chunkKey = `${msg.id}-${idx}`;
                            const isChunkExpanded = expandedChunks[chunkKey];

                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] text-[11px] flex flex-col gap-1.5"
                              >
                                <div className="flex items-center justify-between text-[#888] font-mono">
                                  <span className="font-semibold text-black dark:text-white truncate max-w-[70%]">
                                    Source: {src.source || src.category || "Knowledge Base"}
                                  </span>
                                  {src.score && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      Score: {(src.score * 100).toFixed(1)}%
                                    </span>
                                  )}
                                </div>

                                {src.text ? (
                                  <div className="flex flex-col gap-1">
                                    <div className={`select-text ${isChunkExpanded ? '' : 'line-clamp-3'}`}>
                                      <FormattedMarkdown content={src.text} />
                                    </div>
                                    {src.text.length > 180 && (
                                      <button
                                        onClick={() => toggleChunkExpand(chunkKey)}
                                        className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline w-fit cursor-pointer mt-0.5"
                                      >
                                        {isChunkExpanded ? "Show less" : "Show full chunk"}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[#888] font-mono italic text-[10px]">
                                    [Category: {src.category || 'general'}]
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-[#e5e5e5] dark:border-[#222]">
          <div className="text-xs font-mono text-[#888]">
            {conversationDetails?.messages ? `${conversationDetails.messages.length} messages total` : ''}
          </div>
          <button
            onClick={onClose}
            className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-6 py-2 text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
