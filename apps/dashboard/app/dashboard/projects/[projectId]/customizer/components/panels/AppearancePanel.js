"use client";

import React from "react";
import { THEME_PRESETS } from "../../../../../customizer-constants";

export default function AppearancePanel({ draftConfig, onChange, onApplyPreset }) {
  const appearance = draftConfig?.appearance || {};

  const handleUpdate = (field, value) => {
    onChange({
      ...draftConfig,
      appearance: {
        ...appearance,
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 text-xs text-black dark:text-white">
      {/* Theme Presets */}
      <div className="flex flex-col gap-2">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">palette</span>
          Quick Theme Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((preset) => {
            const isSelected = appearance.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset.config)}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-black dark:border-white bg-[#fafafa] dark:bg-[#18181b] shadow-sm ring-1 ring-black dark:ring-white font-bold"
                    : "border-[#e5e5e5] dark:border-[#222] bg-white dark:bg-[#0a0a0a] hover:border-[#aaa] dark:hover:border-[#444]"
                }`}
              >
                <span className="text-xs truncate">{preset.name}</span>
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: preset.config.primaryColor }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Theme Mode (Dark, Light, Auto) */}
      <div className="flex flex-col gap-2">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Theme Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "dark", label: "Dark" },
            { id: "light", label: "Light" },
            { id: "auto", label: "Auto" }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleUpdate("themeMode", mode.id)}
              className={`py-2 px-2 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer text-center ${
                appearance.themeMode === mode.id
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm font-bold"
                  : "bg-[#fafafa] dark:bg-[#121215] border-[#e5e5e5] dark:border-[#27272a] text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors & Palette Picker */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Color Palette Overrides
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {/* Primary Color */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">Primary Accent Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={appearance.primaryColor || "#6366f1"}
                onChange={(e) => handleUpdate("primaryColor", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={appearance.primaryColor || "#6366f1"}
                onChange={(e) => handleUpdate("primaryColor", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">Widget Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={appearance.backgroundColor || "#111113"}
                onChange={(e) => handleUpdate("backgroundColor", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={appearance.backgroundColor || "#111113"}
                onChange={(e) => handleUpdate("backgroundColor", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>

          {/* Text Color */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">Widget Text Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={appearance.textColor || "#ffffff"}
                onChange={(e) => handleUpdate("textColor", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={appearance.textColor || "#ffffff"}
                onChange={(e) => handleUpdate("textColor", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>

          {/* Border Color */}
          <div className="p-2.5 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] flex items-center justify-between">
            <span className="font-medium text-xs">Widget Border Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={appearance.borderColor || "#27272a"}
                onChange={(e) => handleUpdate("borderColor", e.target.value)}
                className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input
                type="text"
                value={appearance.borderColor || "#27272a"}
                onChange={(e) => handleUpdate("borderColor", e.target.value)}
                className="w-20 bg-white dark:bg-[#0a0a0a] border border-[#ccc] dark:border-[#333] rounded-lg px-2 py-0.5 text-xs font-mono text-center outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Typography */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Typography
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-[#666] dark:text-[#aaa]">Font Family</span>
            <select
              value={appearance.fontFamily || "Inter, sans-serif"}
              onChange={(e) => handleUpdate("fontFamily", e.target.value)}
              className="bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs font-mono outline-none cursor-pointer"
            >
              <option value="Inter, sans-serif">Inter (Modern Clean)</option>
              <option value="Roboto, sans-serif">Roboto (Corporate)</option>
              <option value="Outfit, sans-serif">Outfit (Playful Display)</option>
              <option value="Fira Code, monospace">Fira Code (Developer Code)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex justify-between font-medium">
              <span>Font Size</span>
              <span className="font-mono text-black dark:text-white font-bold">{appearance.fontSize || 14}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="18"
              step="1"
              value={appearance.fontSize || 14}
              onChange={(e) => handleUpdate("fontSize", parseInt(e.target.value))}
              className="accent-black dark:accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e5e5e5] dark:bg-[#222]" />

      {/* Border Radius & Glassmorphism */}
      <div className="flex flex-col gap-2.5">
        <label className="font-bold font-mono text-xs uppercase tracking-wider text-[#888]">
          Borders & Glassmorphism
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex justify-between font-medium">
              <span>Corner Radius</span>
              <span className="font-mono text-black dark:text-white font-bold">{appearance.borderRadius ?? 16}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              step="2"
              value={appearance.borderRadius ?? 16}
              onChange={(e) => handleUpdate("borderRadius", parseInt(e.target.value))}
              className="accent-black dark:accent-white cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex justify-between font-medium">
              <span>Background Opacity</span>
              <span className="font-mono text-black dark:text-white font-bold">{appearance.backgroundOpacity ?? 95}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={appearance.backgroundOpacity ?? 95}
              onChange={(e) => handleUpdate("backgroundOpacity", parseInt(e.target.value))}
              className="accent-black dark:accent-white cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafafa] dark:bg-[#121215] border border-[#e5e5e5] dark:border-[#27272a]">
            <div className="flex flex-col">
              <span className="font-semibold">Glassmorphism Backdrop Blur</span>
              <span className="text-[10px] text-[#888]">Apply backdrop blur filter</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(appearance.blurEffect)}
              onChange={(e) => handleUpdate("blurEffect", e.target.checked)}
              className="w-4 h-4 accent-black dark:accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
