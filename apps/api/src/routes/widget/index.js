import { db, projects, projectSettings, widgetConfigs, eq, redisDel } from '@portfoliochat/db';

export default async function widgetRoutes(server) {
  // --- 1. Widget Configuration Endpoint ---
  // GET /v1/widget/config?token=pct_pub_xxx
  const getWidgetConfigHandler = async (request, reply) => {
    try {
      const token = request.query.token || request.headers['x-widget-token'] || '';
      if (!token) {
        return reply.status(400).send({ success: false, error: 'Missing widget token parameter' });
      }

      // Safely check if token is UUID format to prevent Postgres invalid syntax errors
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

      // Find project by widgetToken or ID
      const project = await db.query.projects.findFirst({
        where: isUuid
          ? (t, { eq, or }) => or(eq(t.widgetToken, token), eq(t.id, token))
          : (t, { eq }) => eq(t.widgetToken, token)
      });

      if (!project) {
        return reply.status(404).send({ success: false, error: 'Project not found for provided widget token' });
      }

      // Fetch project settings
      const settings = (await db.query.projectSettings.findFirst({
        where: eq(projectSettings.projectId, project.id)
      }).catch(() => null)) || {};

      if (settings.widgetEnabled === false) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Widget embedding is disabled for this project in Project Settings.'
        });
      }

      // Domain verification
      const originHeader = request.headers['origin'] || request.headers['referer'] || '';
      if (originHeader && settings.allowedDomains && settings.allowedDomains.length > 0) {
        try {
          const reqHost = new URL(originHeader).hostname;
          const allowedDomainsList = settings.allowedDomains.map((d) => {
            try { return new URL(d).hostname; } catch (e) { return d.replace(/^https?:\/\//, '').split('/')[0]; }
          });

          if (!allowedDomainsList.includes(reqHost) && reqHost !== 'localhost' && reqHost !== '127.0.0.1') {
            return reply.status(403).send({
              success: false,
              error: `Forbidden: Widget embedding is not permitted on domain '${reqHost}'.`
            });
          }
        } catch (e) {
          console.warn('[WIDGET CONFIG ORIGIN WARN]', e.message);
        }
      }

      // Fetch widget config (Prefer draftConfig if active edits exist, fallback to publishedConfig)
      const widgetConfigRec = await db.query.widgetConfigs.findFirst({
        where: eq(widgetConfigs.projectId, project.id)
      }).catch(() => null);

      const activeConfig = (widgetConfigRec?.draftConfig && Object.keys(widgetConfigRec.draftConfig).length > 0)
        ? widgetConfigRec.draftConfig
        : (widgetConfigRec?.publishedConfig || {});

      const responsePayload = {
        success: true,
        projectId: project.id,
        projectName: project.name,
        config: {
          appearance: {
            presetId: 'minimal-dark',
            themeMode: 'dark',
            primaryColor: '#06b6d4',
            secondaryColor: '#09090b',
            backgroundColor: '#111113',
            textColor: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            borderRadius: 16,
            borderColor: '#27272a',
            backgroundOpacity: 95,
            blurEffect: true,
            ...(activeConfig.appearance || {})
          },
          launcher: {
            shape: 'circle',
            icon: 'chat_bubble',
            customIconUrl: '',
            size: 'medium',
            animation: 'pulse',
            position: 'bottom-right',
            bottomPadding: 24,
            sidePadding: 24,
            ...(activeConfig.launcher || {})
          },
          header: {
            botName: project.name || 'AI Assistant',
            tagline: 'Online • Replies instantly',
            botAvatar: 'robot',
            customAvatarUrl: '',
            backgroundStyle: 'solid',
            customBgColor: '',
            ...(activeConfig.header || {})
          },
          welcome: {
            greeting: 'Hi! How can I help you today?',
            subgreeting: 'Ask me anything about my experience or projects.',
            ...(activeConfig.welcome || {})
          },
          layout: {
            width: 380,
            height: 580,
            responsiveMobile: true,
            padding: 16,
            ...(activeConfig.layout || {})
          },
          bubbles: {
            userBg: activeConfig.appearance?.primaryColor || '#06b6d4',
            userText: '#ffffff',
            botBg: '#18181b',
            botText: '#f4f4f5',
            borderRadius: 14,
            ...(activeConfig.bubbles || {})
          },
          input: {
            placeholder: 'Ask me anything...',
            sendColor: activeConfig.appearance?.primaryColor || '#06b6d4',
            ...(activeConfig.input || {})
          },
          suggestedQuestions: activeConfig.suggestedQuestions || [
            "What are your core technical skills?",
            "Tell me about your recent projects"
          ]
        },
        developerConfig: {
          customCss: settings.customCss || widgetConfigRec?.customCss || '',
          customHtml: settings.customHtml || widgetConfigRec?.customHtml || '',
          widgetVersion: settings.widgetVersion || 'v1.0.0'
        }
      };

      return responsePayload;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  };

  server.get('/config', getWidgetConfigHandler);
  server.get('/v1/widget/config', getWidgetConfigHandler);

  // --- 2. Standalone Embeddable Widget JS Script ---
  // GET /v1/widget.js or GET /widget.js
  const getWidgetJsHandler = async (request, reply) => {
    const protocol = request.headers['x-forwarded-proto'] || request.protocol || 'http';
    const host = request.headers['host'] || 'localhost:8080';
    const apiBaseUrl = `${protocol}://${host}`;

    const widgetScriptContent = `
(function() {
  if (window.PortfolioChatWidgetInitialized) return;
  window.PortfolioChatWidgetInitialized = true;

  // 1. Identify script element & token
  var scriptEl = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) return scripts[i];
    }
    return null;
  })();

  var token = scriptEl ? (scriptEl.getAttribute('data-token') || scriptEl.getAttribute('data-project-token') || '') : '';
  var apiHost = "${apiBaseUrl}";

  if (!token) {
    console.error('[PortfolioChat Widget] Missing required data-token attribute on script tag.');
    return;
  }

  // 2. Fetch Widget Configuration (bust cache with timestamp for instant dev live sync)
  fetch(apiHost + '/v1/widget/config?token=' + encodeURIComponent(token) + '&_t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ': Unable to load widget configuration');
      return res.json();
    })
    .then(function(payload) {
      if (!payload.success || !payload.config) {
        console.error('[PortfolioChat Widget] Invalid widget configuration response:', payload);
        return;
      }
      initWidget(payload, token, apiHost);
    })
    .catch(function(err) {
      console.error('[PortfolioChat Widget Initialization Error]', err.message);
    });

  function initWidget(data, token, apiHost) {
    var cfg = data.config || {};
    var devCfg = data.developerConfig || {};
    var app = cfg.appearance || {};
    var lnc = cfg.launcher || {};
    var hdr = cfg.header || {};
    var wlc = cfg.welcome || {};
    var bbl = cfg.bubbles || {};
    var inp = cfg.input || {};
    var lyt = cfg.layout || {};
    var questions = cfg.suggestedQuestions || [];

    var themeMode = app.themeMode || 'dark';
    var primaryColor = app.primaryColor || '#06b6d4';
    var projectId = data.projectId;
    var sessionId = 'pc_session_' + Math.random().toString(36).substring(2, 11);

    try {
      if (window.sessionStorage) {
        var existingSession = sessionStorage.getItem('portfoliochat_session_' + projectId);
        if (existingSession) sessionId = existingSession;
        else sessionStorage.setItem('portfoliochat_session_' + projectId, sessionId);
      }
    } catch(e) {}

    // Load Fonts & Icons into Host Page
    if (!document.getElementById('portfoliochat-material-icons')) {
      var iconLink = document.createElement('link');
      iconLink.id = 'portfoliochat-material-icons';
      iconLink.rel = 'stylesheet';
      iconLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
      document.head.appendChild(iconLink);
    }

    // Dynamic Header Background Computation (Matches LiveWidgetPreview.js 100%)
    var getHeaderBackgroundCss = function() {
      var styleKey = hdr.backgroundStyle || 'solid';
      if (styleKey === 'solid') {
        return hdr.customBgColor || primaryColor;
      }
      if (styleKey === 'gradient-emerald') {
        return 'linear-gradient(135deg, #10b981, #059669)';
      }
      if (styleKey === 'gradient-indigo') {
        return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
      }
      if (styleKey === 'gradient-cyan') {
        return 'linear-gradient(135deg, #06b6d4, #0891b2)';
      }
      if (styleKey === 'gradient-blue') {
        return 'linear-gradient(135deg, #0284c7, #06b6d4)';
      }
      if (styleKey === 'gradient-sunset') {
        return 'linear-gradient(135deg, #f59e0b, #ec4899)';
      }
      if (styleKey === 'glass') {
        return 'rgba(255, 255, 255, 0.08)';
      }
      return hdr.customBgColor || primaryColor;
    };
    var headerBgCss = getHeaderBackgroundCss();

    // Launcher Offsets & Sizing
    var launcherSizePx = lnc.size === 'small' ? '48px' : lnc.size === 'large' ? '64px' : '56px';
    var launcherBottom = (lnc.bottomPadding !== undefined ? lnc.bottomPadding : 24) + 'px';
    var launcherSide = (lnc.sidePadding !== undefined ? lnc.sidePadding : 24) + 'px';
    var isLeft = lnc.position === 'bottom-left';

    // Bubbles & Theme Colors (100% matched with LayoutBubblePanel.js)
    var userBg = bbl.userBg || primaryColor;
    var userText = bbl.userText || '#ffffff';
    var botBg = bbl.botBg || (themeMode === 'light' ? '#f1f5f9' : '#18181b');
    var botText = bbl.botText || (themeMode === 'light' ? '#0f172a' : '#f4f4f5');
    var sendBtnColor = inp.sendColor || primaryColor;
    var placeholderText = inp.placeholder || 'Ask me anything...';
    var borderRadiusPx = (app.borderRadius !== undefined ? app.borderRadius : 16) + 'px';
    var bubbleRadiusPx = (bbl.borderRadius !== undefined ? bbl.borderRadius : 14) + 'px';

    // Shadow DOM Container Setup
    var containerDiv = document.createElement('div');
    containerDiv.id = 'portfoliochat-widget-container';
    document.body.appendChild(containerDiv);
    var shadow = containerDiv.attachShadow({ mode: 'open' });

    var isOpen = false;

    // Build Styles inside Shadow DOM
    var style = document.createElement('style');
    style.textContent = \`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

      * { box-sizing: border-box; margin: 0; padding: 0; font-family: \${app.fontFamily || 'Inter, sans-serif'}; }
      
      .pc-glow-aura {
        position: fixed;
        bottom: \${launcherBottom};
        right: \${isLeft ? 'auto' : launcherSide};
        left: \${isLeft ? launcherSide : 'auto'};
        z-index: 999998;
        width: \${lnc.shape === 'pill' ? '120px' : launcherSizePx};
        height: \${launcherSizePx};
        border-radius: \${lnc.shape === 'square' ? '16px' : '9999px'};
        background: \${primaryColor};
        pointer-events: none;
        animation: pc-glow-pulse 2s infinite ease-out;
      }
      @keyframes pc-glow-pulse {
        0% { transform: scale(1); opacity: 0.75; }
        50% { transform: scale(1.45); opacity: 0.35; }
        100% { transform: scale(1.65); opacity: 0; }
      }

      .pc-launcher-btn {
        position: fixed;
        bottom: \${launcherBottom};
        right: \${isLeft ? 'auto' : launcherSide};
        left: \${isLeft ? launcherSide : 'auto'};
        z-index: 999999;
        width: \${lnc.shape === 'pill' ? 'auto' : launcherSizePx};
        height: \${launcherSizePx};
        padding: \${lnc.shape === 'pill' ? '0 20px' : '0'};
        border-radius: \${lnc.shape === 'square' ? '16px' : '9999px'};
        background: \${primaryColor};
        color: #ffffff;
        border: \${lnc.shape === 'floating' ? '2px solid rgba(255,255,255,0.25)' : 'none'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: \${lnc.shape === 'floating' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.5)'};
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .pc-launcher-btn:hover { transform: scale(1.05); }
      .pc-launcher-btn:active { transform: scale(0.95); }

      /* Attention Animations */
      @keyframes pc-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
      @keyframes pc-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      @keyframes pc-shake { 0%, 100% { transform: rotate(0deg); } 20%, 60% { transform: rotate(-10deg); } 40%, 80% { transform: rotate(10deg); } }
      
      .pc-anim-pulse { animation: pc-pulse 2s infinite ease-in-out; }
      .pc-anim-bounce { animation: pc-bounce 1.6s infinite ease-in-out; }
      .pc-anim-shake { animation: pc-shake 2.2s infinite ease-in-out; }

      .pc-chat-window {
        position: fixed;
        bottom: calc(\${launcherBottom} + \${launcherSizePx} + 12px);
        right: \${isLeft ? 'auto' : launcherSide};
        left: \${isLeft ? launcherSide : 'auto'};
        z-index: 999999;
        width: \${lyt.width || 380}px;
        max-width: calc(100vw - 32px);
        height: \${lyt.height || 580}px;
        max-height: calc(100vh - 120px);
        border-radius: \${borderRadiusPx};
        background: \${app.backgroundColor || (themeMode === 'light' ? '#ffffff' : '#111113')};
        color: \${app.textColor || (themeMode === 'light' ? '#0f172a' : '#ffffff')};
        border: 1px solid \${app.borderColor || (themeMode === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.12)')};
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: pc-fade-in 0.25s cubic-bezier(0.23, 1, 0.32, 1);
      }
      .pc-chat-window.pc-open { display: flex; }
      @keyframes pc-fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

      .pc-header {
        background: \${headerBgCss};
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #ffffff;
      }
      .pc-header-left { display: flex; align-items: center; gap: 10px; }
      .pc-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .pc-header-title { font-weight: 700; font-size: 14px; }
      .pc-header-sub { font-size: 10px; opacity: 0.85; }
      .pc-close-btn { background: none; border: none; color: #ffffff; cursor: pointer; opacity: 0.8; padding: 4px; }
      .pc-close-btn:hover { opacity: 1; }

      .pc-body { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
      
      .pc-msg { display: flex; flex-direction: column; max-width: 85%; font-size: 13px; line-height: 1.5; }
      .pc-msg-bot { align-self: flex-start; background: \${botBg}; color: \${botText}; padding: 12px; border-radius: \${bubbleRadiusPx}; border-top-left-radius: 4px; border: 1px solid rgba(255,255,255,0.06); }
      .pc-msg-user { align-self: flex-end; background: \${userBg}; color: \${userText}; padding: 12px; border-radius: \${bubbleRadiusPx}; border-top-right-radius: 4px; }

      .pc-subgreeting { padding: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; font-size: 12px; opacity: 0.9; }

      .pc-chips { display: flex; gap: 8px; overflow-x: auto; padding: 8px 16px; border-top: 1px solid rgba(255,255,255,0.06); }
      .pc-chip { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; padding: 6px 12px; font-size: 11px; color: #a1a1aa; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
      .pc-chip:hover { background: rgba(255,255,255,0.15); color: #ffffff; }

      .pc-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px; background: \${themeMode === 'light' ? '#f8fafc' : '#09090b'}; }
      .pc-input { flex: 1; background: \${themeMode === 'light' ? '#ffffff' : '#18181b'}; border: 1px solid \${themeMode === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}; border-radius: 20px; padding: 10px 14px; color: \${app.textColor || (themeMode === 'light' ? '#0f172a' : '#ffffff')}; font-size: 13px; outline: none; }
      .pc-input:focus { border-color: \${primaryColor}; }
      .pc-send-btn { width: 38px; height: 38px; border-radius: 50%; background: \${sendBtnColor}; border: none; color: #ffffff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .pc-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      \${devCfg.customCss || ''}
    \`;

    shadow.appendChild(style);

    // Render Glow Ring Aura if animation is glow
    if (lnc.animation === 'glow') {
      var glowDiv = document.createElement('div');
      glowDiv.className = 'pc-glow-aura';
      glowDiv.id = 'pc-glow';
      shadow.appendChild(glowDiv);
    }

    // Build Launcher Button HTML
    var launcherBtn = document.createElement('button');
    launcherBtn.className = 'pc-launcher-btn ' + (lnc.animation && lnc.animation !== 'glow' ? 'pc-anim-' + lnc.animation : '');
    
    var launcherIconHtml = lnc.customIconUrl 
      ? '<img src="' + lnc.customIconUrl + '" style="width:20px;height:20px;object-fit:contain;" />'
      : '<span class="material-symbols-outlined">' + (lnc.icon || 'chat_bubble') + '</span>';

    if (lnc.shape === 'pill') {
      launcherBtn.innerHTML = launcherIconHtml + '<span style="font-size:12px;font-weight:700;">Chat</span>';
    } else {
      launcherBtn.innerHTML = launcherIconHtml;
    }

    // Build Header Avatar HTML
    var avatarHtml = '';
    if (hdr.botAvatar === 'custom' && hdr.customAvatarUrl) {
      avatarHtml = '<img src="' + hdr.customAvatarUrl + '" style="width:100%;height:100%;object-fit:cover;" />';
    } else {
      var iconName = hdr.botAvatar === 'sparkles' ? 'auto_awesome' : hdr.botAvatar === 'agent' ? 'support_agent' : 'smart_toy';
      avatarHtml = '<span class="material-symbols-outlined" style="font-size:18px;">' + iconName + '</span>';
    }

    var chatWin = document.createElement('div');
    chatWin.className = 'pc-chat-window';

    chatWin.innerHTML = \`
      <div class="pc-header">
        <div class="pc-header-left">
          <div class="pc-avatar">\${avatarHtml}</div>
          <div>
            <div class="pc-header-title">\${hdr.botName}</div>
            <div class="pc-header-sub">\${hdr.tagline}</div>
          </div>
        </div>
        <button class="pc-close-btn" id="pc-close"><span class="material-symbols-outlined">close</span></button>
      </div>

      <div class="pc-body" id="pc-messages">
        \${wlc.subgreeting ? '<div class="pc-subgreeting">' + wlc.subgreeting + '</div>' : ''}
        <div class="pc-msg pc-msg-bot">\${wlc.greeting}</div>
      </div>

      \${questions.length ? '<div class="pc-chips" id="pc-chips">' + questions.map(function(q) { return '<button class="pc-chip">' + q + '</button>'; }).join('') + '</div>' : ''}

      <div class="pc-footer">
        <input type="text" class="pc-input" id="pc-input" placeholder="\${placeholderText}" />
        <button class="pc-send-btn" id="pc-send"><span class="material-symbols-outlined">send</span></button>
      </div>
    \`;

    shadow.appendChild(launcherBtn);
    shadow.appendChild(chatWin);

    // Event Listeners
    var inputEl = shadow.getElementById('pc-input');
    var sendBtn = shadow.getElementById('pc-send');
    var closeBtn = shadow.getElementById('pc-close');
    var messagesEl = shadow.getElementById('pc-messages');
    var chipsContainer = shadow.getElementById('pc-chips');
    var glowEl = shadow.getElementById('pc-glow');

    function toggleChat() {
      isOpen = !isOpen;
      if (isOpen) {
        chatWin.classList.add('pc-open');
        if (glowEl) glowEl.style.display = 'none';
      } else {
        chatWin.classList.remove('pc-open');
        if (glowEl) glowEl.style.display = 'block';
      }
    }

    launcherBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    if (chipsContainer) {
      chipsContainer.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('pc-chip')) {
          sendUserMessage(e.target.textContent);
        }
      });
    }

    function sendUserMessage(text) {
      var query = text || inputEl.value;
      if (!query || !query.trim()) return;

      // Append User Message
      var userMsgDiv = document.createElement('div');
      userMsgDiv.className = 'pc-msg pc-msg-user';
      userMsgDiv.textContent = query.trim();
      messagesEl.appendChild(userMsgDiv);

      inputEl.value = '';
      sendBtn.disabled = true;
      messagesEl.scrollTop = messagesEl.scrollHeight;

      // Append Typing Placeholder
      var typingDiv = document.createElement('div');
      typingDiv.className = 'pc-msg pc-msg-bot';
      typingDiv.textContent = 'Thinking...';
      messagesEl.appendChild(typingDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      // Call Chat API
      fetch(apiHost + '/v1/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          projectId: projectId,
          message: query.trim(),
          sessionId: sessionId
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(resData) {
        sendBtn.disabled = false;
        if (resData.success && resData.reply) {
          typingDiv.textContent = resData.reply;
        } else {
          typingDiv.textContent = resData.error || 'Unable to get response. Please try again.';
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
      })
      .catch(function(err) {
        sendBtn.disabled = false;
        typingDiv.textContent = 'Network error. Make sure the API server is reachable.';
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }

    sendBtn.addEventListener('click', function() { sendUserMessage(); });
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendUserMessage();
    });
  }
})();
    `;

    return reply
      .header('Content-Type', 'application/javascript; charset=utf-8')
      .header('Access-Control-Allow-Origin', '*')
      .send(widgetScriptContent);
  };

  server.get('/widget.js', getWidgetJsHandler);
  server.get('/v1/widget.js', getWidgetJsHandler);
}
