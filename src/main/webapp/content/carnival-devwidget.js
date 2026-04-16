/**
 * CARNIVAL DevWidget v5
 * Full wheel + agent chat + Arcane Scrolls + auto-screenshot
 * Ctrl+Win: Wheel · Ctrl+Space: Scrolls · DEV MODE ONLY.
 */
(function() {
  'use strict';
  var host = window.location.hostname;
  if (!(host === 'localhost' || host === '127.0.0.1' || window.__CARNIVAL_DEV_MODE__)) return;

  var API = window.__CARNIVAL_API__ || 'http://localhost:8080/api';
  var PID = window.__CARNIVAL_PROJECT_ID__ || null;
  if (!PID) return;

  // ── Capture JWT from URL param (passed by YAMZY when opening the app) ──
  var urlParams = new URLSearchParams(window.location.search);
  var tokenFromUrl = urlParams.get('carnival_token');
  if (tokenFromUrl) {
    localStorage.setItem('carnival_jwt', tokenFromUrl);
    // Clean URL (remove token from address bar)
    var cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
  }
  var JWT = localStorage.getItem('carnival_jwt') || window.__CARNIVAL_JWT__ || '';

  // ── Inject html2canvas for screenshots ────────────────────
  // Try loading from CDN, fall back to native if blocked by CSP
  var html2canvasReady = false;
  try {
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    sc.onload = function() { html2canvasReady = true; };
    sc.onerror = function() { console.log('html2canvas CDN blocked — using DOM snapshot fallback'); };
    document.head.appendChild(sc);
  } catch(e) {}

  // ── CSS ───────────────────────────────────────────────────
  var css = document.createElement('style');
  css.textContent = [
    // Overlay + Wheel
    '.crn-ov{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;}',
    '.crn-ov.open{display:flex;}',
    '.crn-wh{position:relative;width:400px;height:400px;}',
    '.crn-ct{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#5412fc,#7c3aed);display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;font-size:28px;font-weight:900;box-shadow:0 0 40px rgba(84,18,252,0.5);cursor:pointer;z-index:2;border:3px solid rgba(255,255,255,0.2);}',
    '.crn-ct:hover{transform:translate(-50%,-50%) scale(1.08);}',
    '.crn-ct-sub{font-size:7px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.6);margin-top:2px;}',
    '.crn-it{position:absolute;width:68px;height:68px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;border:2px solid rgba(255,255,255,0.1);}',
    '.crn-it:hover{transform:scale(1.18);box-shadow:0 0 25px rgba(84,18,252,0.4);border-color:rgba(255,255,255,0.3);}',
    '.crn-it-i{font-size:20px;}',
    '.crn-it-l{font-size:7px;font-weight:700;color:#fff;margin-top:2px;text-align:center;letter-spacing:0.3px;}',
    // FAB
    '.crn-fab{position:fixed;bottom:24px;right:24px;z-index:99998;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#5412fc,#7c3aed);color:#fff;border:none;cursor:pointer;font-size:20px;box-shadow:0 4px 20px rgba(84,18,252,0.4);display:flex;align-items:center;justify-content:center;transition:all .2s;}',
    '.crn-fab:hover{transform:scale(1.1);}',
    '.crn-fab-t{position:absolute;bottom:-8px;font-size:7px;font-weight:800;color:#a78bfa;letter-spacing:1px;}',
    '.crn-bdg{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;padding:0 2px;}',
    '.crn-hint{position:fixed;bottom:28px;right:80px;z-index:99997;font-size:9px;color:#6b7280;font-family:monospace;}',
    // Chat Panel
    '.crn-chat{position:fixed;bottom:80px;right:24px;z-index:99999;width:360px;height:480px;background:#0f0a2a;border-radius:20px;box-shadow:0 10px 50px rgba(0,0,0,0.5);display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(99,102,241,0.2);}',
    '.crn-chat.open{display:flex;}',
    '.crn-chat-hdr{padding:12px 16px;background:linear-gradient(135deg,#1e1b4b,#312e81);display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '.crn-chat-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(99,102,241,0.3);}',
    '.crn-chat-name{font-size:13px;font-weight:700;color:#e0e7ff;flex:1;}',
    '.crn-chat-role{font-size:9px;color:#818cf8;}',
    '.crn-chat-close{background:none;border:none;color:#6366f1;font-size:16px;cursor:pointer;}',
    '.crn-chat-msgs{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px;}',
    '.crn-msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:12px;line-height:1.5;word-break:break-word;}',
    '.crn-msg-u{align-self:flex-end;background:linear-gradient(135deg,#5412fc,#7c3aed);color:#fff;border-bottom-right-radius:4px;}',
    '.crn-msg-a{align-self:flex-start;background:#1e1b4b;color:#c4b5fd;border-bottom-left-radius:4px;border:1px solid rgba(99,102,241,0.15);}',
    '.crn-msg-sys{align-self:center;background:rgba(99,102,241,0.1);color:#818cf8;font-size:10px;border-radius:12px;padding:6px 12px;}',
    '.crn-chat-input{display:flex;gap:8px;padding:12px 16px;background:#0a071f;border-top:1px solid rgba(99,102,241,0.15);flex-shrink:0;}',
    '.crn-chat-ta{flex:1;background:#1e1b4b;border:1px solid rgba(99,102,241,0.2);border-radius:12px;color:#e0e7ff;padding:8px 12px;font-size:12px;font-family:inherit;outline:none;resize:none;min-height:36px;max-height:80px;}',
    '.crn-chat-ta:focus{border-color:#5412fc;}',
    '.crn-chat-send{background:linear-gradient(135deg,#5412fc,#7c3aed);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;}',
    '.crn-chat-send:hover{filter:brightness(1.15);}',
    '.crn-chat-send:disabled{opacity:0.4;}',
    // Agent Picker (inside wheel)
    '.crn-agents{position:fixed;bottom:80px;right:24px;z-index:99999;width:260px;background:#1e1b4b;border-radius:16px;padding:8px;box-shadow:0 10px 40px rgba(0,0,0,0.5);display:none;flex-direction:column;gap:2px;border:1px solid rgba(99,102,241,0.3);max-height:400px;overflow-y:auto;}',
    '.crn-agents.open{display:flex;}',
    '.crn-agents-title{font-size:9px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;padding:8px 12px 4px;}',
    '.crn-ag{padding:10px 14px;border-radius:10px;color:#e0e7ff;font-size:12px;font-weight:600;cursor:pointer;border:none;background:none;text-align:left;display:flex;align-items:center;gap:10px;font-family:inherit;}',
    '.crn-ag:hover{background:rgba(99,102,241,0.15);}',
    '.crn-ag-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;}',
    '.crn-ag-info{flex:1;}.crn-ag-name{font-size:12px;font-weight:700;}.crn-ag-desc{font-size:9px;color:#818cf8;margin-top:1px;}',
    // Modal
    '.crn-modal{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;}',
    '.crn-card{background:#fff;border-radius:20px;width:480px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);}',
    '.crn-card-hdr{padding:20px 24px 0;display:flex;align-items:center;gap:10px;}',
    '.crn-card-hdr h3{margin:0;font-size:16px;font-weight:800;color:#1e1b4b;flex:1;}',
    '.crn-card-hdr button{background:none;border:none;font-size:18px;cursor:pointer;color:#9ca3af;}',
    '.crn-card-body{padding:16px 24px 24px;}',
    '.crn-label{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;display:block;}',
    '.crn-input{width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:12px;}',
    '.crn-input:focus{border-color:#5412fc;}',
    '.crn-ta{min-height:80px;resize:vertical;}',
    '.crn-row{display:flex;gap:10px;}.crn-row>*{flex:1;}',
    '.crn-submit{width:100%;padding:12px;background:linear-gradient(135deg,#5412fc,#7c3aed);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px;}',
    '.crn-submit:hover{filter:brightness(1.1);}.crn-submit:disabled{opacity:0.5;}',
    '.crn-ctx{font-size:10px;color:#9ca3af;padding:8px 14px;background:#f9fafb;border-radius:10px;margin-bottom:12px;font-family:monospace;}',
    '.crn-screenshot{max-width:100%;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:12px;}',
    // Toast
    '.crn-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:100001;padding:12px 24px;border-radius:12px;color:#fff;font-size:12px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:crnS .3s ease;font-family:system-ui;}',
    '.crn-toast-ok{background:#059669;}.crn-toast-err{background:#dc2626;}.crn-toast-info{background:#5412fc;}',
    '@keyframes crnS{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}'
  ].join('\n');
  document.head.appendChild(css);

  // ── State ─────────────────────────────────────────────────
  var wheelOpen = false, chatOpen = false, agentsOpen = false;
  var activeSprint = null, existingTickets = [], agents = [];
  var consoleErrors = [], chatMsgs = [], chatAgent = null, chatBusy = false;
  var ownerLogin = '';

  function hdrs() {
    var h = { 'Content-Type': 'application/json' };
    if (JWT) h['Authorization'] = 'Bearer ' + JWT;
    return h;
  }

  // ── Resolve owner login from CARNIVAL session ─────────────
  function resolveOwner() {
    fetch(API + '/tickets/session-info/' + PID, { headers: hdrs() })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.login) ownerLogin = d.login; })
      .catch(function() {});
  }

  // ── API ───────────────────────────────────────────────────
  function loadSprint() {
    fetch(API + '/tickets/sprint-active/' + PID, { headers: hdrs() })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.id) { activeSprint = d; loadTickets(); } })
      .catch(function() {});
  }
  function loadTickets() {
    if (!activeSprint) return;
    fetch(API + '/tickets?sprintId=' + activeSprint.id, { headers: hdrs() })
      .then(function(r) { return r.json(); })
      .then(function(d) { existingTickets = d.tickets || []; })
      .catch(function() {});
  }
  function loadAgents() {
    fetch(API + '/agents/builder', { headers: hdrs() })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        agents = (Array.isArray(d) ? d : d.agents || []).slice(0, 12);
      }).catch(function() {
        agents = [
          { name: 'Aura', icon: '🌟', role: 'Project Manager', agent: 'AURA' },
          { name: 'Forge', icon: '🔨', role: 'Developer', agent: 'FORGE' },
          { name: 'Nexus', icon: '🔗', role: 'Architect', agent: 'NEXUS' }
        ];
      });
  }

  // ── Screenshot ────────────────────────────────────────────
  function takeScreenshot() {
    return new Promise(function(resolve) {
      // Method 1: html2canvas (if loaded from CDN)
      if (window.html2canvas) {
        window.html2canvas(document.body, { scale: 0.5, useCORS: true, logging: false })
          .then(function(canvas) { resolve(canvas.toDataURL('image/png', 0.7)); })
          .catch(function() { resolve(domSnapshot()); });
        return;
      }
      // Method 2: DOM snapshot as SVG → Canvas → base64
      resolve(domSnapshot());
    });
  }

  function domSnapshot() {
    try {
      var w = window.innerWidth, h = window.innerHeight;
      var canvas = document.createElement('canvas');
      canvas.width = w * 0.5; canvas.height = h * 0.5;
      var ctx = canvas.getContext('2d');
      ctx.scale(0.5, 0.5);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      // Draw page info
      ctx.fillStyle = '#5412fc';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText('📸 Page Snapshot', 20, 30);
      ctx.fillStyle = '#1f2937';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('URL: ' + location.href, 20, 60);
      ctx.fillText('Time: ' + new Date().toLocaleString(), 20, 82);
      ctx.fillText('Title: ' + document.title, 20, 104);
      // Capture visible text content
      var bodyText = document.body.innerText || '';
      var lines = bodyText.split('\n').filter(function(l) { return l.trim(); }).slice(0, 25);
      ctx.fillStyle = '#4b5563';
      ctx.font = '11px monospace';
      lines.forEach(function(line, i) {
        ctx.fillText(line.substring(0, 120), 20, 140 + i * 16);
      });
      return canvas.toDataURL('image/png', 0.8);
    } catch(e) {
      return null;
    }
  }

  // ── Console capture ───────────────────────────────────────
  var origErr = console.error;
  console.error = function() {
    consoleErrors.push({ t: new Date().toISOString(), a: Array.from(arguments).map(String) });
    if (consoleErrors.length > 50) consoleErrors.shift();
    updateBadge();
    origErr.apply(console, arguments);
  };
  window.addEventListener('error', function(e) {
    consoleErrors.push({ t: new Date().toISOString(), a: [e.message, (e.filename || '') + ':' + (e.lineno || '')] });
    updateBadge();
  });

  // ── Wheel items ───────────────────────────────────────────
  var items = [
    { icon: '🐛', label: 'Report Bug', color: '#ef4444', action: 'bug' },
    { icon: '💡', label: 'Feature', color: '#f59e0b', action: 'feature' },
    { icon: '📋', label: 'Errors', color: '#3b82f6', action: 'console' },
    { icon: '🤖', label: 'Agents', color: '#8b5cf6', action: 'agents' },
    { icon: '📊', label: 'Kanban', color: '#ec4899', action: 'kanban' },
    { icon: '⚔️', label: 'War Room', color: '#06b6d4', action: 'warroom' },
    { icon: '💻', label: 'Studio', color: '#10b981', action: 'studio' },
    { icon: '🌐', label: 'CARNIVAL', color: '#6366f1', action: 'carnival' },
    { icon: '📜', label: 'Scrolls', color: '#92400e', action: 'scrolls' }
  ];

  // ── Build Wheel ───────────────────────────────────────────
  var ov = document.createElement('div'); ov.className = 'crn-ov';
  ov.onclick = function(e) { if (e.target === ov) closeWheel(); };
  var wh = document.createElement('div'); wh.className = 'crn-wh';
  var ct = document.createElement('div'); ct.className = 'crn-ct';
  ct.innerHTML = '✦<div class="crn-ct-sub">CARNIVAL</div>';
  ct.onclick = closeWheel;
  wh.appendChild(ct);

  var R = 148;
  items.forEach(function(it, i) {
    var a = (i / items.length) * 2 * Math.PI - Math.PI / 2;
    var el = document.createElement('div'); el.className = 'crn-it';
    el.style.cssText = 'left:' + (200 + R * Math.cos(a) - 34) + 'px;top:' + (200 + R * Math.sin(a) - 34) + 'px;background:' + it.color + ';';
    el.innerHTML = '<span class="crn-it-i">' + it.icon + '</span><span class="crn-it-l">' + it.label + '</span>';
    el.onclick = function() { closeWheel(); doAction(it.action); };
    wh.appendChild(el);
  });
  ov.appendChild(wh);
  document.body.appendChild(ov);

  // ── FAB ───────────────────────────────────────────────────
  var fab = document.createElement('button'); fab.className = 'crn-fab';
  fab.innerHTML = '✦<span class="crn-fab-t">DEV</span>';
  fab.onclick = function() { wheelOpen ? closeWheel() : openWheel(); };
  document.body.appendChild(fab);
  var hint = document.createElement('div'); hint.className = 'crn-hint'; hint.textContent = 'Ctrl+Win: Wheel · Ctrl+Space: Scrolls';
  document.body.appendChild(hint);

  function updateBadge() {
    var b = fab.querySelector('.crn-bdg');
    if (consoleErrors.length > 0) {
      if (!b) { b = document.createElement('span'); b.className = 'crn-bdg'; fab.appendChild(b); }
      b.textContent = consoleErrors.length > 99 ? '99+' : consoleErrors.length;
    } else if (b) b.remove();
  }

  function openWheel() { wheelOpen = true; ov.classList.add('open'); }
  function closeWheel() { wheelOpen = false; ov.classList.remove('open'); }

  // ── Agent List Panel ──────────────────────────────────────
  var agPanel = document.createElement('div'); agPanel.className = 'crn-agents';
  agPanel.innerHTML = '<div class="crn-agents-title">Agents</div>';
  document.body.appendChild(agPanel);

  function showAgents() {
    agPanel.innerHTML = '<div class="crn-agents-title">Agents CARNIVAL</div>';
    agents.forEach(function(ag) {
      var btn = document.createElement('button'); btn.className = 'crn-ag';
      btn.innerHTML = '<div class="crn-ag-icon" style="background:' + (ag.color || 'rgba(99,102,241,0.3)') + '">' + (ag.icon || '🤖') + '</div>'
        + '<div class="crn-ag-info"><div class="crn-ag-name">' + (ag.name || ag.displayName || 'Agent') + '</div>'
        + '<div class="crn-ag-desc">' + (ag.role || ag.description || '').substring(0, 40) + '</div></div>';
      btn.onclick = function() { agPanel.classList.remove('open'); agentsOpen = false; openChat(ag); };
      agPanel.appendChild(btn);
    });
    agentsOpen = true; agPanel.classList.add('open');
  }

  // ── Chat Panel ────────────────────────────────────────────
  var chatEl = document.createElement('div'); chatEl.className = 'crn-chat';
  chatEl.innerHTML = '<div class="crn-chat-hdr">'
    + '<div class="crn-chat-av" id="crn-ch-av">🤖</div>'
    + '<div><div class="crn-chat-name" id="crn-ch-name">Agent</div><div class="crn-chat-role" id="crn-ch-role">AI</div></div>'
    + '<button class="crn-chat-close" onclick="this.closest(\'.crn-chat\').classList.remove(\'open\')">✕</button>'
    + '</div>'
    + '<div class="crn-chat-msgs" id="crn-ch-msgs"></div>'
    + '<div class="crn-chat-input">'
    + '<textarea class="crn-chat-ta" id="crn-ch-ta" placeholder="Message..." rows="1"></textarea>'
    + '<button class="crn-chat-send" id="crn-ch-send">➤</button>'
    + '</div>';
  document.body.appendChild(chatEl);

  function openChat(agent) {
    chatAgent = agent;
    chatMsgs = [];
    chatOpen = true;
    chatEl.classList.add('open');
    document.getElementById('crn-ch-av').textContent = agent.icon || '🤖';
    document.getElementById('crn-ch-name').textContent = agent.name || agent.displayName || 'Agent';
    document.getElementById('crn-ch-role').textContent = agent.role || agent.description || 'AI Assistant';
    renderChat();
    addChatMsg('sys', 'Connected to ' + (agent.name || 'Agent') + '. Ask anything about your project!');
  }

  function addChatMsg(role, text) {
    chatMsgs.push({ role: role, text: text });
    renderChat();
  }

  function renderChat() {
    var el = document.getElementById('crn-ch-msgs');
    if (!el) return;
    el.innerHTML = chatMsgs.map(function(m) {
      if (m.role === 'sys') return '<div class="crn-msg crn-msg-sys">' + m.text + '</div>';
      if (m.role === 'user') return '<div class="crn-msg crn-msg-u">' + m.text + '</div>';
      return '<div class="crn-msg crn-msg-a">' + m.text.replace(/\n/g, '<br>') + '</div>';
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function sendChat() {
    var ta = document.getElementById('crn-ch-ta');
    var msg = ta.value.trim();
    if (!msg || chatBusy || !chatAgent) return;
    ta.value = '';
    addChatMsg('user', msg);
    chatBusy = true;
    document.getElementById('crn-ch-send').disabled = true;

    var agentName = chatAgent.agent || chatAgent.name || 'AURA';
    var body = { message: msg, agent: agentName, projectId: PID };
    if (chatAgent.id) body.agentId = chatAgent.id;

    fetch(API + '/chat', { method: 'POST', headers: hdrs(), body: JSON.stringify(body) })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        addChatMsg('agent', d.response || d.message || d.reply || 'No response');
        chatBusy = false;
        document.getElementById('crn-ch-send').disabled = false;
      })
      .catch(function() {
        addChatMsg('sys', 'Error connecting to agent');
        chatBusy = false;
        document.getElementById('crn-ch-send').disabled = false;
      });
  }

  // Wire chat events
  setTimeout(function() {
    var sendBtn = document.getElementById('crn-ch-send');
    var chatTa = document.getElementById('crn-ch-ta');
    if (sendBtn) sendBtn.onclick = sendChat;
    if (chatTa) chatTa.onkeydown = function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } };
  }, 100);

  // ── Keyboard shortcut ─────────────────────────────────────
  var scrollsOpen = false;
  var scrollsData = [];
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.metaKey) { e.preventDefault(); wheelOpen ? closeWheel() : openWheel(); }
    if (e.ctrlKey && e.code === 'Space' && !e.metaKey) { e.preventDefault(); scrollsOpen ? closeScrolls() : openScrolls(); }
    if (e.key === 'Escape') { closeWheel(); closeScrolls(); agPanel.classList.remove('open'); chatEl.classList.remove('open'); }
  });

  // ── Arcane Scrolls Panel (Ctrl+Space) ─────────────────────
  var scrollOv = document.createElement('div');
  scrollOv.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(15,10,42,0.85);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;';
  scrollOv.onclick = function(e) { if (e.target === scrollOv) closeScrolls(); };

  var scrollPanel = document.createElement('div');
  scrollPanel.style.cssText = 'width:90vw;max-width:1100px;height:80vh;background:linear-gradient(135deg,#0f0a2a,#1e1b4b);border-radius:24px;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(99,102,241,0.2);box-shadow:0 20px 80px rgba(0,0,0,0.5);';
  scrollPanel.onclick = function(e) { e.stopPropagation(); };
  scrollOv.appendChild(scrollPanel);
  document.body.appendChild(scrollOv);

  function openScrolls() {
    scrollsOpen = true;
    scrollOv.style.display = 'flex';
    loadScrolls();
  }
  function closeScrolls() {
    scrollsOpen = false;
    scrollOv.style.display = 'none';
  }

  function loadScrolls() {
    fetch(API + '/arcane-scrolls?ownerLogin=' + encodeURIComponent(ownerLogin), { headers: hdrs() })
      .then(function(r) { return r.json(); })
      .then(function(data) { scrollsData = Array.isArray(data) ? data : []; renderScrolls(); })
      .catch(function() { scrollsData = []; renderScrolls(); });
  }

  function renderScrolls() {
    var colors = { yellow:'#fef3c7', blue:'#dbeafe', pink:'#fce7f3', green:'#dcfce7', purple:'#ede9fe' };
    var borders = { yellow:'#fde68a', blue:'#93c5fd', pink:'#f9a8d4', green:'#86efac', purple:'#c4b5fd' };
    var catIcons = { notes:'📝', credentials:'🔑', commands:'⌨️', links:'🔗' };

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:1px solid rgba(99,102,241,0.15);">'
      + '<div style="display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">📜</span><div><h2 style="margin:0;font-size:20px;font-weight:900;color:#e0e7ff;">Arcane Scrolls</h2><p style="margin:2px 0 0;font-size:11px;color:#818cf8;">Your personal grimoire — Ctrl+Space</p></div></div>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<div style="display:flex;gap:4px;">'
      + ['all:✦ All','notes:📝 Notes','credentials:🔑 Creds','commands:⌨️ Cmds','links:🔗 Links'].map(function(c) { var p=c.split(':'); return '<button onclick="window.__crn_filterCat=\'' + p[0] + '\';window.__crn_renderScrolls()" style="padding:4px 8px;border:1px solid ' + (window.__crn_filterCat===p[0]?'#818cf8':'rgba(99,102,241,0.2)') + ';border-radius:8px;background:' + (window.__crn_filterCat===p[0]?'rgba(99,102,241,0.2)':'transparent') + ';color:#a5b4fc;font-size:9px;font-weight:600;cursor:pointer;font-family:inherit;">' + p[1] + '</button>'; }).join('')
      + '</div>'
      + '<button onclick="window.__crn_addScroll()" style="padding:7px 16px;background:linear-gradient(135deg,#5412fc,#7c3aed);border:none;border-radius:10px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">＋ New Scroll</button>'
      + '<button onclick="window.__crn_closeScrolls()" style="background:none;border:none;color:#6366f1;font-size:20px;cursor:pointer;">✕</button>'
      + '</div></div>';

    html += '<div style="flex:1;overflow-y:auto;padding:24px 28px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;align-content:start;">';

    var filtered = scrollsData;
    if (window.__crn_filterCat && window.__crn_filterCat !== 'all') {
      filtered = scrollsData.filter(function(s) { return s.category === window.__crn_filterCat; });
    }

    if (!filtered.length) {
      html += '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#818cf8;"><span style="font-size:48px;">📜</span><p>No scrolls yet. Create your first note!</p></div>';
    }

    filtered.forEach(function(s) {
      var bg = colors[s.color] || '#fef3c7';
      var bd = borders[s.color] || '#fde68a';
      var ci = catIcons[s.category] || '📝';
      html += '<div style="background:' + bg + ';border:1.5px solid ' + bd + ';border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;' + (s.pinned ? 'box-shadow:0 0 0 2px rgba(99,102,241,0.3);' : '') + '">'
        + '<div style="display:flex;align-items:center;gap:8px;">'
        + '<span style="cursor:pointer;font-size:12px;" onclick="window.__crn_togglePin(' + s.id + ',' + !s.pinned + ')">' + (s.pinned ? '📌' : '📍') + '</span>'
        + '<span style="font-size:13px;font-weight:800;color:#1e1b4b;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (s.title || 'Untitled') + '</span>'
        + '<button onclick="window.__crn_copyScroll(\'' + (s.content || s.title || '').replace(/'/g, "\\'").replace(/\n/g, "\\n").substring(0, 500) + '\')" style="background:none;border:none;cursor:pointer;font-size:11px;opacity:0.6;" title="Copy">📋</button>'
        + '<button onclick="window.__crn_delScroll(' + s.id + ')" style="background:none;border:none;cursor:pointer;font-size:11px;opacity:0.4;" title="Delete">🗑</button>'
        + '</div>'
        + '<pre style="margin:0;font-size:11px;color:#374151;white-space:pre-wrap;word-break:break-word;font-family:monospace;line-height:1.6;min-height:40px;max-height:150px;overflow-y:auto;">' + (s.content || '') + '</pre>'
        + '<span style="font-size:9px;color:#6b7280;">' + ci + ' ' + (s.category || 'notes') + '</span>'
        + '</div>';
    });

    html += '</div>';
    html += '<div style="text-align:center;padding:10px;font-size:10px;color:#4b5563;border-top:1px solid rgba(99,102,241,0.1);">Ctrl+Space to toggle · 📋 to copy</div>';
    scrollPanel.innerHTML = html;
  }

  // Global functions for onclick handlers
  window.__crn_filterCat = 'all';
  window.__crn_renderScrolls = renderScrolls;
  window.__crn_closeScrolls = closeScrolls;
  window.__crn_addScroll = function() {
    var cat = window.__crn_filterCat && window.__crn_filterCat !== 'all' ? window.__crn_filterCat : 'notes';
    var colorMap = { notes: 'yellow', credentials: 'purple', commands: 'blue', links: 'green' };
    fetch(API + '/arcane-scrolls', { method: 'POST', headers: hdrs(), body: JSON.stringify({ title: 'New Scroll', content: '', color: colorMap[cat] || 'yellow', category: cat }) })
      .then(function() { loadScrolls(); toast('Scroll created!', 'ok'); })
      .catch(function() { toast('Failed', 'err'); });
  };
  window.__crn_delScroll = function(id) {
    fetch(API + '/arcane-scrolls/' + id, { method: 'DELETE', headers: hdrs() })
      .then(function() { loadScrolls(); })
      .catch(function() { toast('Failed', 'err'); });
  };
  window.__crn_togglePin = function(id, pinned) {
    fetch(API + '/arcane-scrolls/' + id, { method: 'PUT', headers: hdrs(), body: JSON.stringify({ pinned: pinned }) })
      .then(function() { loadScrolls(); })
      .catch(function() {});
  };
  window.__crn_copyScroll = function(text) {
    navigator.clipboard.writeText(text).then(function() { toast('Copied!', 'ok'); });
  };

  // ── Actions ───────────────────────────────────────────────
  function doAction(action) {
    switch (action) {
      case 'bug': openBugModal(); break;
      case 'feature': openFeatureModal(); break;
      case 'console': sendConsoleErrors(); break;
      case 'agents': showAgents(); break;
      case 'kanban': window.open('http://localhost:4200/projects/' + PID, '_blank'); break;
      case 'warroom': window.open('http://localhost:4200/projects/' + PID + '/war-room', '_blank'); break;
      case 'studio': window.open('http://localhost:4200/studio/' + PID, '_blank'); break;
      case 'carnival': window.open('http://localhost:4200/dashboard', '_blank'); break;
      case 'scrolls': openScrolls(); break;
    }
  }

  // ── Bug Modal (with auto screenshot) ──────────────────────
  function openBugModal() {
    toast('Taking screenshot...', 'info');
    takeScreenshot().then(function(imgData) {
      var m = document.createElement('div'); m.className = 'crn-modal';
      m.onclick = function(e) { if (e.target === m) m.remove(); };
      var screenshotHtml = imgData ? '<img class="crn-screenshot" src="' + imgData + '" alt="Screenshot">' : '<div class="crn-ctx">Screenshot not available</div>';
      m.innerHTML = '<div class="crn-card"><div class="crn-card-hdr"><span style="font-size:24px">🐛</span><h3>Report a Bug</h3><button onclick="this.closest(\'.crn-modal\').remove()">✕</button></div>'
        + '<div class="crn-card-body">'
        + '<div class="crn-ctx">📍 ' + location.pathname + ' · ' + (activeSprint ? activeSprint.name : 'Auto') + '</div>'
        + screenshotHtml
        + '<label class="crn-label">Title</label><input class="crn-input" id="crn-bt" placeholder="What went wrong?">'
        + '<label class="crn-label">Description</label><textarea class="crn-input crn-ta" id="crn-bd" placeholder="Steps to reproduce..."></textarea>'
        + '<div class="crn-row"><div><label class="crn-label">Priority</label><select class="crn-input" id="crn-bp"><option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div></div>'
        + '<button class="crn-submit" id="crn-bs">🐛 Create Bug Ticket</button>'
        + '</div></div>';
      document.body.appendChild(m);

      // Store screenshot data for submission
      m.__screenshot = imgData;

      document.getElementById('crn-bs').onclick = function() {
        var t = document.getElementById('crn-bt').value.trim();
        if (!t) return;
        this.disabled = true; this.textContent = 'Creating...';
        var desc = document.getElementById('crn-bd').value;
        var prio = document.getElementById('crn-bp').value;
        createBug(t, desc, prio, m.__screenshot)
          .then(function(r) { m.remove(); toast(r.action === 'updated' ? 'Bug updated!' : 'Bug created: ' + (r.ticket.key || ''), 'ok'); loadTickets(); })
          .catch(function() { document.getElementById('crn-bs').disabled = false; document.getElementById('crn-bs').textContent = 'Retry'; toast('Failed', 'err'); });
      };
    });
  }

  function createBug(title, desc, prio, screenshot) {
    var similar = existingTickets.find(function(t) {
      return t.title && t.title.toLowerCase().indexOf(title.toLowerCase().substring(0, 20)) >= 0;
    });
    if (similar) {
      return fetch(API + '/tickets/' + similar.id + '/comment', {
        method: 'POST', headers: hdrs(),
        body: JSON.stringify({ content: desc + '\nPage: ' + location.href, imageUrl: screenshot })
      }).then(function() { return { action: 'updated', ticket: similar }; });
    }
    return fetch(API + '/tickets', {
      method: 'POST', headers: hdrs(),
      body: JSON.stringify({
        title: title, description: desc,
        type: 'BUG', priority: prio, projectId: PID,
        sprintId: activeSprint ? activeSprint.id : null,
        screenshot: screenshot,
        pageUrl: location.href
      })
    }).then(function(r) { return r.json(); }).then(function(t) { return { action: 'created', ticket: t }; });
  }

  // ── Feature Modal ─────────────────────────────────────────
  function openFeatureModal() {
    var m = document.createElement('div'); m.className = 'crn-modal';
    m.onclick = function(e) { if (e.target === m) m.remove(); };
    m.innerHTML = '<div class="crn-card"><div class="crn-card-hdr"><span style="font-size:24px">💡</span><h3>Suggest Feature</h3><button onclick="this.closest(\'.crn-modal\').remove()">✕</button></div>'
      + '<div class="crn-card-body"><label class="crn-label">Title</label><input class="crn-input" id="crn-ft" placeholder="What should we add?">'
      + '<label class="crn-label">Description</label><textarea class="crn-input crn-ta" id="crn-fd" placeholder="Describe..."></textarea>'
      + '<button class="crn-submit" id="crn-fs">💡 Create Feature</button></div></div>';
    document.body.appendChild(m);
    document.getElementById('crn-fs').onclick = function() {
      var t = document.getElementById('crn-ft').value.trim();
      if (!t) return; this.disabled = true;
      fetch(API + '/tickets', { method: 'POST', headers: hdrs(), body: JSON.stringify({ title: t, description: document.getElementById('crn-fd').value, type: 'STORY', priority: 'MEDIUM', projectId: PID, sprintId: activeSprint ? activeSprint.id : null }) })
        .then(function() { m.remove(); toast('Feature created!', 'ok'); loadTickets(); })
        .catch(function() { toast('Failed', 'err'); document.getElementById('crn-fs').disabled = false; });
    };
  }

  // ── Send Console Errors ───────────────────────────────────
  function sendConsoleErrors() {
    if (!consoleErrors.length) { toast('No errors to report', 'info'); return; }
    var desc = consoleErrors.slice(-10).map(function(e) { return e.t + ' ' + e.a.join(' '); }).join('\n');
    createBug('Console errors: ' + location.pathname, desc, consoleErrors.length > 5 ? 'HIGH' : 'MEDIUM', null)
      .then(function() { toast(consoleErrors.length + ' errors reported!', 'ok'); consoleErrors.length = 0; updateBadge(); })
      .catch(function() { toast('Failed', 'err'); });
  }

  function toast(msg, type) {
    var t = document.createElement('div'); t.className = 'crn-toast crn-toast-' + (type || 'info'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function() { t.remove(); }, 3500);
  }

  // ── Init ──────────────────────────────────────────────────
  resolveOwner();
  loadSprint();
  loadAgents();
  console.log('%c✦ CARNIVAL DevWidget v5 — Project #' + PID + ' — JWT:' + (JWT ? 'yes' : 'no') + ' (Ctrl+Win: Wheel · Ctrl+Space: Scrolls)', 'color:#5412fc;font-weight:bold;font-size:14px;');
})();
