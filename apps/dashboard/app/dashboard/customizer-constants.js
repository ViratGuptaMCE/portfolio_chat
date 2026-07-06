export const DEFAULT_WIDGET_CONFIG = {
  version: 1,
  appearance: {
    presetId: "minimal-dark",
    themeMode: "dark",
    primaryColor: "#06b6d4",
    secondaryColor: "#09090b",
    backgroundColor: "#111113",
    textColor: "#ffffff",
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    borderRadius: 16,
    borderThickness: 1,
    borderColor: "#27272a",
    shadowStyle: "lg",
    backgroundOpacity: 95,
    blurEffect: true
  },
  launcher: {
    shape: "circle",
    icon: "chat_bubble",
    customIconUrl: "",
    size: "medium",
    animation: "pulse",
    position: "bottom-right",
    bottomPadding: 24,
    sidePadding: 24
  },
  header: {
    logoUrl: "",
    showLogo: true,
    botAvatar: "robot",
    customAvatarUrl: "",
    botName: "AI Assistant",
    tagline: "Online • Replies instantly",
    backgroundStyle: "solid"
  },
  welcome: {
    greeting: "Hi! How can I help you today?",
    subgreeting: "Ask me anything about my experience, skills, or projects.",
    autoOpenDelaySeconds: 0,
    enableSound: false
  },
  layout: {
    width: 380,
    height: 580,
    responsiveMobile: true,
    mobileFullscreen: true,
    compactMode: false,
    messageSpacing: 12,
    padding: 16
  },
  bubbles: {
    userBg: "#06b6d4",
    userText: "#000000",
    botBg: "#18181b",
    botText: "#f4f4f5",
    borderRadius: 14,
    showTimestamps: true,
    showReadReceipts: true,
    typingIndicatorStyle: "dots"
  },
  input: {
    placeholder: "Ask me anything...",
    autoExpand: true,
    sendIcon: "send",
    sendColor: "#06b6d4"
  },
  mobile: {
    mode: "bottom-sheet",
    swipeToClose: true,
    hideOnMobile: false,
    hideOnDesktop: false
  },
  animations: {
    entrance: "fade-slide",
    transitionSpeedMs: 250,
    hoverEffects: true,
    buttonRipple: true
  },
  personality: {
    assistantName: "AI Assistant",
    tone: "professional",
    writingStyle: "concise",
    responseLength: "balanced",
    creativity: 0.5,
    emojiUsage: "moderate",
    language: "en"
  },
  suggestedQuestions: [
    "💰 What are your rates?",
    "🛠️ What is your tech stack?",
    "📅 How can I contact you?",
    "📁 Can I see your portfolio projects?"
  ],
  richMessages: {
    enableActionButtons: true,
    enableFeedbackRating: true
  },
  developer: {
    customCss: "",
    customJs: "",
    allowedDomains: [],
    webhookUrl: "",
    debugMode: false
  }
};

export const THEME_PRESETS = [
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Sleek dark zinc theme with vibrant cyan accents",
    config: {
      presetId: "minimal-dark",
      themeMode: "dark",
      primaryColor: "#06b6d4",
      secondaryColor: "#09090b",
      backgroundColor: "#111113",
      textColor: "#ffffff",
      fontFamily: "Inter, sans-serif",
      borderRadius: 16,
      borderColor: "#27272a",
      userBg: "#06b6d4",
      userText: "#000000",
      botBg: "#18181b",
      botText: "#f4f4f5"
    }
  },
  {
    id: "clean-corporate",
    name: "Clean Corporate",
    description: "Professional light theme with deep ocean blue accents",
    config: {
      presetId: "clean-corporate",
      themeMode: "light",
      primaryColor: "#0284c7",
      secondaryColor: "#ffffff",
      backgroundColor: "#f8fafc",
      textColor: "#0f172a",
      fontFamily: "Roboto, sans-serif",
      borderRadius: 12,
      borderColor: "#e2e8f0",
      userBg: "#0284c7",
      userText: "#ffffff",
      botBg: "#f1f5f9",
      botText: "#0f172a"
    }
  },
  {
    id: "frosted-glass",
    name: "Frosted Glass",
    description: "Modern glassmorphism effect with backdrop blur",
    config: {
      presetId: "frosted-glass",
      themeMode: "dark",
      primaryColor: "#8b5cf6",
      secondaryColor: "#18181b",
      backgroundColor: "rgba(24, 24, 27, 0.75)",
      textColor: "#ffffff",
      fontFamily: "Outfit, sans-serif",
      borderRadius: 20,
      borderColor: "rgba(255, 255, 255, 0.15)",
      backgroundOpacity: 85,
      blurEffect: true,
      userBg: "#8b5cf6",
      userText: "#ffffff",
      botBg: "rgba(255, 255, 255, 0.08)",
      botText: "#ffffff"
    }
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    description: "High-contrast dark theme with emerald glow",
    config: {
      presetId: "cyber-neon",
      themeMode: "dark",
      primaryColor: "#10b981",
      secondaryColor: "#050505",
      backgroundColor: "#0a0a0a",
      textColor: "#ecfdf5",
      fontFamily: "Fira Code, monospace",
      borderRadius: 8,
      borderColor: "#059669",
      userBg: "#10b981",
      userText: "#000000",
      botBg: "#121212",
      botText: "#a7f3d0"
    }
  },
  {
    id: "playful-rounded",
    name: "Playful Rounded",
    description: "Friendly rounded aesthetic with purple pastel tones",
    config: {
      presetId: "playful-rounded",
      themeMode: "light",
      primaryColor: "#a855f7",
      secondaryColor: "#ffffff",
      backgroundColor: "#faf5ff",
      textColor: "#3b0764",
      fontFamily: "Outfit, sans-serif",
      borderRadius: 24,
      borderColor: "#f3e8ff",
      userBg: "#a855f7",
      userText: "#ffffff",
      botBg: "#f3e8ff",
      botText: "#3b0764"
    }
  },
  {
    id: "modern-slate",
    name: "Modern Slate",
    description: "Muted warm slate gray with amber highlights",
    config: {
      presetId: "modern-slate",
      themeMode: "dark",
      primaryColor: "#f59e0b",
      secondaryColor: "#0f172a",
      backgroundColor: "#1e293b",
      textColor: "#f8fafc",
      fontFamily: "Inter, sans-serif",
      borderRadius: 14,
      borderColor: "#334155",
      userBg: "#f59e0b",
      userText: "#000000",
      botBg: "#334155",
      botText: "#f8fafc"
    }
  }
];
