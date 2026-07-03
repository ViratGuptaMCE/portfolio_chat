"use client";

import React from "react";

export default function LauncherPanel({ draftConfig, onChange }) {
  const launcher = draftConfig?.launcher || {};

  const handleUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      launcher: {
        ...launcher,
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 text-xs text-black dark:text-white">
      {/* Bubble Shape */}
      <div className="flex flex-col gap-2">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Launcher Shape
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "circle", label: "Circle" },
            { id: "square", label: "Rounded" },
            { id: "pill", label: "Pill" },
            { id: "floating", label: "Floating" }
          ].map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => handleUpdate("shape", shape.id)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer text-center ${
                launcher.shape === shape.id
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                  : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Launcher Icon */}
      <div className="flex flex-col gap-3">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Launcher Icon
        </label>
        <div className="grid grid-cols-6 gap-2">
          {[
            "chat_bubble",
            "support_agent",
            "forum",
            "smart_toy",
            "auto_awesome",
            "contact_support"
          ].map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => handleUpdate("icon", iconName)}
              className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                launcher.icon === iconName
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                  : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{iconName}</span>
            </button>
          ))}
        </div>

        {/* Custom Icon URL Input */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="font-medium text-[#666] dark:text-[#aaa]">Or Custom Icon Image URL (SVG/PNG)</span>
          <input
            type="text"
            value={launcher.customIconUrl || ""}
            onChange={(e) => handleUpdate("customIconUrl", e.target.value)}
            placeholder="https://example.com/icon.svg"
            className="w-full bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-black dark:focus:border-white"
          />
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Launcher Size & Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Launcher Size */}
        <div className="flex flex-col gap-2">
          <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
            Launcher Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "small", label: "Small (48px)" },
              { id: "medium", label: "Medium (56px)" },
              { id: "large", label: "Large (64px)" }
            ].map((sizeObj) => (
              <button
                key={sizeObj.id}
                type="button"
                onClick={() => handleUpdate("size", sizeObj.id)}
                className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                  launcher.size === sizeObj.id
                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                    : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
                }`}
              >
                {sizeObj.label}
              </button>
            ))}
          </div>
        </div>

        {/* Launcher Animation */}
        <div className="flex flex-col gap-2">
          <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
            Attention Animation
          </label>
          <select
            value={launcher.animation || "pulse"}
            onChange={(e) => handleUpdate("animation", e.target.value)}
            className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono outline-none cursor-pointer"
          >
            <option value="pulse">Pulse (Glow Pulse)</option>
            <option value="bounce">Bounce (Vertical Bounce)</option>
            <option value="shake">Shake (Gentle Shake)</option>
            <option value="glow">Glow Ring</option>
            <option value="none">None (Static)</option>
          </select>
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Position & Offsets */}
      <div className="flex flex-col gap-3">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Screen Placement & Offsets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["bottom-right", "bottom-left"].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => handleUpdate("position", pos)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer text-center ${
                launcher.position === pos
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                  : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
              }`}
            >
              {pos === "bottom-right" ? "Bottom Right" : "Bottom Left"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex justify-between font-medium">
              <span>Bottom Offset</span>
              <span className="font-mono text-black dark:text-white">{launcher.bottomPadding ?? 24}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="64"
              step="4"
              value={launcher.bottomPadding ?? 24}
              onChange={(e) => handleUpdate("bottomPadding", parseInt(e.target.value))}
              className="accent-black dark:accent-white cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex justify-between font-medium">
              <span>Side Offset</span>
              <span className="font-mono text-black dark:text-white">{launcher.sidePadding ?? 24}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="64"
              step="4"
              value={launcher.sidePadding ?? 24}
              onChange={(e) => handleUpdate("sidePadding", parseInt(e.target.value))}
              className="accent-black dark:accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
