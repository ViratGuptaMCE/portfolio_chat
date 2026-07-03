"use client";

import React, { useState, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../../../../../lib/auth-client";
import {
  getProjectConversations,
  getConversationDetails,
  toggleFlagConversation,
  deleteConversation
} from "../../../conversation-actions";
import ConversationDetailModal from "./components/ConversationDetailModal";

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.3 } }
};

export default function ConversationsPage({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState("all"); // 'all' | 'today' | '7days' | '30days'
  const [sourceFilter, setSourceFilter] = useState("all"); // 'all' | 'widget' | 'api'
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Conversation Detail State
  const [selectedSession, setSelectedSession] = useState(null);
  const [conversationDetails, setConversationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete Confirmation State
  const [deleteSessionTarget, setDeleteSessionTarget] = useState(null); // { id: string }
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState(null);

  const loadConversations = async (silent = false) => {
    if (!session?.user?.id) return;
    if (!silent) setLoading(true);

    const data = await getProjectConversations(session.user.id, projectId, {
      dateFilter,
      sourceFilter,
      searchQuery
    });

    setConversations(data || []);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadConversations();
  }, [session?.user?.id, projectId, dateFilter, sourceFilter, searchQuery]);

  const handleOpenDetails = async (sessionItem) => {
    setSelectedSession(sessionItem);
    setLoadingDetails(true);
    setConversationDetails(null);

    const details = await getConversationDetails(session.user.id, projectId, sessionItem.id);
    setConversationDetails(details);
    setLoadingDetails(false);
  };

  const handleToggleFlag = async (sessionId, flagged) => {
    if (!session?.user?.id) return;

    const res = await toggleFlagConversation(session.user.id, projectId, sessionId, flagged);
    if (res.success) {
      setConversations((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, isFlagged: flagged } : s))
      );
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession((prev) => ({ ...prev, isFlagged: flagged }));
      }
    } else {
      setNotification({ type: "error", message: res.error || "Failed to update flag" });
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!deleteSessionTarget || !session?.user?.id) return;

    setIsDeleting(true);
    const res = await deleteConversation(session.user.id, projectId, deleteSessionTarget.id);

    if (res.success) {
      setConversations((prev) => prev.filter((s) => s.id !== deleteSessionTarget.id));
      if (selectedSession && selectedSession.id === deleteSessionTarget.id) {
        setSelectedSession(null);
      }
      setNotification({ type: "success", message: "Conversation session deleted successfully." });
    } else {
      setNotification({ type: "error", message: res.error || "Failed to delete session" });
    }

    setIsDeleting(false);
    setDeleteSessionTarget(null);
  };

  // Group conversations by Date Group (e.g. 'Today', 'Yesterday', 'Earlier This Week', etc.)
  const groupedConversations = conversations.reduce((acc, curr) => {
    const group = curr.dateGroup || "Older Conversations";
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 text-[#111] dark:text-[#f3f4f6]">
      {/* Custom Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-medium ${
              notification.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                {notification.type === "error" ? "error" : "check_circle"}
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

      {/* Header Controls & Filter Bar */}
      <div className="bg-white dark:bg-[#111] p-5 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">forum</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-black dark:text-white">
              Conversation History
            </h2>
            <p className="text-xs text-[#666] dark:text-[#888]">
              Inspect visitor multi-turn sessions grouped chronologically by date.
            </p>
          </div>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#888]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or session ID..."
              className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white transition-colors font-mono"
            />
          </div>

          {/* Date Filter Dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer font-mono"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>

          {/* Source Filter Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white transition-colors cursor-pointer font-mono"
          >
            <option value="all">All Sources</option>
            <option value="widget">Widget (Browser)</option>
            <option value="api">Headless API</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => loadConversations(false)}
            title="Refresh Conversations"
            className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#333] hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a] transition-colors text-black dark:text-white flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">sync</span>
          </button>
        </div>
      </div>

      {/* Date-Grouped Conversations List */}
      <div className="flex flex-col gap-8">
        {loading ? (
          <div className="bg-white dark:bg-[#111] rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] p-16 text-center text-[#666] dark:text-[#888] flex items-center justify-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
            <span className="text-sm font-mono">Loading conversation history...</span>
          </div>
        ) : Object.keys(groupedConversations).length === 0 ? (
          <div className="bg-white dark:bg-[#111] rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] p-16 text-center text-[#888] flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-[#bbb] dark:text-[#444]">
              forum
            </span>
            <p className="text-sm font-medium">No conversation sessions found matching your criteria.</p>
            <span className="text-xs font-mono text-[#aaa]">
              Sessions are recorded automatically when visitors interact with your widget or API endpoint.
            </span>
          </div>
        ) : (
          Object.entries(groupedConversations).map(([dateGroup, sessionList]) => (
            <div key={dateGroup} className="flex flex-col gap-4">
              {/* Date Group Header */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg text-black dark:text-white">
                  calendar_today
                </span>
                <h3 className="text-sm font-bold text-black dark:text-white font-mono uppercase tracking-wider">
                  {dateGroup}
                </h3>
                <div className="h-px bg-[#e5e5e5] dark:bg-[#222] flex-1" />
                <span className="text-xs font-mono text-[#888] px-2.5 py-0.5 rounded-full bg-[#fafafa] dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#222]">
                  {sessionList.length} {sessionList.length === 1 ? "session" : "sessions"}
                </span>
              </div>

              {/* Sessions Grid */}
              <div className="grid grid-cols-1 gap-3">
                {sessionList.map((sessionItem) => (
                  <motion.div
                    variants={item}
                    key={sessionItem.id}
                    className="bg-white dark:bg-[#111] p-5 rounded-[1.5rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-black dark:hover:border-white transition-all shadow-sm group"
                  >
                    {/* Session Overview */}
                    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            sessionItem.source === "api"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {sessionItem.source === "api" ? "terminal" : "language"}
                          </span>
                          {sessionItem.source}
                        </span>

                        <span className="text-xs font-mono font-semibold text-black dark:text-white truncate">
                          {sessionItem.id}
                        </span>

                        <span className="text-xs font-mono text-[#888]">
                          {sessionItem.formattedTime}
                        </span>

                        {sessionItem.isFlagged && (
                          <span className="text-amber-500 flex items-center gap-0.5 text-xs font-mono font-semibold">
                            <span className="material-symbols-outlined text-sm">flag</span>
                            Flagged
                          </span>
                        )}
                      </div>

                      {/* Question Preview */}
                      <div className="text-xs text-[#444] dark:text-[#ccc] font-medium line-clamp-2 leading-relaxed">
                        "{sessionItem.firstQuestionPreview}"
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#e5e5e5]/60 dark:border-[#222]">
                      <span className="px-2.5 py-1 rounded-xl bg-[#fafafa] dark:bg-[#18181b] border border-[#e5e5e5] dark:border-[#27272a] text-xs font-mono text-[#666] dark:text-[#aaa]">
                        {sessionItem.turnCount} {sessionItem.turnCount === 1 ? "turn" : "turns"}
                      </span>

                      <button
                        onClick={() => handleOpenDetails(sessionItem)}
                        className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-4 py-2 text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">
                          chat
                        </span>
                        <span>View Transcript</span>
                      </button>

                      <button
                        onClick={() => handleToggleFlag(sessionItem.id, !sessionItem.isFlagged)}
                        title={sessionItem.isFlagged ? "Unflag" : "Flag for Review"}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          sessionItem.isFlagged
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            : "border-[#e5e5e5] dark:border-[#333] text-[#888] hover:text-black dark:hover:text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {sessionItem.isFlagged ? "flag" : "outlined_flag"}
                        </span>
                      </button>

                      <button
                        onClick={() => setDeleteSessionTarget({ id: sessionItem.id })}
                        title="Delete Session"
                        className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-[#888] hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">
                          delete
                        </span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Conversation Detail & Transcript Modal */}
      <ConversationDetailModal
        selectedSession={selectedSession}
        conversationDetails={conversationDetails}
        loadingDetails={loadingDetails}
        onClose={() => setSelectedSession(null)}
        onToggleFlag={handleToggleFlag}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteSessionTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#111] border border-red-500/20 dark:border-red-500/30 rounded-[2rem] p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                  <span className="material-symbols-outlined text-2xl">warning</span>
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    Delete Conversation Session?
                  </h3>
                  <p className="text-xs text-[#666] dark:text-[#999] leading-relaxed">
                    This will permanently delete session <span className="font-mono text-black dark:text-white">{deleteSessionTarget.id}</span> and all message transcript history.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222] p-4 rounded-2xl">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#888]">
                  Session to Delete
                </span>
                <div className="font-mono text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl break-all select-all font-semibold">
                  {deleteSessionTarget.id}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0f0f0] dark:border-[#222]">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteSessionTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#666] dark:text-[#aaa] hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDeleteSession}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Delete Conversation
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
