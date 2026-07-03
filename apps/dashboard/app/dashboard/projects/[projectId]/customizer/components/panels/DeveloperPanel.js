"use client";

import React, { useState } from "react";

export default function DeveloperPanel({ draftConfig, onChange, widgetToken, projectId }) {
  const developer = draftConfig?.developer || {};
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [domainInput, setDomainInput] = useState("");

  const handleUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      developer: {
        ...developer,
        [field]: value
      }
    });
  };

  const handleAddDomain = () => {
    if (!domainInput.trim()) return;
    const current = developer.allowedDomains || [];
    if (current.includes(domainInput.trim())) return;

    handleUpdate("allowedDomains", [...current, domainInput.trim()]);
    setDomainInput("");
  };

  const handleRemoveDomain = (domainToRemove) => {
    const current = developer.allowedDomains || [];
    handleUpdate("allowedDomains", current.filter((d) => d !== domainToRemove));
  };

  const embedScript = `<script 
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://portfoliochat.ai'}/widget.js" 
  data-token="${widgetToken || projectId || 'YOUR_WIDGET_TOKEN'}" 
  async>
</script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedScript);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 text-xs text-black dark:text-white">
      {/* Embed Code Snippet */}
      <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
        <div className="flex items-center justify-between">
          <label className="font-bold font-mono text-xs uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">code</span>
            JavaScript Embed Snippet
          </label>
          <button
            type="button"
            onClick={handleCopyEmbed}
            className="px-3 py-1 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-[11px] flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">
              {copiedEmbed ? "check" : "content_copy"}
            </span>
            {copiedEmbed ? "Copied" : "Copy Snippet"}
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-[#09090b] text-[#a7f3d0] font-mono text-[11px] overflow-x-auto border border-[#27272a] select-all">
          {embedScript}
        </pre>
        <span className="text-[10px] text-[#888]">Paste this snippet into your portfolio website HTML before closing &lt;/body&gt; tag.</span>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Custom CSS Editor */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
            Custom CSS Overrides
          </label>
          <span className="text-[10px] font-mono text-[#888]">Scoped under #portfoliochat-widget-root</span>
        </div>
        <textarea
          rows={5}
          value={developer.customCss || ""}
          onChange={(e) => handleUpdate("customCss", e.target.value)}
          placeholder="#portfoliochat-widget-root .chat-header { background: linear-gradient(135deg, #6366f1, #a855f7); }"
          className="bg-[#09090b] text-[#e4e4e7] border border-[#27272a] rounded-xl p-3 text-xs font-mono outline-none focus:border-black dark:focus:border-white resize-y"
        />
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Allowed Domains Whitelist */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Allowed Embedding Domains (Whitelist)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
            placeholder="e.g. myportfolio.com"
            className="flex-1 bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
          />
          <button
            type="button"
            onClick={handleAddDomain}
            className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-4 py-2 font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Add Domain
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(developer.allowedDomains || []).length === 0 ? (
            <span className="text-[11px] text-[#888] font-mono italic">
              No domains whitelisted (Widget allows embedding on any domain).
            </span>
          ) : (
            (developer.allowedDomains || []).map((dom) => (
              <span
                key={dom}
                className="px-3 py-1 rounded-full bg-[#fafafa] dark:bg-[#18181b] border border-[#e5e5e5] dark:border-[#27272a] text-xs font-mono flex items-center gap-1.5"
              >
                <span>{dom}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(dom)}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Webhook URL & Debug Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-[#666] dark:text-[#aaa]">Webhook Event Trigger URL</span>
          <input
            type="text"
            value={developer.webhookUrl || ""}
            onChange={(e) => handleUpdate("webhookUrl", e.target.value)}
            placeholder="https://api.myportfolio.com/webhooks/chat"
            className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] self-end">
          <div className="flex flex-col">
            <span className="font-semibold">Debug Logging</span>
            <span className="text-[10px] text-[#888]">Log widget events to browser console</span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(developer.debugMode)}
            onChange={(e) => handleUpdate("debugMode", e.target.checked)}
            className="w-4 h-4 accent-black dark:accent-white cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
