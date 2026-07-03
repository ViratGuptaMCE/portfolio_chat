"use client";

import React, { useState, use, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import {
  getWidgetConfig,
  saveDraftConfig,
  publishWidgetConfig,
  resetSectionConfig,
  resetAllConfig,
} from "@/app/dashboard/customizer-actions";
import { DEFAULT_WIDGET_CONFIG } from "@/app/dashboard/customizer-constants";

import AppearancePanel from "./components/panels/AppearancePanel";
import LauncherPanel from "./components/panels/LauncherPanel";
import HeaderPanel from "./components/panels/HeaderPanel";
import WelcomePanel from "./components/panels/WelcomePanel";
import LayoutBubblePanel from "./components/panels/LayoutBubblePanel";
import SuggestedQuestionsPanel from "./components/panels/SuggestedQuestionsPanel";
import LiveWidgetPreview from "./components/LiveWidgetPreview";

const NAV_TABS = [
  { id: "appearance", label: "Appearance", icon: "palette" },
  { id: "launcher", label: "Launcher", icon: "widgets" },
  { id: "header", label: "Header", icon: "view_day" },
  { id: "welcome", label: "Welcome", icon: "waving_hand" },
  { id: "layout", label: "Layout & Bubbles", icon: "grid_view" },
  { id: "suggestedQuestions", label: "Prompt Chips", icon: "label" }
];

export default function CustomizerPage({ params }) {
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appearance");
  
  // Config states
  const [savedDraft, setSavedDraft] = useState(DEFAULT_WIDGET_CONFIG);
  const [currentDraft, setCurrentDraft] = useState(DEFAULT_WIDGET_CONFIG);
  const [publishedConfig, setPublishedConfig] = useState(DEFAULT_WIDGET_CONFIG);
  
  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!session?.user?.id || !projectId) return;

    const fetchConfig = async () => {
      setLoading(true);
      const res = await getWidgetConfig(session.user.id, projectId);
      if (isMounted) {
        if (res) {
          setSavedDraft(res.draft || DEFAULT_WIDGET_CONFIG);
          setCurrentDraft(res.draft || DEFAULT_WIDGET_CONFIG);
          setPublishedConfig(res.published || DEFAULT_WIDGET_CONFIG);
        }
        setLoading(false);
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, projectId]);

  // Dirty State Calculation
  const isDirty = JSON.stringify(currentDraft) !== JSON.stringify(savedDraft);
  const isPublishedSync = JSON.stringify(currentDraft) === JSON.stringify(publishedConfig);

  const handleApplyPreset = (presetPartial) => {
    setCurrentDraft((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        ...presetPartial
      },
      bubbles: {
        ...prev.bubbles,
        userBg: presetPartial.userBg || prev.bubbles?.userBg,
        userText: presetPartial.userText || prev.bubbles?.userText,
        botBg: presetPartial.botBg || prev.bubbles?.botBg,
        botText: presetPartial.botText || prev.bubbles?.botText
      }
    }));
  };

  const handleSaveDraft = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);

    const res = await saveDraftConfig(session.user.id, projectId, currentDraft);
    if (res.success) {
      setSavedDraft(currentDraft);
      setNotification({ type: "success", message: "Draft configuration saved successfully." });
    } else {
      setNotification({ type: "error", message: res.error || "Failed to save draft." });
    }

    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (!session?.user?.id) return;
    setIsPublishing(true);

    const res = await publishWidgetConfig(session.user.id, projectId, currentDraft);
    if (res.success) {
      setSavedDraft(currentDraft);
      setPublishedConfig(currentDraft);
      setNotification({ type: "success", message: "Widget configuration published to live website widget!" });
    } else {
      setNotification({ type: "error", message: res.error || "Failed to publish widget configuration." });
    }

    setIsPublishing(false);
  };

  const handleResetSection = async () => {
    if (!session?.user?.id) return;
    const res = await resetSectionConfig(session.user.id, projectId, currentDraft, activeTab);
    if (res.success) {
      const updated = await getWidgetConfig(session.user.id, projectId);
      if (updated) {
        setSavedDraft(updated.draft || DEFAULT_WIDGET_CONFIG);
        setCurrentDraft(updated.draft || DEFAULT_WIDGET_CONFIG);
      }
      setNotification({ type: "success", message: `Section "${activeTab}" reset to default.` });
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentDraft, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `widget-config-${projectId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (typeof imported === "object") {
          setCurrentDraft((prev) => ({ ...prev, ...imported }));
          setNotification({ type: "success", message: "Configuration imported successfully! Click Save Draft to persist." });
        }
      } catch (err) {
        setNotification({ type: "error", message: "Invalid JSON configuration file." });
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111] rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] p-24 text-center text-[#666] dark:text-[#888] flex items-center justify-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
        <span className="text-sm font-mono">Loading Widget Customizer Studio...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-[#111] dark:text-[#f3f4f6]">
      {/* Custom Notification Toast */}
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
            <button onClick={() => setNotification(null)} className="hover:opacity-75">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Actions & Publish Control Bar */}
      <div className="bg-white dark:bg-[#111] p-5 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">palette</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-black dark:text-white">
                Chatbot Customizer Studio
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isPublishedSync
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : isDirty
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                }`}
              >
                {isPublishedSync ? "Live Published" : isDirty ? "Unsaved Edits" : "Draft Saved"}
              </span>
            </div>
            <p className="text-xs text-[#666] dark:text-[#888]">
              Design & test your widget's visual theme, launcher, header, and prompt chips in real-time.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJson}
            title="Export Widget JSON"
            className="px-3 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-semibold text-black dark:text-white hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export
          </button>

          {/* Import JSON */}
          <label className="px-3 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-semibold text-black dark:text-white hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer">
            <span className="material-symbols-outlined text-base">upload</span>
            Import
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          {/* Reset Dropdown */}
          <button
            type="button"
            onClick={handleResetSection}
            title="Reset active tab section to default"
            className="px-3 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-semibold text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white transition-all cursor-pointer"
          >
            Reset Section
          </button>

          {/* Save Draft */}
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={handleSaveDraft}
            className="px-4 py-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-bold text-black dark:text-white hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-all disabled:opacity-40 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>

          {/* Publish Button */}
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            {isPublishing ? "Publishing..." : "Publish to Live"}
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Compact Left Settings Sidebar (4/12 cols) + Expanded Live Preview Stage (8/12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Settings Sidebar (4/12 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-white dark:bg-[#111] p-5 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] shadow-sm">
          {/* Category Navigation Bar */}
          <div className="flex gap-1 pb-2 overflow-x-auto border-b border-[#e5e5e5] dark:border-[#222] custom-scrollbar">
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                      : "text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white hover:bg-[#fafafa] dark:hover:bg-[#18181b]"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Category Panel Container */}
          <div className="pt-1">
            {activeTab === "appearance" && (
              <AppearancePanel
                draftConfig={currentDraft}
                onChange={setCurrentDraft}
                onApplyPreset={handleApplyPreset}
              />
            )}
            {activeTab === "launcher" && (
              <LauncherPanel draftConfig={currentDraft} onChange={setCurrentDraft} />
            )}
            {activeTab === "header" && (
              <HeaderPanel draftConfig={currentDraft} onChange={setCurrentDraft} />
            )}
            {activeTab === "welcome" && (
              <WelcomePanel draftConfig={currentDraft} onChange={setCurrentDraft} />
            )}
            {activeTab === "layout" && (
              <LayoutBubblePanel draftConfig={currentDraft} onChange={setCurrentDraft} />
            )}
            {activeTab === "suggestedQuestions" && (
              <SuggestedQuestionsPanel draftConfig={currentDraft} onChange={setCurrentDraft} />
            )}
          </div>
        </div>

        {/* Right Preview Stage (8/12 cols - Expanded Space) */}
        <div className="lg:col-span-8 sticky top-6">
          <LiveWidgetPreview draftConfig={currentDraft} project={{ name: session?.user?.name || "Portfolio" }} />
        </div>
      </div>
    </div>
  );
}
