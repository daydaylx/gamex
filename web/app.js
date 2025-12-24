const $ = (id) => document.getElementById(id);

// --- Icons (SVG Strings) ---
const Icons = {
  play: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
  edit: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`,
  check: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`,
  lock: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>`,
  plus: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>`,
  refresh: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`,
  arrowLeft: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>`,
  cards: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`,
};

const state = {
  templates: [],
  sessions: [],
  currentSession: null,
  currentTemplate: null,
  currentPerson: null, // "A" | "B"
  formResponses: {},   // qid -> answer object
  hasUnsavedChanges: false,
  lastSaveTime: null,
  autoSaveTimer: null,
  scenarios: [],
  scenarioDecks: [],
  activeDeck: null,
};

async function api(path, opts = {}) {
  if (window.LocalApi && window.LocalApi.enabled) {
    return window.LocalApi.request(path, opts);
  }
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  return await res.blob();
}

function show(el, yes) {
  if (yes) {
    el.classList.remove("hidden");
    el.style.opacity = 0;
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.3s ease";
      el.style.opacity = 1;
    });
  } else {
    el.classList.add("hidden");
  }
}

function msg(el, text, kind = "") {
  el.textContent = text || "";
  el.className = "msg" + (kind ? ` ${kind}` : "");
}

async function loadTemplates() {
  state.templates = await api("/api/templates");
  const sel = $("newTemplate");
  sel.innerHTML = "";
  for (const t of state.templates) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.name} (v${t.version})`;
    sel.appendChild(opt);
  }
}

async function loadSessions() {
  state.sessions = await api("/api/sessions");
  const host = $("sessionsList");
  host.innerHTML = "";
  host.className = "list"; 

  if (state.sessions.length === 0) {
    host.innerHTML = `<div class="item" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Keine Sessions gefunden. Erstelle eine neue!</div>`;
    return;
  }

  for (const s of state.sessions) {
    const div = document.createElement("div");
    div.className = "item";
    const dateStr = new Date(s.created_at).toLocaleDateString('de-DE', { month: 'short', year: 'numeric', day: 'numeric' });
    div.innerHTML = `
      <div class="row space" style="margin-bottom: 12px;">
        <div class="title" style="font-size: 1.1rem;">${escapeHtml(s.name)}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</div>
      </div>
      <div class="row" style="margin-bottom: 16px;">
        <span class="badge ${s.has_a ? 'risk-badge-A' : ''}">Person A ${s.has_a ? '✓' : '—'}</span>
        <span class="badge ${s.has_b ? 'risk-badge-A' : ''}">Person B ${s.has_b ? '✓' : '—'}</span>
      </div>
      <div class="hint" style="margin-bottom: 16px; font-family: monospace; opacity: 0.7;">ID: ${escapeHtml(s.id).substring(0,8)}...</div>
      <button class="btn primary" style="width: 100%; justify-content: center; gap: 8px;" data-open="${escapeHtml(s.id)}">
        ${Icons.play} Öffnen
      </button>
    `;
    div.querySelector("button").addEventListener("click", () => openSession(s.id));
    host.appendChild(div);
  }
}

async function openSession(sessionId) {
  const info = await api(`/api/sessions/${sessionId}`);
  state.currentSession = info;
  state.currentTemplate = info.template;

  show($("home"), false);
  show($("create"), false);
  show($("extras"), false); 
  show($("sessionView"), true);

  $("sessTitle").textContent = info.name;
  $("sessMeta").innerHTML = `
    <span class="badge">Template: ${info.template.name}</span>
    <span class="badge ${info.has_a ? 'risk-badge-A' : ''}">A: ${info.has_a ? "Fertig" : "Offen"}</span>
    <span class="badge ${info.has_b ? 'risk-badge-A' : ''}">B: ${info.has_b ? "Fertig" : "Offen"}</span>
  `;

  show($("panelForm"), false);
  show($("panelCompare"), false);
  show($("panelAI"), false);
  msg($("sessionMsg"), "");
  
  $("authPassword").value = "";
  $("authPin").value = "";
}

function backHome() {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  stopSaveStatusUpdates();
  state.currentSession = null;
  state.currentTemplate = null;
  state.hasUnsavedChanges = false;
  if (state.autoSaveTimer) {
    clearTimeout(state.autoSaveTimer);
    state.autoSaveTimer = null;
  }
  if (window.LocalApi && typeof window.LocalApi.clearCache === "function") {
    window.LocalApi.clearCache();
  }
  show($("sessionView"), false);
  show($("scenarioView"), false);
  show($("home"), true);
  show($("create"), true);
  show($("extras"), true);
  loadSessions();
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function getAuth() {
  const password = $("authPassword").value.trim();
  const pin = $("authPin").value.trim();
  if (!password || password.length < 6) throw new Error("Passwort fehlt oder ist zu kurz.");
  return { password, pin: pin || null };
}

function getModuleMindsetHint(moduleId) {
  const hints = {
    "roles": "Machtabgabe erfordert hohes Vertrauen. Jederzeit widerrufbar.",
    "impact": "Grenzen und Stop-Signale sind hier essentiell.",
    "breath": "Sehr riskant. Nur mit klaren Sicherheitsregeln.",
    "edge": "Hohes Vertrauen nötig. Klare Kommunikation ist Pflicht.",
    "frame": "Gesundheitliche und emotionale Basis prüfen.",
  };
  return hints[moduleId] || null;
}

function renderModuleInfoCard(mod) {
  const card = document.createElement("div");
  card.className = "module-info-card";
  card.innerHTML = `
    <div class="module-info-icon">ℹ️</div>
    <div class="module-info-content">
      <div class="module-info-title">${escapeHtml(mod.name)}</div>
      ${mod.description ? `<div class="module-info-description">${escapeHtml(mod.description)}</div>` : ""}
      ${getModuleMindsetHint(mod.id) ? `<div class="module-info-mindset">${getModuleMindsetHint(mod.id)}</div>` : ""}
    </div>
  `;
  return card;
}

// --- Render Logic ---

function renderConsentRating(q, existing = {}) {
    const wrap = document.createElement("div");
    wrap.className = "item";
    const status = existing.status || "MAYBE";
    const interest = existing.interest ?? 2;
    const comfort = existing.comfort ?? 2;
    const conditions = existing.conditions || "";
    const notes = existing.notes || "";
    const hasDomSub = q.has_dom_sub || false;
    const riskClass = `risk-badge-${q.risk_level || "A"}`;
    const tagsHtml = (q.tags || []).map(t => `<span class="badge tag-badge">${escapeHtml(t)}</span>`).join("");

    let content = "";
    if (hasDomSub) {
      content = `
        <div class="grid2" style="margin-top:16px">
          <div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:8px;">
            <div style="font-weight:bold;color:var(--primary);margin-bottom:8px;">Dominant</div>
            <select data-k="dom_status"><option value="YES">JA</option><option value="MAYBE">VIELLEICHT</option><option value="NO">NEIN</option><option value="HARD_LIMIT">HARD LIMIT</option></select>
            <div class="grid2" style="gap:8px;margin-top:8px"><input data-k="dom_interest" type="number" min="0" max="4" placeholder="Int"><input data-k="dom_comfort" type="number" min="0" max="4" placeholder="Comf"></div>
          </div>
          <div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:8px;">
            <div style="font-weight:bold;color:var(--primary);margin-bottom:8px;">Submissiv</div>
            <select data-k="sub_status"><option value="YES">JA</option><option value="MAYBE">VIELLEICHT</option><option value="NO">NEIN</option><option value="HARD_LIMIT">HARD LIMIT</option></select>
            <div class="grid2" style="gap:8px;margin-top:8px"><input data-k="sub_interest" type="number" min="0" max="4" placeholder="Int"><input data-k="sub_comfort" type="number" min="0" max="4" placeholder="Comf"></div>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="row" style="margin-top:10px;">
          <select data-k="status" style="flex:2"><option value="YES">JA</option><option value="MAYBE">VIELLEICHT</option><option value="NO">NEIN</option><option value="HARD_LIMIT">HARD LIMIT</option></select>
          <input data-k="interest" type="number" min="0" max="4" style="flex:1" placeholder="Int">
          <input data-k="comfort" type="number" min="0" max="4" style="flex:1" placeholder="Comf">
        </div>
      `;
    }

    // Info Button Logic
    let infoBtn = "";
    let infoBox = "";
    if (q.info_details) {
      infoBtn = `<button class="btn-info-toggle" title="Details anzeigen" onclick="this.parentElement.parentElement.querySelector('.info-details-box').classList.toggle('open')">i</button>`;
      infoBox = `
        <div class="info-details-box">
          <div class="info-details-header">ℹ️ Deep Dive: ${escapeHtml(q.label)}</div>
          ${escapeHtml(q.info_details)}
        </div>
      `;
    }

    // Risk C Warning Banner
    const riskWarning = q.risk_level === "C" ? `
      <div class="risk-c-warning">
        <div class="risk-c-header">
          <span class="risk-c-icon">⚠️</span>
          <strong>SICHERHEITSHINWEIS</strong>
        </div>
        <div class="risk-c-content">
          ${q.help ? escapeHtml(q.help) : "Diese Praktik erfordert besondere Vorsicht."}
        </div>
      </div>
    ` : "";

    wrap.innerHTML = `
      <div class="title">
        <span class="badge" style="opacity:0.5">${q.id}</span> 
        <span class="badge ${riskClass}">Risk ${q.risk_level||"A"}</span> 
        ${tagsHtml}
      </div>
      <div style="margin-top:8px;font-weight:bold; display:flex; align-items:center;">
        ${escapeHtml(q.label)}
        ${infoBtn}
      </div>
      ${infoBox}
      ${riskWarning}
      ${q.help && q.risk_level !== "C" ? `<div class="hint" style="margin-top:4px">${escapeHtml(q.help)}</div>` : ""}
      ${content}
      <div class="space-y" style="margin-top:12px">
        <textarea data-k="conditions" placeholder="Bedingungen..." style="min-height:50px"></textarea>
        <textarea data-k="notes" placeholder="Notizen..." style="min-height:50px"></textarea>
      </div>
    `;
    
    // Set values logic
    if(hasDomSub) {
      wrap.querySelector('[data-k="dom_status"]').value = existing.dom_status || status;
      wrap.querySelector('[data-k="sub_status"]').value = existing.sub_status || status;
      wrap.querySelector('[data-k="dom_interest"]').value = existing.dom_interest ?? interest;
      wrap.querySelector('[data-k="dom_comfort"]').value = existing.dom_comfort ?? comfort;
      wrap.querySelector('[data-k="sub_interest"]').value = existing.sub_interest ?? interest;
      wrap.querySelector('[data-k="sub_comfort"]').value = existing.sub_comfort ?? comfort;
    } else {
      wrap.querySelector('[data-k="status"]').value = existing.status || status;
      wrap.querySelector('[data-k="interest"]').value = existing.interest ?? interest;
      wrap.querySelector('[data-k="comfort"]').value = existing.comfort ?? comfort;
    }
    wrap.querySelector('[data-k="conditions"]').value = conditions;
    wrap.querySelector('[data-k="notes"]').value = notes;

    wrap.querySelectorAll('input,select,textarea').forEach(e => {
        e.addEventListener('change', () => { state.hasUnsavedChanges = true; scheduleAutoSave(); updateProgress(); });
        e.addEventListener('input', () => { state.hasUnsavedChanges = true; scheduleAutoSave(); });
    });

    return wrap;
}

function renderScale(q, existing={}) {
    const d = document.createElement("div");
    d.className="item";
    d.innerHTML = `<div class="title">${q.label}</div><input data-k="value" type="number" min="0" max="10" value="${existing.value??5}">`;
    d.querySelector('input').onchange = () => { state.hasUnsavedChanges=true; scheduleAutoSave(); };
    return d;
}
function renderEnum(q, existing={}) {
    const d = document.createElement("div");
    d.className="item";
    d.innerHTML = `<div class="title">${q.label}</div><select data-k="value">${(q.options||[]).map(o=>`<option>${o}</option>`).join("")}</select>`;
    d.querySelector('select').value = existing.value || q.options?.[0];
    d.querySelector('select').onchange = () => { state.hasUnsavedChanges=true; scheduleAutoSave(); };
    return d;
}
function renderText(q, existing={}) {
    const d = document.createElement("div");
    d.className="item";
    d.innerHTML = `<div class="title">${q.label}</div><textarea data-k="text">${existing.text||""}</textarea>`;
    d.querySelector('textarea').oninput = () => { state.hasUnsavedChanges=true; scheduleAutoSave(); };
    return d;
}

function buildForm(template, responses) {
  const host = $("formHost");
  host.innerHTML = "";
  state.formResponses = responses;
  updateProgress();

  for (const mod of template.modules || []) {
    host.appendChild(renderModuleInfoCard(mod));
    
    const section = document.createElement("div");
    section.className = "panel collapsible-section";
    const header = document.createElement("div");
    header.className = "collapsible-header";
    header.innerHTML = `<h4>${escapeHtml(mod.name)}</h4>`;
    header.onclick = () => section.classList.toggle('collapsed');
    
    const content = document.createElement("div");
    content.className = "collapsible-content";

    for (const q of mod.questions || []) {
      const existing = responses[q.id] || {};
      let el;
      if (q.schema === "consent_rating") el = renderConsentRating(q, existing);
      else if (q.schema === "scale_0_10") el = renderScale(q, existing);
      else if (q.schema === "enum") el = renderEnum(q, existing);
      else el = renderText(q, existing);

      el.dataset.qid = q.id;
      el.dataset.schema = q.schema;
      content.appendChild(el);
    }
    section.appendChild(header);
    section.appendChild(content);
    host.appendChild(section);
  }
  updateVisibility();
}

function collectForm() {
    const out = {};
    document.querySelectorAll('.item[data-qid]').forEach(b => {
        const qid = b.dataset.qid;
        const schema = b.dataset.schema;
        if(schema==="consent_rating") {
            const hasDom = !!b.querySelector('[data-k="dom_status"]');
            const c = b.querySelector('[data-k="conditions"]')?.value;
            const n = b.querySelector('[data-k="notes"]')?.value;
            if(hasDom) {
                out[qid] = {
                    dom_status: b.querySelector('[data-k="dom_status"]').value,
                    sub_status: b.querySelector('[data-k="sub_status"]').value,
                    dom_interest: Number(b.querySelector('[data-k="dom_interest"]').value),
                    sub_interest: Number(b.querySelector('[data-k="sub_interest"]').value),
                    conditions: c, notes: n
                };
            } else {
                out[qid] = {
                    status: b.querySelector('[data-k="status"]').value,
                    interest: Number(b.querySelector('[data-k="interest"]').value),
                    comfort: Number(b.querySelector('[data-k="comfort"]').value),
                    conditions: c, notes: n
                };
            }
        } else if (schema==="scale_0_10") {
            out[qid] = {value: Number(b.querySelector('input').value)};
        } else if (schema==="enum") {
            out[qid] = {value: b.querySelector('select').value};
        } else {
            out[qid] = {text: b.querySelector('textarea').value};
        }
    });
    return out;
}

// Scenarios
async function loadScenarios() {
  try {
    const data = await api("/api/scenarios");
    // Handle both old format (array) and new format (object with decks)
    if (Array.isArray(data)) {
      state.scenarios = data;
      state.scenarioDecks = [];
    } else {
      state.scenarios = data.scenarios || [];
      state.scenarioDecks = data.decks || [];
      // Set first deck as active if no deck selected
      if (state.scenarioDecks.length > 0 && !state.activeDeck) {
        state.activeDeck = state.scenarioDecks[0].id;
      }
    }
    renderScenarios();
    show($("home"), false);
    show($("create"), false);
    show($("extras"), false);
    show($("scenarioView"), true);
  } catch(e) {
    alert("Fehler beim Laden der Szenarien: " + e.message);
  }
}

function renderScenarios() {
  const host = $("scenarioHost");
  host.innerHTML = "";
  // Reset grid layout for scenarios to be a single column centered stream
  host.className = ""; 
  
  // Render deck navigation if decks exist
  if (state.scenarioDecks.length > 0) {
    const deckNav = document.createElement("div");
    deckNav.className = "scenario-deck-nav";
    deckNav.style.cssText = "display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; padding: 16px; background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--card-border);";
    
    state.scenarioDecks.forEach(deck => {
      const btn = document.createElement("button");
      btn.className = `btn ${state.activeDeck === deck.id ? 'primary' : ''}`;
      btn.textContent = deck.name;
      btn.title = deck.description;
      btn.onclick = () => {
        state.activeDeck = deck.id;
        renderScenarios();
      };
      deckNav.appendChild(btn);
    });
    
    host.appendChild(deckNav);
  }
  
  // Filter scenarios by active deck
  let scenariosToShow = state.scenarios;
  if (state.activeDeck && state.scenarioDecks.length > 0) {
    const activeDeckData = state.scenarioDecks.find(d => d.id === state.activeDeck);
    if (activeDeckData) {
      scenariosToShow = state.scenarios.filter(s => activeDeckData.scenarios.includes(s.id));
    }
  }
  
  if (scenariosToShow.length === 0) {
    host.innerHTML += "<div style='text-align:center; padding:40px;'>Keine Szenarien gefunden.</div>";
    return;
  }
  const getSaved = (id) => { const key = `SCENARIO_${id}`; return state.formResponses[key]?.choice; };

  scenariosToShow.forEach(scen => {
    // Check safety gate
    let gatePassed = true;
    let gateMessage = "";
    if (scen.safety_gate) {
      // For now, we'll check if safeword is mentioned in responses (simplified check)
      // In a real implementation, this would check actual session data
      gatePassed = false; // Default to showing warning
      gateMessage = scen.safety_gate.message || "Sicherheits-Gate nicht erfüllt";
    }
    
    const card = document.createElement("div");
    card.className = "scenario-card";
    if (!gatePassed && scen.safety_gate) {
      card.style.opacity = "0.7";
      card.style.border = "2px solid var(--danger-border)";
    }
    
    // Safety Gate Warning
    const safetyGateWarning = !gatePassed && scen.safety_gate ? `
      <div class="safety-gate-warning">
        <div class="safety-gate-header">
          <span class="safety-gate-icon">🔒</span>
          <strong>Sicherheits-Gate erforderlich</strong>
        </div>
        <div class="safety-gate-content">
          ${escapeHtml(gateMessage)}
        </div>
      </div>
    ` : "";
    
    // Header
    const header = document.createElement("div");
    header.className = "scenario-header";
    header.innerHTML = `
      <div class="scenario-title">${escapeHtml(scen.title)}</div>
      <div class="scenario-category">${escapeHtml(scen.category)}</div>
    `;
    
    // Info Card
    const infoCard = scen.info_card ? `
      <div class="scenario-info-card">
        <div class="scenario-info-section">
          <div class="scenario-info-label">ℹ️ Emotionaler Kontext:</div>
          <div class="scenario-info-text">${escapeHtml(scen.info_card.emotional_context)}</div>
        </div>
        <div class="scenario-info-section">
          <div class="scenario-info-label">⚠️ Typische Risiken:</div>
          <div class="scenario-info-text">${escapeHtml(scen.info_card.typical_risks)}</div>
        </div>
        <div class="scenario-info-section">
          <div class="scenario-info-label">🔒 Sicherheits-Gate:</div>
          <div class="scenario-info-text">${escapeHtml(scen.info_card.safety_gate)}</div>
        </div>
      </div>
    ` : "";
    
    // Narrative Text
    const text = document.createElement("div");
    text.className = "scenario-text";
    text.innerHTML = escapeHtml(scen.description);

    // Options Container
    const optsDiv = document.createElement("div");
    optsDiv.className = "scenario-options";

    // Feedback Area
    const feedback = document.createElement("div");
    feedback.className = "msg hidden";
    feedback.style.marginTop = "16px";

    const savedChoice = getSaved(scen.id);

    // Render Options
    scen.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "scenario-btn";
      if (savedChoice === opt.id) btn.classList.add("selected");
      
      btn.innerHTML = `
        <span class="scenario-btn-key">${opt.id}</span>
        <div class="scenario-btn-content">
          <span class="scenario-btn-label">${escapeHtml(opt.label)}</span>
        </div>
      `;

      btn.onclick = () => {
        // Save
        const key = `SCENARIO_${scen.id}`;
        state.formResponses[key] = { choice: opt.id, risk_type: opt.risk_type, label: opt.label };
        state.hasUnsavedChanges = true;
        scheduleAutoSave();

        // UI Update
        optsDiv.querySelectorAll(".scenario-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");

        // Feedback Logic
        feedback.classList.remove("hidden");
        let colorClass = "";
        let msgText = "Auswahl gespeichert.";
        
        if (opt.risk_type === "boundary") {
          colorClass = "err";
          msgText = "Grenze gesetzt. (Gespeichert)";
        } else if (["negotiation", "hesitant", "checkin", "safety", "conditional"].includes(opt.risk_type)) {
          colorClass = "warn"; // We'll style this if needed, or use default msg color
          msgText = "Bedingung / Check-in notiert. (Gespeichert)";
        } else {
          colorClass = "ok";
          msgText = "Interesse notiert. (Gespeichert)";
        }
        
        msg(feedback, msgText, colorClass);
      };
      
      optsDiv.appendChild(btn);
    });

    card.appendChild(header);
    if (safetyGateWarning) {
      const gateDiv = document.createElement("div");
      gateDiv.innerHTML = safetyGateWarning;
      card.appendChild(gateDiv.firstElementChild);
    }
    if (scen.info_card) {
      const infoCardDiv = document.createElement("div");
      infoCardDiv.innerHTML = infoCard;
      card.appendChild(infoCardDiv.firstElementChild);
    }
    card.appendChild(text);
    card.appendChild(optsDiv);
    card.appendChild(feedback);
    
    // Restore feedback state if loaded
    if(savedChoice) {
       const opt = scen.options.find(o => o.id === savedChoice);
       if(opt) {
          feedback.classList.remove("hidden");
          if(opt.risk_type === "boundary") msg(feedback, "Grenze gesetzt.", "err");
          else if(["active", "explore", "submission"].includes(opt.risk_type)) msg(feedback, "Interesse notiert.", "ok");
          else msg(feedback, "Bedingung notiert.", "");
       }
    }

    host.appendChild(card);
  });
}

// Helpers (Dependencies, Visibility)
let visibilityCache = null;
function updateVisibility() {
  if (!state.currentTemplate) return;
  const responses = collectFormCached();
  const host = $("formHost");
  state.currentTemplate.modules.forEach(m => m.questions.forEach(q => {
    if (q.depends_on) {
       const visible = evaluateDependency(q.depends_on, responses);
       const el = host.querySelector(`.item[data-qid="${q.id}"]`);
       if (el) {
         if (visible) el.classList.remove("hidden");
         else el.classList.add("hidden");
       }
    }
  }));
}
function evaluateDependency(dep, responses) {
  const t = responses[dep.id];
  if (!t) return false;
  
  // Bestehende Logik für values
  if (dep.values && Array.isArray(dep.values)) {
    const val = t.value || t.status || t.dom_status || t.active_status;
    return dep.values.includes(val);
  }
  
  // Neue Logik für scale_0_10 Bedingungen
  if (dep.condition) {
    const value = t.value;
    if (value === undefined || value === null) return false;
    
    // Parse condition: "scale_0_10 >= 5" oder ">= 5"
    const match = dep.condition.match(/(>=|<=|>|<|==)\s*(\d+)/);
    if (match) {
      const operator = match[1];
      const threshold = parseInt(match[2]);
      switch(operator) {
        case ">=": return value >= threshold;
        case "<=": return value <= threshold;
        case ">": return value > threshold;
        case "<": return value < threshold;
        case "==": return value == threshold;
      }
    }
  }
  
  // Bestehende conditions Logik
  if (dep.conditions) {
    const val = t.value || t.status || t.dom_status || t.active_status;
    return dep.conditions.every(c => {
        if(c.operator === "!=" && c.value === val) return false;
        return true; 
    });
  }
  
  return false;
}

// Autosave
let collectFormCache = null;
function scheduleAutoSave() { if(state.autoSaveTimer) clearTimeout(state.autoSaveTimer); state.autoSaveTimer = setTimeout(autoSave, 1000); }
function collectFormCached() { if(!collectFormCache) collectFormCache = collectForm(); return collectFormCache; }
async function autoSave() {
    if(!state.currentSession || !state.currentPerson) return;
    try {
        const {password, pin} = getAuth();
        await api(`/api/sessions/${state.currentSession.id}/responses/${state.currentPerson}/save`, {
            method: "POST", body: JSON.stringify({password, pin, responses: collectForm()})
        });
        msg($("saveMsg"), "Auto-Saved", "ok");
    } catch(e) {}
}
function handleBeforeUnload(e) { if (state.hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } }
function startSaveStatusUpdates() {}
function stopSaveStatusUpdates() {}
function validateForm() { return {errors:[], warnings:[]}; } 
function updateProgress() {} 
function validateAndShowHints() {} 

// Actions
async function startFill(person) {
    const {password, pin} = getAuth();
    state.currentPerson = person;
    const res = await api(`/api/sessions/${state.currentSession.id}/responses/${person}/load`, {
        method: "POST", body: JSON.stringify({password, pin})
    });
    buildForm(state.currentTemplate, res.responses||{});
    show($("panelForm"), true);
}
async function saveFill() {
    const {password, pin} = getAuth();
    await api(`/api/sessions/${state.currentSession.id}/responses/${state.currentPerson}/save`, {
        method: "POST", body: JSON.stringify({password, pin, responses: collectForm()})
    });
    msg($("saveMsg"), "Gespeichert", "ok");
}
async function doCompare() {
    const {password} = getAuth();
    const res = await api(`/api/sessions/${state.currentSession.id}/compare`, {
        method: "POST", body: JSON.stringify({password})
    });
    const host = $("compareHost");
    host.innerHTML = "";
    res.items.forEach(it => {
        const d = document.createElement("div");
        d.className = `item ${it.pair_status.toLowerCase()}-highlight`;
        d.innerHTML = `<b>${it.label}</b>: ${it.pair_status}<br>A: ${JSON.stringify(it.a)}<br>B: ${JSON.stringify(it.b)}`;
        host.appendChild(d);
    });
    show($("panelCompare"), true);
    show($("panelForm"), false);
}

// Init
$("btnRefresh").onclick = loadSessions;
$("btnCreate").onclick = async () => {
    try {
        await api("/api/sessions", {
            method:"POST", 
            body: JSON.stringify({
                name: $("newName").value, 
                template_id: $("newTemplate").value, 
                password: $("newPassword").value,
                pin_a: $("newPinA").value,
                pin_b: $("newPinB").value
            })
        });
        loadSessions();
    } catch(e) { alert(e); }
};
$("btnBack").onclick = backHome;
$("btnFillA").onclick = () => startFill("A").catch(alert);
$("btnFillB").onclick = () => startFill("B").catch(alert);
$("btnSaveForm").onclick = () => saveFill().catch(alert);
$("btnCloseForm").onclick = () => show($("panelForm"), false);
$("btnCompare").onclick = () => doCompare().catch(alert);
$("btnCloseCompare").onclick = () => show($("panelCompare"), false);
$("btnScenarios").onclick = loadScenarios;
$("btnScenarios").innerHTML = `${Icons.cards} Szenarien-Modus`;
$("btnCloseScenarios").onclick = backHome;

// Boot
(async () => {
    await loadTemplates();
    await loadSessions();
})();
