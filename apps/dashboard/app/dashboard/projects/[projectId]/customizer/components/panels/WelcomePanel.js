"use client";

import React from "react";

export default function WelcomePanel({ draftConfig, onChange }) {
  const welcome = draftConfig?.welcome || {};

  const handleUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      welcome: {
        ...welcome,
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 text-xs text-black dark:text-white">
      {/* Primary Greeting */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Primary Greeting Message
        </label>
        <input
          type="text"
          value={welcome.greeting || ""}
          onChange={(e) => handleUpdate("greeting", e.target.value)}
          placeholder="Hi! How can I help you today?"
          className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
        />
        <span className="text-[10px] text-[#888]">First message displayed at the top of the chat window when opened.</span>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Subgreeting Message */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Subgreeting / Description Banner
        </label>
        <textarea
          rows={3}
          value={welcome.subgreeting || ""}
          onChange={(e) => handleUpdate("subgreeting", e.target.value)}
          placeholder="Ask me anything about my work, skills, or experience."
          className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-black dark:focus:border-white resize-none"
        />
      </div>
    </div>
  );
}
