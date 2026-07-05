"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import {
  getProjectSettingsAction,
  updateProjectSettingsAction,
  regenerateApiKeyAction,
  deleteProjectAction,
} from "./actions";

if (typeof window !== "undefined") {
  import("@material/web/icon/icon.js");
}

const MODEL_OPTIONS = [
  {
    id: "openai/gpt-oss-120b",
    name: "OpenAI GPT-OSS 120B",
    desc: "Ultra high-reasoning flagship model for complex query analysis.",
    tag: "Recommended",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "OpenAI GPT-OSS 20B",
    desc: "Balanced speed and accuracy for standard conversational workloads.",
    tag: "Fast & Efficient",
  },
  {
    id: "qwen/qwen3.6-27b",
    name: "Qwen 3.6 27B",
    desc: "Multilingual & technical code understanding specialist model.",
    tag: "Code & Multilingual",
  },
];

const TONE_OPTIONS = [
  { id: "professional", label: "Professional", icon: "work" },
  { id: "friendly", label: "Friendly", icon: "mood" },
  { id: "concise", label: "Concise", icon: "bolt" },
  { id: "technical", label: "Technical", icon: "code" },
  { id: "academic", label: "Academic", icon: "school" },
  { id: "enthusiastic", label: "Enthusiastic", icon: "sentiment_very_satisfied" },
];

const LANGUAGE_OPTIONS = [
  { id: "auto", label: "Auto-detect User Language", code: "AUTO", desc: "Dynamically match visitor input language" },
  { id: "en", label: "English", code: "EN", desc: "English (US / UK)" },
  { id: "es", label: "Spanish", code: "ES", desc: "Español" },
  { id: "fr", label: "French", code: "FR", desc: "Français" },
  { id: "de", label: "German", code: "DE", desc: "Deutsch" },
  { id: "ja", label: "Japanese", code: "JA", desc: "日本語" },
  { id: "hi", label: "Hindi", code: "HI", desc: "हिन्दी" },
  { id: "zh", label: "Chinese", code: "ZH", desc: "中文" },
];

export default function ProjectSettingsPage({ params }) {
  const router = useRouter();
  const { data: session } = useSession();
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Active Sub-tab inside Settings
  const [activeTab, setActiveTab] = useState("model");

  // Project Identity Info
  const [projectData, setProjectData] = useState(null);

  // Settings State Form
  const [formData, setFormData] = useState({
    llmModel: "openai/gpt-oss-120b",
    temperature: 0.3,
    maxTokens: 500,
    modelTone: "professional",
    modelLanguage: "auto",
    systemInstructions: "",
    apiEnabled: true,
    apiAllowedOrigins: [],
    apiRateLimitRpm: 20,
    widgetEnabled: true,
    widgetVersion: "v1.0.0",
    allowedDomains: [],
    customCss: "",
    customHtml: "",
  });

  // Inputs for Origins & Domains
  const [originInput, setOriginInput] = useState("");
  const [domainInput, setDomainInput] = useState("");

  // Modals for Security & Danger Zone
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenConfirmText, setRegenConfirmText] = useState("");
  const [regenSecretKey, setRegenSecretKey] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Custom Language Dropdown State
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = React.useRef(null);

  const spring = { type: "spring", stiffness: 400, damping: 30 };

  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (session?.user?.id && projectId) {
      loadSettings();
    }
  }, [session, projectId]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    const res = await getProjectSettingsAction(session.user.id, projectId);
    if (res.success) {
      setProjectData(res.data.project);
      setFormData(res.data.settings);
    } else {
      setError(res.error || "Failed to load project settings");
    }
    setLoading(false);
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const res = await updateProjectSettingsAction(session.user.id, projectId, formData);
    if (res.success) {
      setSuccessMsg("Project settings saved successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(res.error || "Failed to save settings");
    }
    setSaving(false);
  };

  // Add origin chip
  const handleAddOrigin = (e) => {
    if ((e.key === "Enter" || e.type === "click") && originInput.trim()) {
      e.preventDefault();
      const val = originInput.trim();
      if (!formData.apiAllowedOrigins.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          apiAllowedOrigins: [...prev.apiAllowedOrigins, val],
        }));
      }
      setOriginInput("");
    }
  };

  const handleRemoveOrigin = (index) => {
    setFormData((prev) => ({
      ...prev,
      apiAllowedOrigins: prev.apiAllowedOrigins.filter((_, i) => i !== index),
    }));
  };

  // Add domain chip
  const handleAddDomain = (e) => {
    if ((e.key === "Enter" || e.type === "click") && domainInput.trim()) {
      e.preventDefault();
      const val = domainInput.trim();
      if (!formData.allowedDomains.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          allowedDomains: [...prev.allowedDomains, val],
        }));
      }
      setDomainInput("");
    }
  };

  const handleRemoveDomain = (index) => {
    setFormData((prev) => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter((_, i) => i !== index),
    }));
  };

  // Regenerate API Key Modal Action
  const handleRegenerateKey = async () => {
    if (regenConfirmText !== "I confirm to regenerate the key") return;
    setSaving(true);
    const res = await regenerateApiKeyAction(session.user.id, projectId);
    if (res.success) {
      setRegenSecretKey(res.secretKey);
      setProjectData((prev) => ({ ...prev, hasApiKey: true }));
    } else {
      setError(res.error || "Failed to regenerate key");
    }
    setSaving(false);
  };

  // Delete Project Modal Action
  const handleDeleteProject = async () => {
    if (deleteConfirmText !== projectData?.slug) return;
    setSaving(true);
    const res = await deleteProjectAction(session.user.id, projectId, deleteConfirmText);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Failed to delete project");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-3 text-text-tertiary">
        <div className="w-8 h-8 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
        <p className="text-sm font-medium">Loading project settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Top Notification Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <md-icon style={{ fontSize: 18 }}>error</md-icon>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:opacity-70">
              <md-icon style={{ fontSize: 16 }}>close</md-icon>
            </button>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <md-icon style={{ fontSize: 18 }}>check_circle</md-icon>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="hover:opacity-70">
              <md-icon style={{ fontSize: 16 }}>close</md-icon>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Project Settings</h2>
          <p className="text-sm text-text-secondary">
            Configure model parameters, standalone API service, widget permissions, and developer customization.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-accent-indigo text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-accent-indigo/20 hover:bg-accent-indigo/90 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <md-icon style={{ fontSize: 18 }}>save</md-icon>
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-glass border border-surface-border w-fit overflow-x-auto">
        {[
          { id: "model", label: "AI Model & Intelligence", icon: "psychology" },
          { id: "api", label: "API Service & CORS", icon: "api" },
          { id: "widget", label: "Widget & Versioning", icon: "widgets" },
          { id: "danger", label: "Keys & Danger Zone", icon: "shield_lock" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? "text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <md-icon style={{ fontSize: 16 }}>{tab.icon}</md-icon>
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="settingsSubTab"
                className="absolute inset-0 rounded-xl bg-surface-border/50 border border-surface-border -z-10 shadow-sm"
                transition={spring}
              />
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* SECTION 1: AI MODEL & INTELLIGENCE */}
      {activeTab === "model" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-6"
        >
          {/* LLM Model Selection */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 20 }}>auto_awesome</md-icon>
                Language Model Architecture
              </h3>
              <p className="text-xs text-text-secondary">
                Select the LLM model powering both your standalone RAG API and embedded chat widget.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {MODEL_OPTIONS.map((model) => {
                const isSelected = formData.llmModel === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, llmModel: model.id }))}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all relative ${
                      isSelected
                        ? "border-accent-indigo bg-accent-indigo/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                        : "border-surface-border bg-surface-card hover:border-surface-border/80 hover:bg-surface-border/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-text-primary">{model.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/30">
                          {model.tag}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary leading-relaxed">{model.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-surface-border/40 text-xs text-text-tertiary font-mono">
                      <span>{model.id}</span>
                      {isSelected && (
                        <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>check_circle</md-icon>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Tone & Persona */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 20 }}>tune</md-icon>
                Model Tone & Persona
              </h3>
              <p className="text-xs text-text-secondary">
                Select the conversational tone and communication demeanor of AI responses.
              </p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-2">
              {TONE_OPTIONS.map((tone) => {
                const isSelected = formData.modelTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, modelTone: tone.id }))}
                    className={`py-3 px-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? "border-accent-indigo bg-accent-indigo/15 text-text-primary shadow-sm"
                        : "border-surface-border bg-surface-card text-text-secondary hover:text-text-primary hover:bg-surface-border/20"
                    }`}
                  >
                    <md-icon style={{ fontSize: 20, color: isSelected ? "var(--accent-indigo)" : "var(--text-tertiary)" }}>
                      {tone.icon}
                    </md-icon>
                    {tone.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature & Response Length */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature Slider */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>thermostat</md-icon>
                  Temperature ({formData.temperature})
                </label>
                <span className="text-xs text-text-tertiary font-mono">
                  {formData.temperature < 0.2
                    ? "Strict / Fact-Based"
                    : formData.temperature < 0.6
                    ? "Balanced"
                    : "Creative"}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Lower values yield precise, factual answers. Higher values allow greater creative variance.
              </p>

              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.05"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
                }
                className="w-full accent-accent-indigo cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[11px] text-text-tertiary font-mono">
                <span>0.00 (Exact)</span>
                <span>0.50 (Standard)</span>
                <span>1.00 (Creative)</span>
              </div>
            </div>

            {/* Response Length / Max Tokens */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>short_text</md-icon>
                Response Length Limit ({formData.maxTokens} Tokens)
              </label>
              <p className="text-xs text-text-secondary">
                Control max token length generated per turn (~4 characters per token).
              </p>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { label: "Concise", tokens: 250 },
                  { label: "Standard", tokens: 500 },
                ].map((len) => {
                  const isSelected = formData.maxTokens === len.tokens;
                  return (
                    <button
                      key={len.tokens}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, maxTokens: len.tokens }))}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-accent-indigo bg-accent-indigo text-white shadow-md"
                          : "border-surface-border bg-surface-card text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {len.label} ({len.tokens})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary Output Language & System Directives */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-6">
            <div className="flex flex-col gap-2 relative" ref={langDropdownRef}>
              <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>translate</md-icon>
                Primary Response Language
              </label>
              <p className="text-xs text-text-secondary mb-1">
                Select the target language for model completions, or set to auto-detect.
              </p>

              {/* Custom Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsLangOpen((prev) => !prev)}
                className={`w-full sm:w-80 px-4 py-3 rounded-xl bg-surface-card border transition-all text-left flex items-center justify-between gap-3 ${
                  isLangOpen
                    ? "border-accent-indigo shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-accent-indigo/5"
                    : "border-surface-border hover:border-accent-indigo/40 hover:bg-surface-border/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center text-accent-indigo font-mono text-[11px] font-semibold">
                    {LANGUAGE_OPTIONS.find((l) => l.id === formData.modelLanguage)?.code || "AUTO"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-text-primary">
                      {LANGUAGE_OPTIONS.find((l) => l.id === formData.modelLanguage)?.label || "Auto-detect User Language"}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {LANGUAGE_OPTIONS.find((l) => l.id === formData.modelLanguage)?.desc || "Dynamically match visitor input language"}
                    </span>
                  </div>
                </div>

                <md-icon
                  style={{
                    fontSize: 18,
                    color: isLangOpen ? "var(--accent-indigo)" : "var(--text-tertiary)",
                    transition: "transform 0.2s ease",
                    transform: isLangOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  expand_more
                </md-icon>
              </button>

              {/* Custom Dropdown Popover Menu */}
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 4 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-full left-0 z-40 w-full sm:w-80 p-1.5 rounded-2xl bg-surface-card border border-surface-border shadow-2xl backdrop-blur-xl flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar"
                    style={{ transformOrigin: "top left" }}
                  >
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = formData.modelLanguage === lang.id;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, modelLanguage: lang.id }));
                            setIsLangOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors ${
                            isSelected
                              ? "bg-accent-indigo/15 text-accent-indigo font-medium"
                              : "text-text-primary hover:bg-surface-border/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-surface-border/50 border border-surface-border flex items-center justify-center font-mono text-[10px] text-text-secondary">
                              {lang.code}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold">{lang.label}</span>
                              <span className="text-[10px] text-text-tertiary">{lang.desc}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <md-icon style={{ fontSize: 16, color: "var(--accent-indigo)" }}>
                              check
                            </md-icon>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>assignment</md-icon>
                Custom System Directives / Prompt Instructions
              </label>
              <p className="text-xs text-text-secondary">
                Add strict guidelines or persona instructions appended to every RAG completion prompt.
              </p>
              <textarea
                rows={4}
                value={formData.systemInstructions}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, systemInstructions: e.target.value }))
                }
                placeholder="e.g. Always respond in bullet points. If asked about pricing, direct the user to the contact form..."
                className="w-full p-4 rounded-xl bg-surface-card border border-surface-border text-text-primary text-sm focus:border-accent-indigo focus:outline-none transition-colors leading-relaxed font-mono"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 2: DEVELOPER & API SERVICES */}
      {activeTab === "api" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-6"
        >
          {/* Master API Toggle & Rate Limit */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <md-icon style={{ color: "var(--accent-indigo)", fontSize: 20 }}>terminal</md-icon>
                  Standalone Headless RAG API Access
                </h3>
                <p className="text-xs text-text-secondary">
                  Enable external API queries to <code className="font-mono text-accent-indigo">POST /v1/chat/message</code> using your secret key.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.apiEnabled}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apiEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-indigo"></div>
              </label>
            </div>

            {/* Rate Limiting */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-primary">
                  API Rate Limit ({formData.apiRateLimitRpm} RPM)
                </label>
                <span className="text-xs text-text-tertiary font-mono">Requests per minute</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={formData.apiRateLimitRpm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiRateLimitRpm: parseInt(e.target.value, 10) }))
                }
                className="w-full accent-accent-indigo cursor-pointer"
              />
            </div>
          </div>

          {/* Allowed CORS Origins */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 20 }}>language</md-icon>
                CORS Whitelisted API Origins
              </h3>
              <p className="text-xs text-text-secondary">
                Restrict Headless API requests to specific web domains. Leave empty to allow any origin.
              </p>
            </header>

            <div className="flex gap-2">
              <input
                type="url"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                onKeyDown={handleAddOrigin}
                placeholder="https://api.mycompany.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-card border border-surface-border text-text-primary text-sm focus:border-accent-indigo focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleAddOrigin}
                className="px-4 py-2.5 rounded-xl bg-surface-border/50 border border-surface-border text-text-primary text-xs font-semibold hover:bg-surface-border transition-colors"
              >
                Add Origin
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {formData.apiAllowedOrigins.length === 0 ? (
                <span className="text-xs text-text-tertiary italic">No origin restrictions (Allow All *)</span>
              ) : (
                formData.apiAllowedOrigins.map((origin, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-accent-indigo/10 border border-accent-indigo/30 text-accent-indigo text-xs font-mono flex items-center gap-2"
                  >
                    {origin}
                    <button
                      type="button"
                      onClick={() => handleRemoveOrigin(idx)}
                      className="hover:text-red-400"
                    >
                      <md-icon style={{ fontSize: 14 }}>close</md-icon>
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Developer Custom CSS & HTML */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom CSS */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-3">
              <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>css</md-icon>
                Developer Custom CSS
              </label>
              <p className="text-xs text-text-secondary">
                Inject custom CSS rules directly into widget shadow DOM containers.
              </p>
              <textarea
                rows={6}
                value={formData.customCss}
                onChange={(e) => setFormData((prev) => ({ ...prev, customCss: e.target.value }))}
                placeholder=".pc-header { background: #000; }"
                className="w-full p-4 rounded-xl bg-surface-card border border-surface-border text-text-primary text-xs font-mono focus:border-accent-indigo focus:outline-none transition-colors"
              />
            </div>

            {/* Custom HTML */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-3">
              <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>html</md-icon>
                Developer Custom HTML Snippet
              </label>
              <p className="text-xs text-text-secondary">
                Inject custom HTML markup (e.g. badges, branding links) into widget containers.
              </p>
              <textarea
                rows={6}
                value={formData.customHtml}
                onChange={(e) => setFormData((prev) => ({ ...prev, customHtml: e.target.value }))}
                placeholder="<div class='custom-badge'>Powered by MyCompany</div>"
                className="w-full p-4 rounded-xl bg-surface-card border border-surface-border text-text-primary text-xs font-mono focus:border-accent-indigo focus:outline-none transition-colors"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 3: WIDGET & VERSIONING */}
      {activeTab === "widget" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-6"
        >
          {/* Master Widget Toggle & Release Version */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <md-icon style={{ color: "var(--accent-indigo)", fontSize: 20 }}>toggle_on</md-icon>
                  Widget Embed Capability
                </h3>
                <p className="text-xs text-text-secondary">
                  Enable or disable initialization of the client widget script on external websites.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.widgetEnabled}
                  onChange={(e) => setFormData((prev) => ({ ...prev, widgetEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-indigo"></div>
              </label>
            </div>

            {/* Release Version Tag */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>sell</md-icon>
                Active Release Version Tag
              </label>
              <p className="text-xs text-text-secondary">
                Semantic version tracking tag for published widget configurations.
              </p>
              <input
                type="text"
                value={formData.widgetVersion}
                onChange={(e) => setFormData((prev) => ({ ...prev, widgetVersion: e.target.value }))}
                placeholder="v1.0.0"
                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-surface-card border border-surface-border text-text-primary text-sm font-mono focus:border-accent-indigo focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Allowed Embed Domains */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 20 }}>security</md-icon>
                Authorized Widget Website Domains
              </h3>
              <p className="text-xs text-text-secondary">
                Restrict widget loading strictly to authorized website domains (e.g. <code className="font-mono text-accent-indigo">https://portfolio.dev</code>).
              </p>
            </header>

            <div className="flex gap-2">
              <input
                type="url"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={handleAddDomain}
                placeholder="https://myportfolio.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-card border border-surface-border text-text-primary text-sm focus:border-accent-indigo focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleAddDomain}
                className="px-4 py-2.5 rounded-xl bg-surface-border/50 border border-surface-border text-text-primary text-xs font-semibold hover:bg-surface-border transition-colors"
              >
                Add Domain
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {formData.allowedDomains.length === 0 ? (
                <span className="text-xs text-text-tertiary italic">No domain restrictions (Widget loads on any domain)</span>
              ) : (
                formData.allowedDomains.map((domain, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-accent-indigo/10 border border-accent-indigo/30 text-accent-indigo text-xs font-mono flex items-center gap-2"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(idx)}
                      className="hover:text-red-400"
                    >
                      <md-icon style={{ fontSize: 14 }}>close</md-icon>
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 4: KEYS & DANGER ZONE */}
      {activeTab === "danger" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-6"
        >
          {/* Public Widget Token */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-3">
            <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <md-icon style={{ color: "var(--accent-indigo)", fontSize: 18 }}>key</md-icon>
              Public Widget Embed Token
            </label>
            <p className="text-xs text-text-secondary">
              Included in public website <code className="font-mono text-accent-indigo">&lt;script&gt;</code> tags.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={projectData?.widgetToken || ""}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-card border border-surface-border text-text-primary text-xs font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(projectData?.widgetToken || "");
                  setSuccessMsg("Widget token copied to clipboard!");
                  setTimeout(() => setSuccessMsg(null), 3000);
                }}
                className="px-4 py-2.5 rounded-xl bg-surface-border/50 border border-surface-border text-text-primary text-xs font-semibold hover:bg-surface-border transition-colors flex items-center gap-1.5"
              >
                <md-icon style={{ fontSize: 16 }}>content_copy</md-icon>
                Copy
              </button>
            </div>
          </div>

          {/* Secret API Key Management */}
          <div className="p-6 rounded-2xl bg-surface-glass border border-surface-border flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <md-icon style={{ color: "var(--accent-indigo)", fontSize: 20 }}>vpn_key</md-icon>
                Secret API Key Authentication
              </h3>
              <p className="text-xs text-text-secondary">
                Secret keys start with <code className="font-mono text-accent-indigo">pct_secret_</code>. Only SHA-256 hashes are stored in the database.
              </p>
            </header>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-card border border-surface-border">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {projectData?.hasApiKey ? "••••••••••••••••••••••••••••••••" : "No Secret Key Generated"}
                </p>
                <p className="text-xs text-text-tertiary">
                  {projectData?.hasApiKey
                    ? "Active secret key configured for RAG Headless API."
                    : "Generate a key to enable server-to-server RAG queries."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRegenConfirmText("");
                  setShowRegenModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <md-icon style={{ fontSize: 16 }}>refresh</md-icon>
                Regenerate Secret Key
              </button>
            </div>
          </div>

          {/* Delete Project Card */}
          <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-red-500 flex items-center gap-2">
                <md-icon style={{ fontSize: 20 }}>delete_forever</md-icon>
                Delete Project
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Permanently delete this project along with all indexed documents, knowledge entries, conversation logs, and vector embeddings. This action cannot be undone.
              </p>
            </header>

            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText("");
                setShowDeleteModal(true);
              }}
              className="w-fit px-5 py-2.5 rounded-xl bg-red-500 text-white font-medium text-xs hover:bg-red-600 transition-colors flex items-center gap-2 shadow-md shadow-red-500/20"
            >
              <md-icon style={{ fontSize: 16 }}>delete</md-icon>
              Delete Project
            </button>
          </div>
        </motion.div>
      )}

      {/* REGENERATE API KEY MODAL (Non-Pastable Verification) */}
      <AnimatePresence>
        {showRegenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-surface-card border border-surface-border shadow-2xl flex flex-col gap-5"
            >
              <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                  <md-icon style={{ fontSize: 20 }}>warning</md-icon>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Regenerate Secret Key</h3>
                  <p className="text-xs text-text-tertiary">Invalidates your current secret key immediately.</p>
                </div>
              </header>

              {regenSecretKey ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex flex-col gap-2">
                    <p className="font-semibold">Save your new secret key now!</p>
                    <p className="text-[11px] text-emerald-300/80">
                      This key will only be displayed ONCE. Store it in a secure location.
                    </p>
                    <input
                      type="text"
                      readOnly
                      value={regenSecretKey}
                      className="w-full p-2.5 rounded-lg bg-black/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs select-all focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowRegenModal(false);
                      setRegenSecretKey(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-surface-border text-text-primary text-xs font-semibold hover:bg-surface-border/80"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    To confirm key regeneration, type manually:
                    <br />
                    <strong className="text-text-primary font-mono select-none">
                      "I confirm to regenerate the key"
                    </strong>
                  </p>

                  <input
                    type="text"
                    value={regenConfirmText}
                    onChange={(e) => setRegenConfirmText(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Type confirmation phrase here..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-glass border border-surface-border text-text-primary text-xs focus:border-red-500 focus:outline-none"
                  />

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setShowRegenModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-surface-glass border border-surface-border text-text-secondary hover:text-text-primary text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegenerateKey}
                      disabled={regenConfirmText !== "I confirm to regenerate the key" || saving}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-40 transition-colors"
                    >
                      {saving ? "Generating..." : "Regenerate Key"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE PROJECT MODAL (Non-Pastable Verification) */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-surface-card border border-red-500/30 shadow-2xl flex flex-col gap-5"
            >
              <header className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500">
                  <md-icon style={{ fontSize: 20 }}>delete_forever</md-icon>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">Delete Project</h3>
                  <p className="text-xs text-text-tertiary">This action cannot be undone.</p>
                </div>
              </header>

              <div className="flex flex-col gap-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Type project slug <strong className="text-red-400 font-mono select-none">{projectData?.slug}</strong> to confirm deletion:
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  placeholder={`Type ${projectData?.slug} here...`}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-glass border border-surface-border text-text-primary text-xs focus:border-red-500 focus:outline-none"
                />

                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-surface-glass border border-surface-border text-text-secondary hover:text-text-primary text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    disabled={deleteConfirmText !== projectData?.slug || saving}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors"
                  >
                    {saving ? "Deleting..." : "Permanently Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
