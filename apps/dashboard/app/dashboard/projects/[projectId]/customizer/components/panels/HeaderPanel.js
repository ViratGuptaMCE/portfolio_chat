"use client";

import React from "react";

export default function HeaderPanel({ draftConfig, onChange }) {
  const header = draftConfig?.header || {};

  const handleUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      header: {
        ...header,
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 text-xs text-black dark:text-white">
      {/* Bot Name & Tagline */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Identity & Branding
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-[#666] dark:text-[#aaa]">Assistant Name</span>
            <input
              type="text"
              value={header.botName || ""}
              onChange={(e) => handleUpdate("botName", e.target.value)}
              placeholder="e.g. Portfolio Assistant"
              className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium text-[#666] dark:text-[#aaa]">Status Tagline</span>
            <input
              type="text"
              value={header.tagline || ""}
              onChange={(e) => handleUpdate("tagline", e.target.value)}
              placeholder="e.g. Online • Replies instantly"
              className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Bot Avatar Selection */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Bot Avatar Icon
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "robot", icon: "smart_toy", label: "AI Robot" },
            { id: "sparkles", icon: "auto_awesome", label: "Sparkles" },
            { id: "agent", icon: "support_agent", label: "Agent" },
            { id: "custom", icon: "image", label: "Custom URL" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleUpdate("botAvatar", item.id)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                header.botAvatar === item.id
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                  : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        {header.botAvatar === "custom" && (
          <div className="flex flex-col gap-1 mt-1">
            <span className="font-medium text-[#666] dark:text-[#aaa]">Custom Avatar Image URL</span>
            <input
              type="text"
              value={header.customAvatarUrl || ""}
              onChange={(e) => handleUpdate("customAvatarUrl", e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
            />
          </div>
        )}
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Header Background Style & Gradient Palettes */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Header Background Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "solid", label: "Solid Primary Color" },
            { id: "gradient-indigo", label: "Indigo-Violet Gradient" },
            { id: "gradient-blue", label: "Ocean Blue-Cyan Gradient" },
            { id: "gradient-emerald", label: "Emerald-Teal Gradient" },
            { id: "gradient-sunset", label: "Sunset Amber-Pink Gradient" },
            { id: "glass", label: "Translucent Glass" }
          ].map((styleObj) => (
            <button
              key={styleObj.id}
              type="button"
              onClick={() => handleUpdate("backgroundStyle", styleObj.id)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                header.backgroundStyle === styleObj.id
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm font-bold"
                  : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
              }`}
            >
              {styleObj.label}
            </button>
          ))}
        </div>

        {/* Custom Header Bg Color if Solid selected */}
        {header.backgroundStyle === "solid" && (
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between mt-1">
            <span className="font-medium text-xs">Custom Header Bg Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={header.customBgColor || draftConfig?.appearance?.primaryColor || "#6366f1"}
                onChange={(e) => handleUpdate("customBgColor", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={header.customBgColor || draftConfig?.appearance?.primaryColor || "#6366f1"}
                onChange={(e) => handleUpdate("customBgColor", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
