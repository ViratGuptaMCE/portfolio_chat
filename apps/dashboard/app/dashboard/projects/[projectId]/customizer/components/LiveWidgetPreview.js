"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveWidgetPreview({ draftConfig, project }) {
  const [deviceFrame, setDeviceFrame] = useState("desktop"); // 'desktop' | 'mobile'
  const [isOpen, setIsOpen] = useState(true);
  const [testInput, setTestInput] = useState("");
  const [customTestMessages, setCustomTestMessages] = useState([]);

  const appearance = draftConfig?.appearance || {};
  const launcher = draftConfig?.launcher || {};
  const header = draftConfig?.header || {};
  const welcome = draftConfig?.welcome || {};
  const layout = draftConfig?.layout || {};
  const bubbles = draftConfig?.bubbles || {};
  const input = draftConfig?.input || {};
  const suggestedQuestions = draftConfig?.suggestedQuestions || [];

  const primaryGreeting = welcome.greeting || "Hello! I am your portfolio AI assistant. Feel free to ask me about skills, projects, or work experience!";

  const allMessages = [
    {
      id: "primary-greeting",
      role: "assistant",
      content: primaryGreeting
    },
    ...customTestMessages
  ];

  const handleSendTestMessage = (textToSend) => {
    const query = textToSend || testInput;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), role: "user", content: query };
    const botMsg = {
      id: Date.now() + 1,
      role: "assistant",
      content: "This is a live test preview response. Don't worry you will see actual response when embeded."
    };

    setCustomTestMessages((prev) => [...prev, userMsg, botMsg]);
    setTestInput("");
  };

  const handleResetTestChat = () => {
    setCustomTestMessages([]);
  };

  // --- Dynamic Theme & Color Overrides Computation ---
  const themeMode = appearance.themeMode || "dark";
  const primaryColor = appearance.primaryColor || "#6366f1";
  
  // Base default colors depending on theme mode
  let baseBg = themeMode === "light" ? "#ffffff" : "#111113";
  let baseText = themeMode === "light" ? "#0f172a" : "#ffffff";
  let baseBorder = themeMode === "light" ? "#e2e8f0" : "#27272a";
  let baseInputBg = themeMode === "light" ? "#f8fafc" : "#18181b";

  // Explicit user color overrides from Appearance panel
  const computedBgHex = appearance.backgroundColor || baseBg;
  const computedText = appearance.textColor || baseText;
  const computedBorder = appearance.borderColor || baseBorder;
  const computedInputBg = appearance.backgroundColor ? `${appearance.backgroundColor}cc` : baseInputBg;

  // Convert Hex background color to RGBA using backgroundOpacity (20% - 100%)
  const hexToRgba = (hex, opacityPercent) => {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    if (cleanHex.length !== 6) return hex;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const alpha = (opacityPercent ?? 95) / 100;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const computedBg = hexToRgba(computedBgHex, appearance.backgroundOpacity);
  const blurFilter = appearance.blurEffect ? "blur(16px)" : "none";
  const fontSizePx = `${appearance.fontSize || 14}px`;
  const fontFamilyCss = appearance.fontFamily || "Inter, sans-serif";
  const borderRadiusPx = `${appearance.borderRadius ?? 16}px`;

  // --- Header Background Computation ---
  const getHeaderBgStyle = () => {
    const styleKey = header.backgroundStyle || "solid";
    if (styleKey === "solid") {
      return { backgroundColor: header.customBgColor || primaryColor };
    }
    if (styleKey === "gradient-cyan" || styleKey === "gradient-indigo") {
      return { backgroundImage: "linear-gradient(135deg, #06b6d4, #0891b2)" };
    }
    if (styleKey === "gradient-blue") {
      return { backgroundImage: "linear-gradient(135deg, #0284c7, #06b6d4)" };
    }
    if (styleKey === "gradient-emerald") {
      return { backgroundImage: "linear-gradient(135deg, #10b981, #059669)" };
    }
    if (styleKey === "gradient-sunset") {
      return { backgroundImage: "linear-gradient(135deg, #f59e0b, #ec4899)" };
    }
    if (styleKey === "glass") {
      return { backgroundColor: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)" };
    }
    return { backgroundColor: primaryColor };
  };

  // --- Launcher Shape & Dimensions Computation ---
  const getLauncherHeightNum = () => {
    if (launcher.size === "small") return 48;
    if (launcher.size === "large") return 64;
    return 56;
  };

  const getLauncherSizePx = () => {
    if (launcher.size === "small") return "48px";
    if (launcher.size === "large") return "64px";
    return "56px";
  };

  const launcherHeightNum = getLauncherHeightNum();
  const bottomPaddingNum = launcher.bottomPadding ?? 24;
  const sidePaddingNum = launcher.sidePadding ?? 24;

  // Bottom position for Chat Window in Desktop mode so it ends 12px ABOVE top of launcher button!
  const chatWindowBottomPx = `${bottomPaddingNum + launcherHeightNum + 12}px`;

  // Dynamic Attention Animation Physics
  const getAttentionAnimation = () => {
    if (isOpen) return { opacity: 1, scale: 1, y: 0, rotate: 0 };
    const animType = launcher.animation || "pulse";
    if (animType === "bounce") {
      return {
        opacity: 1,
        y: [0, -12, 0],
        transition: { duration: 1.6, repeat: Infinity, ease: [0.77, 0, 0.175, 1] }
      };
    }
    if (animType === "pulse") {
      return {
        opacity: 1,
        scale: [1, 1.07, 1],
        transition: { duration: 2, repeat: Infinity, ease: [0.23, 1, 0.32, 1] }
      };
    }
    if (animType === "shake") {
      return {
        opacity: 1,
        rotate: [0, -10, 10, -8, 8, -4, 4, 0],
        scale: [1, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1],
        transition: { duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }
      };
    }
    return { opacity: 1, scale: 1, y: 0, rotate: 0 };
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-205">
      {/* Top Preview Control Bar */}
      <div className="bg-white dark:bg-[#111] p-3.5 rounded-2xl border border-[#e5e5e5] dark:border-[#222] flex items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-1.5 bg-[#fafafa] dark:bg-[#18181b] p-1 rounded-xl border border-[#e5e5e5] dark:border-[#27272a]">
          <button
            type="button"
            onClick={() => setDeviceFrame("desktop")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceFrame === "desktop"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">desktop_windows</span>
            Live View
          </button>
          {/* <button
            type="button"
            onClick={() => setDeviceFrame("mobile")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceFrame === "mobile"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">smartphone</span>
            Mobile Frame
          </button> */}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3.5 py-1.5 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-semibold text-black dark:text-white hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              {isOpen ? "close" : "chat_bubble"}
            </span>
            {isOpen ? "Close Window" : "Open Window"}
          </button>

          <button
            type="button"
            onClick={handleResetTestChat}
            title="Reset Test Chat"
            className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-[#888] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
          </button>
        </div>
      </div>

      {/* Main Spacious Canvas Stage (820px height to fully display window heights up to 750px!) */}
      <div className="flex-1 bg-[#e4e4e7] dark:bg-[#09090b] rounded-[2.5rem] border border-[#e5e5e5] dark:border-[#222] p-6 relative overflow-hidden flex flex-col justify-end items-center min-h-205 h-205 shadow-inner">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-size-[20px_20px] opacity-50 pointer-events-none" />

        {/* Screen Container */}
        <div
          className={`relative w-full h-full transition-all duration-300 ${
            deviceFrame === "mobile"
              ? "max-w-[360px] max-h-[640px] my-auto rounded-[3rem] border-[12px] border-[#27272a] bg-[#111] shadow-2xl overflow-hidden self-center"
              : ""
          }`}
        >
          {/* Chat Window Box */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.25 }}
                style={{
                  width: deviceFrame === "mobile" ? "100%" : `${layout.width || 380}px`,
                  height: deviceFrame === "mobile" ? "100%" : `${layout.height || 540}px`,
                  backgroundColor: computedBg,
                  color: computedText,
                  borderRadius: deviceFrame === "mobile" ? "0" : borderRadiusPx,
                  fontFamily: fontFamilyCss,
                  fontSize: fontSizePx,
                  borderColor: computedBorder,
                  backdropFilter: blurFilter,
                  bottom: deviceFrame === "mobile" ? "0" : chatWindowBottomPx,
                  right: deviceFrame === "mobile" ? "0" : (launcher.position === "bottom-left" ? "auto" : `${sidePaddingNum}px`),
                  left: deviceFrame === "mobile" ? "0" : (launcher.position === "bottom-left" ? `${sidePaddingNum}px` : "auto")
                }}
                className={`flex flex-col border shadow-2xl overflow-hidden ${
                  deviceFrame === "desktop" ? "absolute z-20" : "relative w-full h-full"
                }`}
              >
                {/* Widget Header */}
                <div
                  style={{
                    ...getHeaderBgStyle(),
                    fontFamily: fontFamilyCss
                  }}
                  className="p-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 text-white"
                >
                  <div className="flex items-center gap-3">
                    {/* Bot Avatar */}
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                      {header.botAvatar === "custom" && header.customAvatarUrl ? (
                        <img src={header.customAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-lg">
                          {header.botAvatar === "sparkles" ? "auto_awesome" : header.botAvatar === "agent" ? "support_agent" : "smart_toy"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <h4 className="font-bold text-xs leading-tight" style={{ fontFamily: fontFamilyCss }}>
                        {header.botName || project?.name || "AI Assistant"}
                      </h4>
                      <span className="text-[10px] opacity-80 leading-tight" style={{ fontFamily: fontFamilyCss }}>
                        {header.tagline || "Online • Replies instantly"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="opacity-70 hover:opacity-100 transition-opacity p-1 cursor-pointer text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                {/* Messages Body (Font family applies to all messages!) */}
                <div
                  style={{ fontFamily: fontFamilyCss }}
                  className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar"
                >
                  {/* Welcome Subgreeting */}
                  {welcome.subgreeting && (
                    <div
                      style={{ borderColor: computedBorder, fontFamily: fontFamilyCss }}
                      className="p-3 rounded-2xl bg-white/5 border text-xs opacity-90 leading-relaxed"
                    >
                      {welcome.subgreeting}
                    </div>
                  )}

                  {/* Test Messages */}
                  {allMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-1 text-xs max-w-[85%] ${
                        m.role === "user" ? "self-end items-end" : "self-start items-start"
                      }`}
                      style={{ fontFamily: fontFamilyCss }}
                    >
                      <div
                        style={{
                          backgroundColor: m.role === "user" ? (bubbles.userBg || primaryColor) : (bubbles.botBg || "#18181b"),
                          color: m.role === "user" ? (bubbles.userText || "#ffffff") : (bubbles.botText || computedText),
                          borderRadius: borderRadiusPx,
                          fontFamily: fontFamilyCss
                        }}
                        className="p-3 shadow-sm whitespace-pre-wrap leading-relaxed select-text"
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested Starter Prompt Chips */}
                {suggestedQuestions.length > 0 && (
                  <div
                    style={{ borderColor: computedBorder, fontFamily: fontFamilyCss }}
                    className="p-2.5 border-t flex items-center gap-2 overflow-x-auto shrink-0 custom-scrollbar"
                  >
                    {suggestedQuestions.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleSendTestMessage(chip)}
                        style={{
                          borderColor: computedBorder,
                          backgroundColor: themeMode === "light" ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                          color: computedText,
                          fontFamily: fontFamilyCss
                        }}
                        className="px-3 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap hover:opacity-80 transition-all cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Box Footer */}
                <div
                  style={{ borderColor: computedBorder, fontFamily: fontFamilyCss }}
                  className="p-3 border-t flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTestMessage()}
                    placeholder={input.placeholder || "Ask me anything..."}
                    style={{
                      backgroundColor: computedInputBg,
                      color: computedText,
                      borderColor: computedBorder,
                      fontFamily: fontFamilyCss
                    }}
                    className="flex-1 border rounded-xl px-3.5 py-2 text-xs outline-none focus:opacity-90"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendTestMessage()}
                    style={{ backgroundColor: input.sendColor || primaryColor }}
                    className="w-8 h-8 rounded-xl text-white flex items-center justify-center hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">
                      send
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glow Ring Aura Layer */}
          {launcher.animation === "glow" && !isOpen && (
            <motion.div
              animate={{ scale: [1, 1.45, 1.65], opacity: [0.75, 0.35, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              style={{
                backgroundColor: primaryColor,
                borderRadius: launcher.shape === "circle" ? "9999px" : launcher.shape === "square" ? "16px" : launcher.shape === "pill" ? "9999px" : "20px",
                width: launcher.shape === "pill" ? "100%" : getLauncherSizePx(),
                height: getLauncherSizePx(),
                bottom: deviceFrame === "mobile" ? "20px" : `${bottomPaddingNum}px`,
                right: deviceFrame === "mobile" ? "20px" : (launcher.position === "bottom-left" ? "auto" : `${sidePaddingNum}px`),
                left: deviceFrame === "mobile" ? "auto" : (launcher.position === "bottom-left" ? `${sidePaddingNum}px` : "auto")
              }}
              className="absolute z-20 pointer-events-none"
            />
          )}

          {/* Launcher Floating Button */}
          <motion.button
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={getAttentionAnimation()}
            onClick={() => setIsOpen(!isOpen)}
            style={{
              backgroundColor: primaryColor,
              color: "#ffffff",
              borderRadius: launcher.shape === "circle" ? "9999px" : launcher.shape === "square" ? "16px" : launcher.shape === "pill" ? "9999px" : "20px",
              width: launcher.shape === "pill" ? "auto" : getLauncherSizePx(),
              height: getLauncherSizePx(),
              paddingLeft: launcher.shape === "pill" ? "20px" : "0px",
              paddingRight: launcher.shape === "pill" ? "20px" : "0px",
              bottom: deviceFrame === "mobile" ? "20px" : `${bottomPaddingNum}px`,
              right: deviceFrame === "mobile" ? "20px" : (launcher.position === "bottom-left" ? "auto" : `${sidePaddingNum}px`),
              left: deviceFrame === "mobile" ? "auto" : (launcher.position === "bottom-left" ? `${sidePaddingNum}px` : "auto")
            }}
            className={`flex items-center justify-center absolute z-30 cursor-pointer transition-shadow active:scale-95 ${
              launcher.shape === "floating"
                ? "shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-2 border-white/25 hover:-translate-y-1.5"
                : "shadow-2xl"
            }`}
          >
            {isOpen ? (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xl">close</span>
                {launcher.shape === "pill" && <span className="text-xs font-bold">Close</span>}
              </div>
            ) : launcher.customIconUrl ? (
              <div className="flex items-center gap-2">
                <img src={launcher.customIconUrl} alt="Launcher Icon" className="w-5 h-5 object-contain" />
                {launcher.shape === "pill" && <span className="text-xs font-bold">Chat</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">
                  {launcher.icon || "chat_bubble"}
                </span>
                {launcher.shape === "pill" && <span className="text-xs font-bold font-sans">Chat with AI</span>}
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
