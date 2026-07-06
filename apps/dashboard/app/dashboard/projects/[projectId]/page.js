"use client";

import React, { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "../../../../lib/auth-client";
import { getProjectById, regenerateProjectApiKey } from "../../actions";
import { useRouter } from "next/navigation";
import ProjectSetupNotification from "./components/ProjectSetupNotification";

if (typeof window !== "undefined") {
  import("@material/web/icon/icon.js");
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.5 } }
};

function FormattedMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  
  const parseInline = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="font-mono text-xs bg-surface-border px-1.5 py-0.5 rounded text-accent-cyan">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col gap-2 text-sm text-text-primary leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1">
              <span className="font-mono text-xs text-accent-cyan font-semibold shrink-0 mt-0.5">
                {numMatch[1]}.
              </span>
              <span className="flex-1">{parseInline(numMatch[2])}</span>
            </div>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald shrink-0 mt-2" />
              <span className="flex-1">{parseInline(trimmed.substring(2))}</span>
            </div>
          );
        }

        return <p key={idx}>{parseInline(line)}</p>;
      })}
    </div>
  );
}

export default function ProjectOverviewPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const { data: session } = useSession();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [copiedField, setCopiedField] = useState(null);
  const [newSecretKeyModal, setNewSecretKeyModal] = useState(null); // Holds raw secret key for one-time display
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenConfirmInput, setRegenConfirmInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState("python");
  
  // Interactive API Playground State
  const [playgroundQuery, setPlaygroundQuery] = useState("What are your core skills and projects?");
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundLatency, setPlaygroundLatency] = useState(null);
  const [playgroundError, setPlaygroundError] = useState(null);

  // Notification Banner
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    async function loadProject() {
      if (session?.user?.id) {
        setLoading(true);
        const data = await getProjectById(session.user.id, projectId);
        if (data) {
          setProject(data);
          if (data.initialRawApiKey) {
            setNewSecretKeyModal(data.initialRawApiKey);
          }
        } else {
          router.push('/dashboard');
        }
        setLoading(false);
      }
    }
    loadProject();
  }, [session?.user?.id, projectId, router]);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerateKey = async () => {
    if (!session?.user?.id || !project?.id) return;
    if (regenConfirmInput.trim() !== "I confirm to regenerate the key") return;

    setIsRegenerating(true);
    try {
      const res = await regenerateProjectApiKey(session.user.id, project.id);
      if (res.success && res.rawApiKey) {
        setNewSecretKeyModal(res.rawApiKey);
        setNotification({ type: 'success', message: 'New Secret API key generated! Previous SHA-256 hash has been invalidated.' });
      } else {
        setNotification({ type: 'error', message: res.error || 'Failed to regenerate API key' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsRegenerating(false);
      setShowRegenModal(false);
      setRegenConfirmInput("");
    }
  };

  const activeApiKeyForCalls = newSecretKeyModal || project?.widgetToken || "pct_secret_YOUR_KEY";

  const handleRunPlaygroundTest = async () => {
    if (!activeApiKeyForCalls || !playgroundQuery.trim()) return;

    setPlaygroundLoading(true);
    setPlaygroundError(null);
    setPlaygroundResponse(null);
    const startTime = performance.now();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/v1/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeApiKeyForCalls}`
        },
        body: JSON.stringify({
          projectId: project.id,
          message: playgroundQuery,
          sessionId: `test_session_${Date.now()}`
        })
      });

      const endTime = performance.now();
      setPlaygroundLatency(Math.round(endTime - startTime));

      const data = await res.json();
      if (res.ok && data.success) {
        setPlaygroundResponse(data);
      } else {
        setPlaygroundError(data.error || `HTTP ${res.status}: Failed to process request`);
      }
    } catch (err) {
      setPlaygroundError(`Network or connection error: ${err.message}. Make sure API backend is running.`);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-secondary">
        <div className="w-6 h-6 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
        <p className="text-sm font-mono uppercase tracking-widest">Loading Command Center...</p>
      </div>
    );
  }

  if (!project) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8080` : "http://localhost:8080");
  const widgetTokenToUse = project.widgetToken || "{API_TOKEN}";

  const scriptTag = `<script 
  src="${baseUrl}/v1/widget.js" 
  data-token="${widgetTokenToUse}" 
  defer
></script>`;

  // Code Snippets with explicit placeholder syntax
  const pythonCode = `import requests

url = "${baseUrl}/v1/chat/message"
headers = {
    "Authorization": "Bearer {SECRET_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "projectId": "{PROJECT_ID}",
    "message": "What are your core skills and projects?",
    "sessionId": "visitor_session_001"
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()

print("AI Response:", data.get("reply"))
print("Sources Found:", len(data.get("sources", [])))`;

  const jsonCurlCode = `curl -X POST "${baseUrl}/v1/chat/message" \\
  -H "Authorization: Bearer {SECRET_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "{PROJECT_ID}",
    "message": "What are your core skills and projects?",
    "sessionId": "visitor_session_001"
  }'`;

  const jsCode = `const response = await fetch("${baseUrl}/v1/chat/message", {
  method: "POST",
  headers: {
    "Authorization": "Bearer {SECRET_KEY}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    projectId: "{PROJECT_ID}",
    message: "What are your core skills and projects?",
    sessionId: "visitor_session_001"
  })
});

const data = await response.json();
console.log("AI Answer:", data.reply);`;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 relative pb-16"
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg ${
              notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-200"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <md-icon>
                {notification.type === "error" ? "error" : "check_circle"}
              </md-icon>
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="opacity-70 hover:opacity-100"
            >
              <md-icon style={{ fontSize: 18 }}>close</md-icon>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Setup Requirement Notification Banner (Auto-hidden when fully configured) */}
      <ProjectSetupNotification userId={session?.user?.id} projectId={projectId} />

      {/* Quick Stats */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            label: "Status",
            value:
              project.status === "ready" || project.status === "active"
                ? "Active & Ready"
                : "Processing",
            icon: "check_circle",
            color: "text-accent-emerald",
          },
          {
            label: "Embedding Model",
            value: project.embeddingModel || "bge-large-en-v1.5",
            icon: "model_training",
            color: "text-accent-purple",
          },
          {
            label: "LLM Provider",
            value: project.llmModel || "groq/openai/gpt-oss-120b",
            icon: "psychology",
            color: "text-accent-cyan",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-surface-glass backdrop-blur-md border border-surface-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-surface-border/50 flex items-center justify-center ${stat.color}`}
            >
              <md-icon>{stat.icon}</md-icon>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-text-tertiary font-mono uppercase tracking-widest">
                {stat.label}
              </span>
              <span className="text-base font-medium text-text-primary mt-1">
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Primary Credentials Grid */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Widget Script Integration & Public Token */}
        <div className="bg-surface-glass backdrop-blur-xl border border-surface-border rounded-3xl p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-indigo/10 blur-[100px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

          <div className="flex flex-col gap-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 blur-[100px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <md-icon className="text-accent-cyan">web</md-icon>
                <h2 className="text-xl font-semibold text-text-primary">
                  Quickstart: Standard Embed Widget
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                <span className="text-xs text-accent-emerald font-mono uppercase tracking-wider font-semibold">
                  Status: Published
                </span>
              </div>
            </div>

            <p className="text-sm text-text-secondary">
              Copy and paste this HTML snippet directly before the closing{" "}
              <code className="font-mono text-xs text-accent-cyan bg-bg-elevated px-1.5 py-0.5 rounded border border-surface-border">
                &lt;/body&gt;
              </code>{" "}
              tag of any website or portfolio.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
                  Public Token Value
                </label>
                <div className="bg-bg-elevated border border-surface-border rounded-xl px-4 py-2.5 font-mono text-xs text-accent-cyan flex items-center justify-between">
                  <span className="truncate">{widgetTokenToUse}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(widgetTokenToUse, "pubToken")
                    }
                    className="text-text-tertiary hover:text-white transition-colors p-1"
                    title="Copy Public Token"
                  >
                    <md-icon style={{ fontSize: 16 }}>
                      {copiedField === "pubToken" ? "check" : "content_copy"}
                    </md-icon>
                  </button>
                </div>
              </div>

              <div className="relative group mt-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/20 to-cyan-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-[#0d0d12] border border-surface-border-strong rounded-xl p-4 overflow-hidden">
                  <pre className="font-mono text-[13px] text-text-secondary overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    <span className="text-accent-pink">&lt;script</span>
                    {"\n"}
                    {"  "}src=
                    <span className="text-accent-emerald">
                      "{baseUrl}/v1/widget.js"
                    </span>
                    {"\n"}
                    {"  "}data-token=
                    <span className="text-accent-emerald">
                      "{widgetTokenToUse}"
                    </span>
                    {"\n"}
                    {"  "}
                    <span className="text-accent-pink">defer</span>
                    {"\n"}
                    <span className="text-accent-pink">
                      &gt;&lt;/script&gt;
                    </span>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(scriptTag, "script")}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-surface-glass border border-surface-border flex items-center justify-center hover:bg-surface-border/80 text-text-secondary hover:text-white transition-all active:scale-95"
                    title="Copy Script"
                  >
                    <md-icon style={{ fontSize: 16 }}>
                      {copiedField === "script" ? "check" : "content_copy"}
                    </md-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SHA-256 Hashed Secret API Credentials */}
        <div className="bg-surface-glass backdrop-blur-xl border border-surface-border rounded-3xl p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/10 blur-[100px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <md-icon className="text-accent-purple">lock</md-icon>
                  Secret API Key
                </h2>
                <span className="text-[10px] font-mono uppercase bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-2 py-0.5 rounded-full">
                  SHA-256 Hashed in DB
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                Used for backend API access (`pct_secret_...`). Raw key is never
                stored in DB.
              </p>
            </div>

            <button
              onClick={() => setShowRegenModal(true)}
              className="px-3 py-1.5 rounded-xl bg-surface-border/50 border border-surface-border hover:bg-red-500/20 hover:border-red-500/40 text-text-secondary hover:text-red-300 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <md-icon style={{ fontSize: 16 }}>refresh</md-icon>
              Regenerate Key
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-1">
            {/* Project ID */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
                Project ID
              </label>
              <div className="bg-bg-elevated border border-surface-border rounded-xl px-4 py-2.5 font-mono text-xs text-text-primary flex items-center justify-between">
                <span>{project.id}</span>
                <button
                  onClick={() => copyToClipboard(project.id, "projectId")}
                  className="text-text-tertiary hover:text-white transition-colors p-1"
                  title="Copy Project ID"
                >
                  <md-icon style={{ fontSize: 16 }}>
                    {copiedField === "projectId" ? "check" : "content_copy"}
                  </md-icon>
                </button>
              </div>
            </div>

            {/* Secret API Key (Pure Masked Display) */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
                Secret API Key
              </label>
              <div className="bg-bg-elevated border border-surface-border rounded-xl px-4 py-2.5 font-mono text-xs text-text-tertiary flex items-center justify-between gap-2 overflow-hidden">
                <span className="font-mono tracking-widest">
                  ••••••••••••••••••••••••••••••••••••••••
                </span>
                <span className="text-[10px] font-mono uppercase bg-surface-border px-2 py-0.5 rounded text-text-tertiary shrink-0">
                  Hidden
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-1">
                For security, secret keys are stored strictly as SHA-256 hashes
                in the database and cannot be unmasked. Generate a new key if
                lost.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Code Examples Section */}
      <motion.div
        variants={item}
        className="bg-surface-glass backdrop-blur-xl border border-surface-border rounded-3xl p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <md-icon className="text-accent-pink">code</md-icon>
              Sample API Call Implementations
            </h2>
            <p className="text-sm text-text-secondary">
              Placeholders{" "}
              <code className="font-mono text-xs text-accent-pink">
                &#123;SECRET_KEY&#125;
              </code>{" "}
              and{" "}
              <code className="font-mono text-xs text-accent-pink">
                &#123;PROJECT_ID&#125;
              </code>{" "}
              show exact usage format.
            </p>
          </div>

          {/* Language Tabs */}
          <div className="flex bg-[#0d0d12] border border-surface-border p-1 rounded-2xl shrink-0">
            {[
              { id: "python", label: "Python", icon: "terminal" },
              { id: "curl", label: "cURL / JSON", icon: "data_object" },
              { id: "javascript", label: "JavaScript", icon: "javascript" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium font-mono flex items-center gap-2 transition-all ${
                  activeCodeTab === tab.id
                    ? "bg-accent-cyan text-black font-semibold shadow-md"
                    : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                <md-icon style={{ fontSize: 16 }}>{tab.icon}</md-icon>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-indigo/10 via-accent-purple/10 to-accent-pink/10 rounded-2xl blur-md opacity-70" />
          <div className="relative bg-[#0b0b10] border border-surface-border-strong rounded-2xl p-5 overflow-hidden">
            <pre className="font-mono text-xs md:text-sm text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
              {activeCodeTab === "python" && pythonCode}
              {activeCodeTab === "curl" && jsonCurlCode}
              {activeCodeTab === "javascript" && jsCode}
            </pre>
            <button
              onClick={() =>
                copyToClipboard(
                  activeCodeTab === "python"
                    ? pythonCode
                    : activeCodeTab === "curl"
                      ? jsonCurlCode
                      : jsCode,
                  `code_${activeCodeTab}`,
                )
              }
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-surface-glass border border-surface-border flex items-center gap-1.5 text-xs text-text-secondary hover:text-white hover:bg-surface-border transition-all active:scale-95 shadow-md"
            >
              <md-icon style={{ fontSize: 16 }}>
                {copiedField === `code_${activeCodeTab}`
                  ? "check"
                  : "content_copy"}
              </md-icon>
              <span>
                {copiedField === `code_${activeCodeTab}`
                  ? "Copied"
                  : "Copy Snippet"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Live API Tester */}
      <motion.div
        variants={item}
        className="bg-surface-glass backdrop-blur-xl border border-surface-border rounded-3xl p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/10 blur-[100px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan animate-pulse" />
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <md-icon className="text-accent-cyan">play_circle</md-icon>
              Live API Tester
            </h2>
          </div>
          <p className="text-sm text-text-secondary">
            Test the{" "}
            <code className="font-mono text-xs text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded border border-accent-cyan/20">
              POST /v1/chat/message
            </code>{" "}
            backend endpoint directly against this project's vectorized
            knowledge base in real-time.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={playgroundQuery}
            onChange={(e) => setPlaygroundQuery(e.target.value)}
            placeholder="Type a test question for your portfolio knowledge base..."
            className="flex-1 bg-bg-elevated border border-surface-border rounded-2xl px-5 py-3.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-cyan transition-all shadow-inner"
            onKeyDown={(e) => e.key === "Enter" && handleRunPlaygroundTest()}
          />
          <button
            onClick={handleRunPlaygroundTest}
            disabled={playgroundLoading || !playgroundQuery.trim()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-accent-cyan to-cyan-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg shadow-accent-cyan/20 cursor-pointer"
          >
            {playgroundLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Running API...</span>
              </>
            ) : (
              <>
                <md-icon style={{ fontSize: 18 }}>send</md-icon>
                <span>Send API Request</span>
              </>
            )}
          </button>
        </div>

        {/* Playground Results Drawer */}
        <AnimatePresence>
          {(playgroundResponse || playgroundError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-4 pt-4 border-t border-surface-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary flex items-center gap-2 font-semibold">
                  <md-icon style={{ fontSize: 16 }}>analytics</md-icon>
                  API Response Inspector
                </span>
                {playgroundLatency && (
                  <span className="text-xs font-mono text-accent-cyan bg-accent-cyan/10 px-3 py-1 rounded-full border border-accent-cyan/30 font-semibold">
                    Latency: {playgroundLatency}ms | Status 200 OK
                  </span>
                )}
              </div>

              {playgroundError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-mono flex items-start gap-3">
                  <md-icon className="text-red-400 shrink-0">
                    error_outline
                  </md-icon>
                  <div>{playgroundError}</div>
                </div>
              )}

              {playgroundResponse && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* AI Assistant Output */}
                  <div className="bg-bg-elevated/80 border border-surface-border-strong rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
                    <span className="text-xs font-mono uppercase tracking-wider text-accent-cyan flex items-center gap-1.5 font-bold">
                      <md-icon style={{ fontSize: 16 }}>smart_toy</md-icon>
                      Generated AI Answer
                    </span>
                    <FormattedMarkdown content={playgroundResponse.reply} />
                  </div>

                  {/* Raw JSON Payload */}
                  <div className="bg-bg-elevated/80 border border-surface-border-strong rounded-2xl p-5 flex flex-col gap-2 overflow-hidden shadow-inner">
                    <span className="text-xs font-mono uppercase tracking-wider text-accent-cyan flex items-center gap-1.5 font-bold">
                      <md-icon style={{ fontSize: 16 }}>data_object</md-icon>
                      Raw JSON Response
                    </span>
                    <pre className="font-mono text-[11px] text-cyan-200/90 overflow-x-auto overflow-y-auto max-h-60 leading-relaxed bg-[#09090d] p-3 rounded-xl border border-surface-border custom-scrollbar">
                      {JSON.stringify(playgroundResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirmation Modal for API Key Regeneration */}
      <AnimatePresence>
        {showRegenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-elevated border border-surface-border-strong rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <md-icon style={{ fontSize: 24 }}>warning</md-icon>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Regenerate Secret API Key?
                  </h3>
                  <p className="text-xs text-text-tertiary font-mono">
                    Invalidates previous SHA-256 hash immediately.
                  </p>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Regenerating your Secret API Key will immediately revoke your
                old key. Any external API calls using the old key will stop
                working.
              </p>

              {/* Typing Confirmation Requirement (Non-Pastable) */}
              <div className="flex flex-col gap-2 bg-[#0b0b10] border border-surface-border rounded-2xl p-4">
                <label className="text-xs text-text-secondary">
                  To confirm, type{" "}
                  <span className="font-mono text-white select-none bg-surface-border px-1.5 py-0.5 rounded text-[11px] font-semibold text-red-300">
                    "I confirm to regenerate the key"
                  </span>{" "}
                  below:
                </label>
                <input
                  type="text"
                  value={regenConfirmInput}
                  onChange={(e) => setRegenConfirmInput(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  placeholder="Type exact phrase here..."
                  className="w-full bg-bg-elevated border border-surface-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-red-500/60 transition-all select-none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <span className="text-[10px] text-text-tertiary font-mono italic">
                  * Note: Copy-pasting is disabled. Phrase must be typed
                  manually.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => {
                    setShowRegenModal(false);
                    setRegenConfirmInput("");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-surface-glass border border-surface-border text-text-secondary hover:text-white text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateKey}
                  disabled={
                    isRegenerating ||
                    regenConfirmInput.trim() !==
                      "I confirm to regenerate the key"
                  }
                  className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-red-500/20"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <span>Yes, Regenerate Key</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ONE-TIME SECRET API KEY DISPLAY MODAL */}
      <AnimatePresence>
        {newSecretKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-elevated border border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-6 relative"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <md-icon style={{ fontSize: 26 }}>key_visualizer</md-icon>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Your Secret API Key
                  </h3>
                  <span className="text-xs text-amber-400 font-mono font-medium">
                    One-Time Security Display
                  </span>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <md-icon style={{ fontSize: 16 }}>warning</md-icon>
                  This won't be shown again. Store it somewhere safe!
                </span>
                <p className="text-xs text-amber-200/80 leading-relaxed mt-1">
                  For security, the server hashes this key using SHA-256 and
                  deletes the raw key from database storage. Once you close this
                  box, this raw key cannot be retrieved or shown again.
                </p>
              </div>

              {/* Secret Key Raw Display Box */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
                  Secret API Key
                </label>
                <div className="bg-[#0b0b10] border border-surface-border-strong rounded-xl p-4 font-mono text-xs md:text-sm text-emerald-300 flex items-center justify-between gap-3 overflow-hidden">
                  <span className="truncate selection:bg-emerald-500/30">
                    {newSecretKeyModal}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(newSecretKeyModal, "modalSecretKey")
                    }
                    className="px-3 py-1.5 rounded-lg bg-surface-glass border border-surface-border flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-all active:scale-95 shrink-0"
                  >
                    <md-icon style={{ fontSize: 16 }}>
                      {copiedField === "modalSecretKey"
                        ? "check"
                        : "content_copy"}
                    </md-icon>
                    <span>
                      {copiedField === "modalSecretKey" ? "Copied" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Close / Dismiss Action */}
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => setNewSecretKeyModal(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  <md-icon style={{ fontSize: 18 }}>check_circle</md-icon>
                  <span>I Have Saved My Secret Key</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
