"use client";

import React from "react";

export default function PersonalityPanel({ draftConfig, onChange }) {
  const personality = draftConfig?.personality || {};

  const handleUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      personality: {
        ...personality,
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 text-xs text-black dark:text-white">
      {/* Persona Tone Presets */}
      <div className="flex flex-col gap-2">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Persona & Communication Tone
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: "professional", label: "Professional" },
            { id: "friendly", label: "Friendly" },
            { id: "casual", label: "Casual" },
            { id: "technical", label: "Technical" },
            { id: "formal", label: "Formal" },
            { id: "sales", label: "Sales & Demo" },
            { id: "funny", label: "Witty & Funny" }
          ].map((toneObj) => (
            <button
              key={toneObj.id}
              type="button"
              onClick={() => handleUpdate("tone", toneObj.id)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                personality.tone === toneObj.id
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                  : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
              }`}
            >
              {toneObj.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Creativity Temperature Slider */}
      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
        <div className="flex justify-between font-medium">
          <span className="font-bold">Creativity / LLM Temperature</span>
          <span className="font-mono text-black dark:text-white font-bold">
            {personality.creativity ?? 0.5}
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.1"
          value={personality.creativity ?? 0.5}
          onChange={(e) => handleUpdate("creativity", parseFloat(e.target.value))}
          className="accent-black dark:accent-white cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#888] font-mono mt-1">
          <span>0.0 (Strict Factual)</span>
          <span>0.5 (Balanced)</span>
          <span>1.0 (Creative & Conversational)</span>
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Writing Style & Emoji Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Writing Style */}
        <div className="flex flex-col gap-2">
          <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
            Response Depth & Length
          </label>
          <select
            value={personality.responseLength || "balanced"}
            onChange={(e) => handleUpdate("responseLength", e.target.value)}
            className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono outline-none cursor-pointer"
          >
            <option value="concise">Concise & Direct (1-2 sentences)</option>
            <option value="balanced">Balanced Paragraphs (Recommended)</option>
            <option value="detailed">Detailed & Comprehensive</option>
          </select>
        </div>

        {/* Emoji Usage */}
        <div className="flex flex-col gap-2">
          <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
            Emoji Frequency
          </label>
          <select
            value={personality.emojiUsage || "moderate"}
            onChange={(e) => handleUpdate("emojiUsage", e.target.value)}
            className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono outline-none cursor-pointer"
          >
            <option value="none">None (Zero emojis)</option>
            <option value="moderate">Moderate (Subtle emojis)</option>
            <option value="expressive">Expressive 🎉 (Frequent emojis)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
