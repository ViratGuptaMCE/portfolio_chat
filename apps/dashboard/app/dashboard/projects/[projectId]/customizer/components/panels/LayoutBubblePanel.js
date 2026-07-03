"use client";

import React from "react";

export default function LayoutBubblePanel({ draftConfig, onChange }) {
  const layout = draftConfig?.layout || {};
  const bubbles = draftConfig?.bubbles || {};
  const input = draftConfig?.input || {};

  const handleLayoutUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      layout: { ...layout, [field]: value }
    });
  };

  const handleBubblesUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      bubbles: { ...bubbles, [field]: value }
    });
  };

  const handleInputUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      input: { ...input, [field]: value }
    });
  };

  return (
    <div className="flex flex-col gap-5 text-xs text-black dark:text-white">
      {/* Window Dimensions */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Chat Window Dimensions (Desktop)
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex justify-between font-medium">
              <span>Window Width</span>
              <span className="font-mono text-black dark:text-white font-bold">{layout.width || 380}px</span>
            </div>
            <input
              type="range"
              min="300"
              max="500"
              step="10"
              value={layout.width || 380}
              onChange={(e) => handleLayoutUpdate("width", parseInt(e.target.value))}
              className="accent-black dark:accent-white cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex justify-between font-medium">
              <span>Window Height</span>
              <span className="font-mono text-black dark:text-white font-bold">{layout.height || 580}px</span>
            </div>
            <input
              type="range"
              min="400"
              max="750"
              step="10"
              value={layout.height || 580}
              onChange={(e) => handleLayoutUpdate("height", parseInt(e.target.value))}
              className="accent-black dark:accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Bubble Colors */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Message Bubble Colors
        </label>
        <div className="flex flex-col gap-2">
          {/* User Bubble Bg */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">User Bubble Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bubbles.userBg || "#6366f1"}
                onChange={(e) => handleBubblesUpdate("userBg", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={bubbles.userBg || "#6366f1"}
                onChange={(e) => handleBubblesUpdate("userBg", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>

          {/* User Bubble Text */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">User Bubble Text</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bubbles.userText || "#ffffff"}
                onChange={(e) => handleBubblesUpdate("userText", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={bubbles.userText || "#ffffff"}
                onChange={(e) => handleBubblesUpdate("userText", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>

          {/* Bot Bubble Bg */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">Bot Bubble Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bubbles.botBg || "#18181b"}
                onChange={(e) => handleBubblesUpdate("botBg", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={bubbles.botBg || "#18181b"}
                onChange={(e) => handleBubblesUpdate("botBg", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>

          {/* Bot Bubble Text */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">Bot Bubble Text</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bubbles.botText || "#ffffff"}
                onChange={(e) => handleBubblesUpdate("botText", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={bubbles.botText || "#ffffff"}
                onChange={(e) => handleBubblesUpdate("botText", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Input Placeholder */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Input Placeholder Text
        </label>
        <input
          type="text"
          value={input.placeholder || ""}
          onChange={(e) => handleInputUpdate("placeholder", e.target.value)}
          placeholder="Ask me anything..."
          className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
        />
      </div>
    </div>
  );
}
