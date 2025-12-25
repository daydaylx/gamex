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
  visibilityTimer: null,
  validationTimer: null,
  validationEnabled: false,
  questionIndex: [],
  navItems: new Map(),
  moduleIndex: [],
  navOpen: false,
  compareData: null,
  compareFilters: { bucket: "ALL", riskOnly: false, flaggedOnly: false, query: "", moduleId: null },
  scenarioFilters: { category: "ALL", status: "ALL", gateOnly: false },
  scenarioActiveIds: [],
  scenarios: [],
  scenarioDecks: [],
  activeDeck: null,
};

// Offline detection
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
    isOnline = true;
    updateOfflineIndicator();
});
window.addEventListener('offline', () => {
    isOnline = false;
    updateOfflineIndicator();
});

function updateOfflineIndicator() {
    const indicator = document.getElementById("offlineIndicator");
    if (!indicator) {
        const ind = document.createElement("div");
        ind.id = "offlineIndicator";
        ind.className = "offline-indicator";
        document.body.insertBefore(ind, document.body.firstChild);
        updateOfflineIndicator();
        return;
    }
    
    if (!isOnline) {
        indicator.textContent = "🔴 Offline";
        indicator.classList.add("visible");
    } else {
        indicator.classList.remove("visible");
    }
}

async function api(path, opts = {}) {
  if (window.LocalApi && window.LocalApi.enabled) {
    return window.LocalApi.request(path, opts);
  }
  
  try {
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
  } catch (error) {
    // Better error handling for offline scenarios
    if (!isOnline) {
      throw new Error("Keine Internetverbindung. Bitte prüfe deine Verbindung und versuche es erneut.");
    }
    throw error;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
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

function showError(el, error, prefix = "Fehler") {
  if (!el) return;
  const detail = error?.message || String(error || "");
  const text = detail ? `${prefix}: ${detail}` : prefix;
  msg(el, text, "err");
}

function setSaveStatus(text, kind = "") {
  const el = $("saveStatus");
  if (!el) return;
  el.textContent = text || "";
  el.className = "save-status" + (kind ? ` ${kind}` : "");
}

function setValidationSummary(text, kind = "") {
  const el = $("validationSummary");
  if (!el) return;
  el.textContent = text || "";
  el.className = "validation-summary" + (kind ? ` ${kind}` : "");
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
  const host = $("sessionsList");
  host.innerHTML = "";
  host.className = "list"; 
  try {
    state.sessions = await api("/api/sessions");
  } catch (e) {
    host.innerHTML = `<div class="item" style="grid-column: 1/-1; text-align: center; color: var(--danger);">Fehler beim Laden der Sessions: ${escapeHtml(e.message)}</div>`;
    return;
  }

  if (state.sessions.length === 0) {
    host.innerHTML = `<div class="item" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Keine Sessions gefunden. Erstelle eine neue!</div>`;
    return;
  }

  for (const s of state.sessions) {
    const div = document.createElement("div");
    div.className = "item";
    const dateStr = new Date(s.created_at).toLocaleDateString('de-DE', { month: 'short', year: 'numeric', day: 'numeric' });
    const completed = (s.has_a ? 1 : 0) + (s.has_b ? 1 : 0);
    const pct = Math.round((completed / 2) * 100);
    const ctaLabel = completed === 0 ? "Starten" : (completed === 2 ? "Vergleich" : "Weiter");
    div.innerHTML = `
      <div class="row space" style="margin-bottom: 12px;">
        <div class="title" style="font-size: 1.1rem;">${escapeHtml(s.name)}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</div>
      </div>
      <div class="row" style="margin-bottom: 16px;">
        <span class="badge ${s.has_a ? 'risk-badge-A' : ''}">Person A ${s.has_a ? '✓' : '—'}</span>
        <span class="badge ${s.has_b ? 'risk-badge-A' : ''}">Person B ${s.has_b ? '✓' : '—'}</span>
      </div>
      <div class="session-progress">
        <div class="session-progress-bar">
          <div class="session-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="session-progress-text">${completed}/2 Antworten</div>
      </div>
      <div class="hint" style="margin-bottom: 16px; font-family: monospace; opacity: 0.7;">ID: ${escapeHtml(s.id).substring(0,8)}...</div>
      <button class="btn primary" style="width: 100%; justify-content: center; gap: 8px;" data-open="${escapeHtml(s.id)}">
        ${Icons.play} ${ctaLabel}
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
  msg($("saveMsg"), "");
  setSaveStatus("");
  setValidationSummary("");
  state.validationEnabled = false;
  state.compareData = null;
  state.compareFilters = { bucket: "ALL", riskOnly: false, flaggedOnly: false, query: "", moduleId: null };
  state.scenarioActiveIds = [];
  setNavOpen(false);
  
  $("authPassword").value = "";
  $("authPin").value = "";
}

function backHome() {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  stopSaveStatusUpdates();
  state.currentSession = null;
  state.currentTemplate = null;
  state.currentPerson = null;
  state.hasUnsavedChanges = false;
  state.formResponses = {};
  state.questionIndex = [];
  state.moduleIndex = [];
  state.navItems = new Map();
  state.navOpen = false;
  state.validationEnabled = false;
  state.compareData = null;
  state.compareFilters = { bucket: "ALL", riskOnly: false, flaggedOnly: false, query: "", moduleId: null };
  setSaveStatus("");
  setValidationSummary("");
  setNavOpen(false);
  if (state.autoSaveTimer) {
    clearTimeout(state.autoSaveTimer);
    state.autoSaveTimer = null;
  }
  if (state.visibilityTimer) {
    clearTimeout(state.visibilityTimer);
    state.visibilityTimer = null;
  }
  if (state.validationTimer) {
    clearTimeout(state.validationTimer);
    state.validationTimer = null;
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

function safeDomId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "-");
}

function markAnswered(el) {
  if (el && el.dataset) {
    el.dataset.answered = "true";
  }
}

function isQuestionAnswered(el) {
  return el?.dataset?.answered === "true";
}

function handleFormChange(itemEl) {
  markAnswered(itemEl);
  state.hasUnsavedChanges = true;
  setSaveStatus("Änderungen nicht gespeichert", "warn");
  scheduleAutoSave();
  scheduleVisibilityUpdate();
  scheduleValidation();
  updateProgress();
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

function toggleModule(section, expanded = null) {
  if (!section) return;
  const shouldExpand = expanded === null ? section.classList.contains("collapsed") : expanded;
  section.classList.toggle("collapsed", !shouldExpand);
  const header = section.querySelector(".collapsible-header");
  if (header) header.setAttribute("aria-expanded", shouldExpand ? "true" : "false");
  const content = section.querySelector(".collapsible-content");
  if (content) content.setAttribute("aria-hidden", shouldExpand ? "false" : "true");
}

function setNavOpen(open) {
  state.navOpen = !!open;
  const nav = $("questionNav");
  const backdrop = $("navBackdrop");
  const toggleBtn = $("btnToggleNav");
  if (nav) nav.classList.toggle("is-open", state.navOpen);
  if (backdrop) {
    backdrop.classList.toggle("hidden", !state.navOpen);
    backdrop.setAttribute("aria-hidden", state.navOpen ? "false" : "true");
  }
  if (toggleBtn) toggleBtn.setAttribute("aria-expanded", state.navOpen ? "true" : "false");
  document.body.classList.toggle("nav-open", state.navOpen);
}

function scrollToQuestion(qid) {
  const el = document.querySelector(`.item[data-qid="${qid}"]`);
  if (!el) return;
  const section = el.closest(".collapsible-section");
  if (section && section.classList.contains("collapsed")) toggleModule(section, true);
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("highlight");
  setTimeout(() => el.classList.remove("highlight"), 900);
}

function buildQuestionNav() {
  const nav = $("questionNav");
  if (!nav) return;
  nav.innerHTML = "";
  state.navItems = new Map();

  state.moduleIndex.forEach((mod) => {
    const section = document.createElement("div");
    section.className = "nav-section";

    const title = document.createElement("div");
    title.className = "nav-section-title";
    title.textContent = mod.name || "Modul";
    const progress = document.createElement("span");
    progress.className = "nav-section-progress";
    progress.dataset.moduleId = mod.key || safeDomId(mod.id);
    progress.textContent = "0/0";
    title.appendChild(progress);
    section.appendChild(title);

    mod.questions.forEach((q) => {
      const link = document.createElement("a");
      link.className = "nav-question-link";
      link.href = `#q-${safeDomId(q.id)}`;
      link.textContent = q.label || q.id;
      link.dataset.qid = q.id;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToQuestion(q.id);
        if (state.navOpen) setNavOpen(false);
      });
      section.appendChild(link);
      state.navItems.set(q.id, link);
    });

    nav.appendChild(section);
  });
}

// --- Render Logic ---

function renderRatingSelector(key, value, max, labels = []) {
    const container = document.createElement("div");
    container.className = "rating-selector-container";
    
    const labelRow = document.createElement("div");
    labelRow.className = "rating-labels";
    if (labels[0]) labelRow.innerHTML += `<span class="rating-label-min">${labels[0]}</span>`;
    if (labels[1]) labelRow.innerHTML += `<span class="rating-label-max">${labels[1]}</span>`;
    
    const btnGroup = document.createElement("div");
    btnGroup.className = "rating-btn-group";
    
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.dataset.k = key;
    hiddenInput.value = value;
    
    for (let i = 0; i <= max; i++) {
        const btn = document.createElement("button");
        btn.className = `rating-btn ${i == value ? 'selected' : ''}`;
        btn.type = "button";
        btn.textContent = i;
        btn.onclick = (e) => {
            e.preventDefault(); // Prevent form submission or scrolling
            hiddenInput.value = i;
            // Update UI
            btnGroup.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            // Trigger change for autosave
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        };
        btnGroup.appendChild(btn);
    }
    
    container.appendChild(labelRow);
    container.appendChild(btnGroup);
    container.appendChild(hiddenInput);
    return container;
}

function renderConsentRating(q, existing = {}) {
    const wrap = document.createElement("div");
    wrap.className = "item consent-item";
    const status = existing.status || "MAYBE";
    const interest = existing.interest ?? 2;
    const comfort = existing.comfort ?? 2;
    const intensity = existing.intensity ?? 3;
    const confidence = existing.confidence ?? existing.comfort ?? 3;
    const conditions = existing.conditions || "";
    const notes = existing.notes || "";
    const hardNo = existing.hardNo || false;
    const notNow = existing.notNow || false;
    const contextFlags = existing.contextFlags || [];
    const hasDomSub = q.has_dom_sub || false;
    const riskClass = `risk-badge-${q.risk_level || "A"}`;
    const tagsHtml = (q.tags || []).map(t => `<span class="badge tag-badge">${escapeHtml(t)}</span>`).join("");
    const hasDetailsContent = !!conditions.trim() || !!notes.trim();
    const maybeStatus = hasDomSub
      ? [existing.dom_status || status, existing.sub_status || status].includes("MAYBE")
      : (existing.status || status) === "MAYBE";
    const detailsOpen = q.risk_level === "C" || hasDetailsContent || maybeStatus;

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

    // Header Construction
    wrap.innerHTML = `
      <div class="title-row">
        <div class="title-text">
            <span class="badge ${riskClass}">Risk ${q.risk_level||"A"}</span> 
            <span class="question-label">${escapeHtml(q.label)}</span>
            ${infoBtn}
        </div>
        <div class="tags-container">${tagsHtml}</div>
      </div>
      ${infoBox}
      ${riskWarning}
      ${q.help && q.risk_level !== "C" ? `<div class="hint question-help">${escapeHtml(q.help)}</div>` : ""}
      
      <div class="consent-controls">
        ${hasDomSub ? `
            <div class="role-block">
                <div class="role-title">Dominante Rolle</div>
                <div class="control-group">
                    <label>Status</label>
                    <select data-k="dom_status" class="status-select">
                        <option value="YES">JA (Generell)</option>
                        <option value="MAYBE">Ja, aber nur wenn... (Bedingungen nötig)</option>
                        <option value="NO">NEIN (Eher nicht)</option>
                        <option value="HARD_LIMIT">HARD LIMIT (Auf keinen Fall)</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Interesse (0=Keins, 4=Hoch)</label>
                    <div id="dom_int_host"></div>
                </div>
                <div class="control-group">
                    <label>Komfort (0=Unwohl, 4=Super)</label>
                    <div id="dom_comf_host"></div>
                </div>
            </div>
            
            <div class="role-block">
                <div class="role-title">Submissive Rolle</div>
                <div class="control-group">
                    <label>Status</label>
                    <select data-k="sub_status" class="status-select">
                        <option value="YES">JA (Generell)</option>
                        <option value="MAYBE">Ja, aber nur wenn... (Bedingungen nötig)</option>
                        <option value="NO">NEIN (Eher nicht)</option>
                        <option value="HARD_LIMIT">HARD LIMIT (Auf keinen Fall)</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Interesse (0=Keins, 4=Hoch)</label>
                    <div id="sub_int_host"></div>
                </div>
                <div class="control-group">
                    <label>Komfort (0=Unwohl, 4=Super)</label>
                    <div id="sub_comf_host"></div>
                </div>
            </div>
        ` : `
            <div class="control-group full-width">
                <label>Status</label>
                <select data-k="status" class="status-select">
                    <option value="YES">JA (Generell)</option>
                    <option value="MAYBE">VIELLEICHT (Diskutieren)</option>
                    <option value="NO">NEIN (Eher nicht)</option>
                    <option value="HARD_LIMIT">HARD LIMIT (Auf keinen Fall)</option>
                </select>
            </div>
            <div class="split-controls">
                <div class="control-group">
                    <label>Interesse</label>
                    <div id="int_host"></div>
                </div>
                <div class="control-group">
                    <label>Komfort</label>
                    <div id="comf_host"></div>
                </div>
            </div>
            <div class="split-controls">
                <div class="control-group">
                    <label>Intensität (1-5)</label>
                    <div id="intensity_host"></div>
                </div>
                <div class="control-group">
                    <label>Selbstvertrauen (1-5)</label>
                    <div id="confidence_host"></div>
                </div>
            </div>
        `}
      </div>

      <details class="advanced-toggle" ${detailsOpen || hardNo || notNow || contextFlags.length > 0 ? "open" : ""}>
        <summary>Erweiterte Optionen</summary>
        <div class="space-y">
          <div class="control-group">
            <label class="checkbox-label">
              <input type="checkbox" data-k="hardNo" ${hardNo ? "checked" : ""}>
              <span>Hard Limit (absolut nein, nicht verhandelbar)</span>
            </label>
          </div>
          <div class="control-group">
            <label class="checkbox-label">
              <input type="checkbox" data-k="notNow" ${notNow ? "checked" : ""}>
              <span>Nicht jetzt (später möglich, aber nicht aktuell)</span>
            </label>
          </div>
          <div class="control-group">
            <label>Kontext-Flags</label>
            <div class="context-flags">
              <label class="checkbox-label-large">
                <input type="checkbox" data-flag="with_preparation" ${contextFlags.includes("with_preparation") ? "checked" : ""}>
                <span>Nur mit Vorbereitung</span>
              </label>
              <label class="checkbox-label-large">
                <input type="checkbox" data-flag="with_aftercare" ${contextFlags.includes("with_aftercare") ? "checked" : ""}>
                <span>Nur mit Aftercare</span>
              </label>
              <label class="checkbox-label-large">
                <input type="checkbox" data-flag="in_relationship" ${contextFlags.includes("in_relationship") ? "checked" : ""}>
                <span>Nur in Beziehung</span>
              </label>
              <label class="checkbox-label-large">
                <input type="checkbox" data-flag="with_safeword" ${contextFlags.includes("with_safeword") ? "checked" : ""}>
                <span>Nur mit Safe-Word</span>
              </label>
            </div>
          </div>
        </div>
      </details>

      <details class="notes-toggle" ${detailsOpen ? "open" : ""}>
        <summary>Bedingungen & Notizen</summary>
        <div class="space-y text-inputs">
          <textarea data-k="conditions" placeholder="Bedingungen / Wichtige Details..." rows="2"></textarea>
          <textarea data-k="notes" placeholder="Private Notizen..." rows="2"></textarea>
        </div>
      </details>
    `;
    
    // Inject Rating Selectors
    const labelsInt = ["0 (Keins)", "4 (Hoch)"];
    const labelsComf = ["0 (Unwohl)", "4 (Super)"];

    if(hasDomSub) {
      wrap.querySelector('#dom_int_host').appendChild(renderRatingSelector('dom_interest', existing.dom_interest ?? interest, 4, labelsInt));
      wrap.querySelector('#dom_comf_host').appendChild(renderRatingSelector('dom_comfort', existing.dom_comfort ?? comfort, 4, labelsComf));
      wrap.querySelector('#sub_int_host').appendChild(renderRatingSelector('sub_interest', existing.sub_interest ?? interest, 4, labelsInt));
      wrap.querySelector('#sub_comf_host').appendChild(renderRatingSelector('sub_comfort', existing.sub_comfort ?? comfort, 4, labelsComf));
      
      wrap.querySelector('[data-k="dom_status"]').value = existing.dom_status || status;
      wrap.querySelector('[data-k="sub_status"]').value = existing.sub_status || status;
    } else {
      wrap.querySelector('#int_host').appendChild(renderRatingSelector('interest', existing.interest ?? interest, 4, labelsInt));
      wrap.querySelector('#comf_host').appendChild(renderRatingSelector('comfort', existing.comfort ?? comfort, 4, labelsComf));
      wrap.querySelector('#intensity_host').appendChild(renderRatingSelector('intensity', intensity, 5, ["1 (Sanft)", "5 (Intensiv)"]));
      wrap.querySelector('#confidence_host').appendChild(renderRatingSelector('confidence', confidence, 5, ["1 (Unsicher)", "5 (Sicher)"]));
      wrap.querySelector('[data-k="status"]').value = existing.status || status;
    }
    
    wrap.querySelector('[data-k="conditions"]').value = conditions;
    wrap.querySelector('[data-k="notes"]').value = notes;
    
    // Context Flags Event Handler
    wrap.querySelectorAll('[data-flag]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        handleFormChange(wrap);
      });
    });

    // Change Events
    const detailsEl = wrap.querySelector(".notes-toggle");
    const shouldOpenDetailsNow = () => {
      const condVal = wrap.querySelector('[data-k="conditions"]')?.value.trim();
      const noteVal = wrap.querySelector('[data-k="notes"]')?.value.trim();
      const statusValues = hasDomSub
        ? [wrap.querySelector('[data-k="dom_status"]').value, wrap.querySelector('[data-k="sub_status"]').value]
        : [wrap.querySelector('[data-k="status"]').value];
      return q.risk_level === "C" || !!condVal || !!noteVal || statusValues.includes("MAYBE");
    };

    wrap.addEventListener('change', (e) => { 
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            handleFormChange(wrap);
            if (detailsEl && shouldOpenDetailsNow()) detailsEl.open = true;
        }
    });
    wrap.querySelectorAll('textarea').forEach(e => {
        e.addEventListener('input', () => {
          handleFormChange(wrap);
          if (detailsEl && shouldOpenDetailsNow()) detailsEl.open = true;
        });
    });

    return wrap;
}

function renderScale(q, existing={}) {
    const d = document.createElement("div");
    d.className="item scale-item";
    const val = existing.value ?? 5;
    
    d.innerHTML = `
        <div class="title">${q.label}</div>
        <div class="range-container">
            <div class="range-labels">
                <span>0 (Niedrig/Nein)</span>
                <span id="val_display_${q.id}" class="range-value-display">${val}</span>
                <span>10 (Hoch/Ja)</span>
            </div>
            <input data-k="value" type="range" min="0" max="10" value="${val}" class="range-slider">
        </div>
    `;
    
    const input = d.querySelector('input');
    const display = d.querySelector(`#val_display_${q.id}`);
    
    input.oninput = (e) => {
        display.textContent = e.target.value;
        handleFormChange(d);
    };
    
    return d;
}
function renderEnum(q, existing={}) {
    const d = document.createElement("div");
    d.className="item";
    d.innerHTML = `<div class="title">${q.label}</div><select data-k="value">${(q.options||[]).map(o=>`<option>${o}</option>`).join("")}</select>`;
    d.querySelector('select').value = existing.value || q.options?.[0];
    d.querySelector('select').onchange = () => handleFormChange(d);
    return d;
}
function renderText(q, existing={}) {
    const d = document.createElement("div");
    d.className="item";
    d.innerHTML = `<div class="title">${q.label}</div><textarea data-k="text">${existing.text||""}</textarea>`;
    d.querySelector('textarea').oninput = () => handleFormChange(d);
    return d;
}

function buildForm(template, responses) {
  const host = $("formHost");
  host.innerHTML = "";
  state.formResponses = responses || {};
  state.questionIndex = [];
  state.moduleIndex = [];
  state.navItems = new Map();
  state.hasUnsavedChanges = false;
  state.validationEnabled = false;
  if (state.visibilityTimer) {
    clearTimeout(state.visibilityTimer);
    state.visibilityTimer = null;
  }
  if (state.validationTimer) {
    clearTimeout(state.validationTimer);
    state.validationTimer = null;
  }
  setSaveStatus("Bereit");
  setValidationSummary("");
  if (typeof clearValidationDisplays === "function") clearValidationDisplays();

  const totalModules = (template.modules || []).length;
  let moduleIndex = 0;
  
  for (const mod of template.modules || []) {
    moduleIndex++;
    const moduleKey = safeDomId(mod.id);
    host.appendChild(renderModuleInfoCard(mod));
    
    const section = document.createElement("div");
    section.className = "panel collapsible-section";
    section.dataset.moduleId = moduleKey;
    const header = document.createElement("div");
    header.className = "collapsible-header";
    header.innerHTML = `
      <div class="module-title">
        <h4>${escapeHtml(mod.name)} <span class="chapter-indicator">(Kapitel ${moduleIndex} von ${totalModules})</span></h4>
        <span class="module-progress" data-module-id="${moduleKey}">0/0</span>
      </div>
    `;
    header.onclick = () => toggleModule(section);
    
    const content = document.createElement("div");
    content.className = "collapsible-content";
    content.id = `module-content-${moduleKey}`;
    content.setAttribute("aria-hidden", "false");
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-controls", content.id);
    header.setAttribute("aria-expanded", "true");
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleModule(section);
      }
    });

    const moduleEntry = {
      id: mod.id,
      key: moduleKey,
      name: mod.name,
      section,
      header,
      questions: []
    };
    state.moduleIndex.push(moduleEntry);

    for (const q of mod.questions || []) {
      const existing = responses[q.id] || {};
      let el;
      if (q.schema === "consent_rating") el = renderConsentRating(q, existing);
      else if (q.schema === "scale_0_10") el = renderScale(q, existing);
      else if (q.schema === "enum") el = renderEnum(q, existing);
      else el = renderText(q, existing);

      el.dataset.qid = q.id;
      el.dataset.schema = q.schema;
      el.dataset.moduleId = moduleKey;
      el.dataset.answered = responses[q.id] ? "true" : "false";
      el.id = `q-${safeDomId(q.id)}`;
      moduleEntry.questions.push({ id: q.id, label: q.label });
      state.questionIndex.push({ id: q.id, label: q.label, moduleId: mod.id });
      content.appendChild(el);
    }
    section.appendChild(header);
    section.appendChild(content);
    host.appendChild(section);
  }
  buildQuestionNav();
  updateVisibility();
  updateProgress();
  setNavOpen(false);
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
                    dom_comfort: Number(b.querySelector('[data-k="dom_comfort"]').value),
                    sub_comfort: Number(b.querySelector('[data-k="sub_comfort"]').value),
                    conditions: c, notes: n
                };
            } else {
                const intensityEl = b.querySelector('[data-k="intensity"]');
                const confidenceEl = b.querySelector('[data-k="confidence"]');
                const hardNoEl = b.querySelector('[data-k="hardNo"]');
                const notNowEl = b.querySelector('[data-k="notNow"]');
                const contextFlags = Array.from(b.querySelectorAll('[data-flag]:checked')).map(cb => cb.dataset.flag);
                
                out[qid] = {
                    status: b.querySelector('[data-k="status"]').value,
                    interest: Number(b.querySelector('[data-k="interest"]').value),
                    comfort: Number(b.querySelector('[data-k="comfort"]').value),
                    intensity: intensityEl ? Number(intensityEl.value) : 3,
                    confidence: confidenceEl ? Number(confidenceEl.value) : undefined,
                    hardNo: hardNoEl ? hardNoEl.checked : false,
                    notNow: notNowEl ? notNowEl.checked : false,
                    contextFlags: contextFlags.length > 0 ? contextFlags : undefined,
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
    msg($("scenarioMsg"), "");
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
    state.scenarioFilters = { category: "ALL", status: "ALL", gateOnly: false };
    renderScenarios();
    show($("home"), false);
    show($("create"), false);
    show($("extras"), false);
    show($("scenarioView"), true);
  } catch(e) {
    showError($("scenarioMsg"), e, "Szenarien konnten nicht geladen werden");
  }
}

function renderScenarios() {
  const host = $("scenarioHost");
  host.innerHTML = "";
  // Reset grid layout for scenarios to be a single column centered stream
  host.className = ""; 
  
  let activeDeckData = null;
  if (state.scenarioDecks.length > 0) {
    const decks = [...state.scenarioDecks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const deckNav = document.createElement("div");
    deckNav.className = "scenario-deck-nav";
    deckNav.style.cssText = "display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; padding: 16px; background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--card-border);";
    
    decks.forEach(deck => {
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
    activeDeckData = decks.find(d => d.id === state.activeDeck) || null;
  }
  
  let scenariosToShow = state.scenarios;
  if (activeDeckData) {
    scenariosToShow = state.scenarios.filter(s => activeDeckData.scenarios.includes(s.id));
  }
  state.scenarioActiveIds = scenariosToShow.map(s => s.id);
  
  const getSaved = (id) => { const key = `SCENARIO_${id}`; return state.formResponses[key]?.choice; };

  if (activeDeckData) {
    const deckInfo = document.createElement("div");
    deckInfo.className = "scenario-deck-info";
    deckInfo.innerHTML = `
      <div class="scenario-deck-title">${escapeHtml(activeDeckData.name)}</div>
      <div class="scenario-deck-desc">${escapeHtml(activeDeckData.description || "")}</div>
      ${activeDeckData.requires_safety_gate ? `<div class="badge risk-badge-C">Sicherheits-Gate empfohlen</div>` : ""}
    `;
    host.appendChild(deckInfo);
  }

  const totalCount = scenariosToShow.length;
  const answeredCount = scenariosToShow.filter(s => getSaved(s.id)).length;
  const pct = totalCount ? Math.round((answeredCount / totalCount) * 100) : 0;

  const metaBar = document.createElement("div");
  metaBar.className = "scenario-meta";
  const progress = document.createElement("div");
  progress.className = "scenario-progress";
  progress.innerHTML = `
    <div class="scenario-progress-text">${answeredCount}/${totalCount} beantwortet</div>
    <div class="scenario-progress-bar">
      <div class="scenario-progress-fill" style="width:${pct}%"></div>
    </div>
  `;
  metaBar.appendChild(progress);

  const filters = document.createElement("div");
  filters.className = "scenario-filters";
  const categories = Array.from(new Set(scenariosToShow.map(s => s.category).filter(Boolean))).sort();
  if (!categories.includes(state.scenarioFilters.category)) {
    state.scenarioFilters.category = "ALL";
  }
  const categorySelect = document.createElement("select");
  categorySelect.className = "scenario-filter";
  const allCat = document.createElement("option");
  allCat.value = "ALL";
  allCat.textContent = "Alle Kategorien";
  categorySelect.appendChild(allCat);
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  categorySelect.value = state.scenarioFilters.category || "ALL";
  categorySelect.onchange = () => {
    state.scenarioFilters.category = categorySelect.value;
    renderScenarios();
  };

  const statusSelect = document.createElement("select");
  statusSelect.className = "scenario-filter";
  const allowedStatus = ["ALL", "ANSWERED", "OPEN"];
  if (!allowedStatus.includes(state.scenarioFilters.status)) {
    state.scenarioFilters.status = "ALL";
  }
  const statusOptions = [
    { value: "ALL", label: "Alle Status" },
    { value: "ANSWERED", label: "Beantwortet" },
    { value: "OPEN", label: "Offen" }
  ];
  statusOptions.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    statusSelect.appendChild(o);
  });
  statusSelect.value = state.scenarioFilters.status || "ALL";
  statusSelect.onchange = () => {
    state.scenarioFilters.status = statusSelect.value;
    renderScenarios();
  };

  const gateToggle = document.createElement("label");
  gateToggle.className = "scenario-filter-toggle";
  const gateInput = document.createElement("input");
  gateInput.type = "checkbox";
  gateInput.checked = !!state.scenarioFilters.gateOnly;
  gateInput.onchange = () => {
    state.scenarioFilters.gateOnly = gateInput.checked;
    renderScenarios();
  };
  gateToggle.appendChild(gateInput);
  gateToggle.appendChild(document.createTextNode("Nur mit Sicherheits-Gate"));

  filters.appendChild(categorySelect);
  filters.appendChild(statusSelect);
  filters.appendChild(gateToggle);
  metaBar.appendChild(filters);
  host.appendChild(metaBar);

  const filteredScenarios = scenariosToShow.filter(scen => {
    if (state.scenarioFilters.category !== "ALL" && scen.category !== state.scenarioFilters.category) return false;
    const answered = !!getSaved(scen.id);
    if (state.scenarioFilters.status === "ANSWERED" && !answered) return false;
    if (state.scenarioFilters.status === "OPEN" && answered) return false;
    if (state.scenarioFilters.gateOnly) {
      const hasGate = !!scen.info_card?.safety_gate || !!activeDeckData?.requires_safety_gate;
      if (!hasGate) return false;
    }
    return true;
  });

  if (filteredScenarios.length === 0) {
    host.innerHTML += "<div style='text-align:center; padding:40px;'>Keine Szenarien gefunden.</div>";
    return;
  }

  filteredScenarios.forEach(scen => {
    const card = document.createElement("div");
    card.className = "scenario-card";
    
    const gateText = scen.info_card?.safety_gate;
    const deckGate = !!activeDeckData?.requires_safety_gate;
    const showGate = !!gateText || deckGate;
    const gateMessage = gateText || (deckGate ? "Dieses Deck setzt ein vereinbartes Sicherheits-Gate voraus." : "");
    
    const safetyGateWarning = showGate ? `
      <div class="safety-gate-warning">
        <div class="safety-gate-header">
          <span class="safety-gate-icon">🔒</span>
          <strong>Sicherheits-Gate</strong>
        </div>
        <div class="safety-gate-content">
          ${escapeHtml(gateMessage)}
        </div>
      </div>
    ` : "";
    
    const header = document.createElement("div");
    header.className = "scenario-header";
    header.innerHTML = `
      <div class="scenario-title">${escapeHtml(scen.title)}</div>
      <div class="scenario-category">${escapeHtml(scen.category)}</div>
    `;
    
    const badges = document.createElement("div");
    badges.className = "scenario-badges";
    if (activeDeckData) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = activeDeckData.name;
      badges.appendChild(badge);
    }
    if (showGate) {
      const badge = document.createElement("span");
      badge.className = "badge risk-badge-C";
      badge.textContent = "Gate";
      badges.appendChild(badge);
    }
    
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
        ${scen.info_card.safety_gate ? `
        <div class="scenario-info-section">
          <div class="scenario-info-label">🔒 Sicherheits-Gate:</div>
          <div class="scenario-info-text">${escapeHtml(scen.info_card.safety_gate)}</div>
        </div>
        ` : ""}
      </div>
    ` : "";
    
    const text = document.createElement("div");
    text.className = "scenario-text";
    text.innerHTML = escapeHtml(scen.description);

    const optsDiv = document.createElement("div");
    optsDiv.className = "scenario-options";

    const feedback = document.createElement("div");
    feedback.className = "msg hidden";
    feedback.style.marginTop = "16px";

    const savedChoice = getSaved(scen.id);

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
        const key = `SCENARIO_${scen.id}`;
        state.formResponses[key] = { choice: opt.id, risk_type: opt.risk_type, label: opt.label };
        state.hasUnsavedChanges = true;
        scheduleAutoSave();

        optsDiv.querySelectorAll(".scenario-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");

        feedback.classList.remove("hidden");
        let colorClass = "";
        let msgText = "Auswahl gespeichert.";
        
        if (opt.risk_type === "boundary") {
          colorClass = "err";
          msgText = "Grenze gesetzt. (Gespeichert)";
        } else if (["negotiation", "hesitant", "checkin", "safety", "conditional"].includes(opt.risk_type)) {
          colorClass = "warn";
          msgText = "Bedingung / Check-in notiert. (Gespeichert)";
        } else {
          colorClass = "ok";
          msgText = "Interesse notiert. (Gespeichert)";
        }
        
        msg(feedback, msgText, colorClass);
        updateScenarioProgress();
      };
      
      optsDiv.appendChild(btn);
    });

    card.appendChild(header);
    if (badges.childNodes.length) card.appendChild(badges);
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

function updateScenarioProgress() {
  const total = state.scenarioActiveIds.length;
  const answered = state.scenarioActiveIds.filter(id => state.formResponses[`SCENARIO_${id}`]?.choice).length;
  const pct = total ? Math.round((answered / total) * 100) : 0;
  const textEl = document.querySelector(".scenario-progress-text");
  const fillEl = document.querySelector(".scenario-progress-fill");
  if (textEl) textEl.textContent = `${answered}/${total} beantwortet`;
  if (fillEl) fillEl.style.width = `${pct}%`;
}

// Helpers (Dependencies, Visibility)
function updateVisibility(responses = null) {
  if (!state.currentTemplate) return;
  const data = responses || collectForm();
  const host = $("formHost");
  state.currentTemplate.modules.forEach(m => m.questions.forEach(q => {
    if (q.depends_on) {
       const visible = evaluateDependency(q.depends_on, data);
       const el = host.querySelector(`.item[data-qid="${q.id}"]`);
       if (el) el.classList.toggle("hidden", !visible);
    }
  }));
  updateProgress();
}

function scheduleVisibilityUpdate() {
  if (state.visibilityTimer) clearTimeout(state.visibilityTimer);
  state.visibilityTimer = setTimeout(() => updateVisibility(), 120);
}

function scheduleValidation() {
  if (!state.validationEnabled) return;
  if (state.validationTimer) clearTimeout(state.validationTimer);
  state.validationTimer = setTimeout(() => validateAndShowHints(), 400);
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
function scheduleAutoSave() { if(state.autoSaveTimer) clearTimeout(state.autoSaveTimer); state.autoSaveTimer = setTimeout(autoSave, 1000); }
async function autoSave() {
    if(!state.currentSession || !state.currentPerson) return;
    try {
        if (!state.hasUnsavedChanges) return;
        const {password, pin} = getAuth();
        const { errors } = validateForm();
        if (errors.length) {
            state.validationEnabled = true;
            validateAndShowHints();
            setSaveStatus(`Auto-Save pausiert (${errors.length} Fehler)`, "warn");
            return;
        }
        await api(`/api/sessions/${state.currentSession.id}/responses/${state.currentPerson}/save`, {
            method: "POST", body: JSON.stringify({password, pin, responses: collectForm()})
        });
        state.hasUnsavedChanges = false;
        state.lastSaveTime = Date.now();
        msg($("saveMsg"), "Auto-gespeichert", "ok");
        setSaveStatus(`Auto-Save um ${new Date(state.lastSaveTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`, "ok");
    } catch(e) {
        setSaveStatus("Auto-Save fehlgeschlagen", "err");
    }
}
function handleBeforeUnload(e) { if (state.hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } }
function startSaveStatusUpdates() {}
function stopSaveStatusUpdates() {}
function validateForm() {
  if (!state.currentTemplate || typeof validateResponses !== "function") {
    return { errors: [], warnings: [] };
  }
  const responses = collectForm();
  document.querySelectorAll('.item.hidden[data-qid]').forEach((el) => {
    delete responses[el.dataset.qid];
  });
  return validateResponses(state.currentTemplate, responses);
}

function updateProgress() {
  const items = Array.from(document.querySelectorAll(".item[data-qid]"));
  const progressText = $("progressText");
  const progressPct = $("progressPct");
  const progressFill = $("progressFill");
  let total = 0;
  let answered = 0;
  const moduleCounts = new Map();

  items.forEach((el) => {
    const visible = !el.classList.contains("hidden");
    if (!visible) return;
    total += 1;
    if (isQuestionAnswered(el)) answered += 1;
    const moduleId = el.dataset.moduleId || "default";
    const counts = moduleCounts.get(moduleId) || { answered: 0, total: 0 };
    counts.total += 1;
    if (isQuestionAnswered(el)) counts.answered += 1;
    moduleCounts.set(moduleId, counts);
  });

  const pct = total ? Math.round((answered / total) * 100) : 0;
  const remaining = total - answered;
  
  if (progressText) progressText.textContent = `${answered}/${total} beantwortet`;
  if (progressPct) progressPct.textContent = `${pct}%`;
  if (progressFill) progressFill.style.width = `${pct}%`;
  
  // Fragen-übrig Counter
  const remainingEl = $("progressRemaining");
  if (remainingEl) {
    remainingEl.textContent = remaining > 0 ? `${remaining} Fragen übrig` : "Alle beantwortet! 🎉";
  }
  
  // Motivations-Messages (Snackbar-style)
  const motivationEl = $("progressMotivation");
  if (motivationEl && total > 0) {
    let message = "";
    if (pct === 100) {
      message = "Perfekt! Alle Fragen beantwortet! 🎉";
      motivationEl.className = "progress-motivation success";
    } else if (pct >= 75) {
      message = "Fast geschafft! Nur noch ein paar Fragen! 💪";
      motivationEl.className = "progress-motivation";
    } else if (pct >= 50) {
      message = "Hälfte geschafft! Weiter so! ✨";
      motivationEl.className = "progress-motivation";
    } else if (pct >= 25) {
      message = "Gut gemacht! Du schaffst das! 🌟";
      motivationEl.className = "progress-motivation";
    } else if (answered > 0) {
      message = "Guter Start! Jede Antwort zählt! 💫";
      motivationEl.className = "progress-motivation";
    } else {
      message = "";
      motivationEl.className = "progress-motivation hidden";
    }
    motivationEl.textContent = message;
  }

  state.navItems.forEach((link, qid) => {
    const el = document.querySelector(`.item[data-qid="${qid}"]`);
    if (!el) return;
    const visible = !el.classList.contains("hidden");
    link.classList.toggle("is-hidden", !visible);
    link.classList.toggle("answered", isQuestionAnswered(el));
  });

  moduleCounts.forEach((counts, moduleId) => {
    const navProgress = document.querySelector(`.nav-section-progress[data-module-id="${moduleId}"]`);
    if (navProgress) navProgress.textContent = `${counts.answered}/${counts.total}`;
    const headerProgress = document.querySelector(`.module-progress[data-module-id="${moduleId}"]`);
    if (headerProgress) headerProgress.textContent = `${counts.answered}/${counts.total}`;
  });
}

function validateAndShowHints({ scrollToError = false } = {}) {
  if (typeof clearValidationDisplays === "function") clearValidationDisplays();
  const { errors, warnings } = validateForm();
  if (typeof displayValidationErrors === "function") {
    displayValidationErrors(errors, warnings);
  }

  if (!errors.length && !warnings.length) {
    setValidationSummary("Keine Probleme gefunden.", "ok");
  } else if (errors.length) {
    setValidationSummary(`${errors.length} Fehler, ${warnings.length} Warnungen gefunden.`, "err");
  } else {
    setValidationSummary(`${warnings.length} Warnungen gefunden.`, "warn");
  }

  if (scrollToError && errors.length) {
    scrollToQuestion(errors[0].question_id);
  }

  return { errors, warnings };
}

function expandAllModules(expanded) {
  document.querySelectorAll(".collapsible-section").forEach((section) => {
    toggleModule(section, expanded);
  });
}

function goToNextOpenQuestion() {
  const items = Array.from(document.querySelectorAll(".item[data-qid]")).filter(
    (el) => !el.classList.contains("hidden")
  );
  const target = items.find((el) => !isQuestionAnswered(el));
  if (!target) {
    msg($("saveMsg"), "Alles beantwortet.", "ok");
    return;
  }
  scrollToQuestion(target.dataset.qid);
}

function applyCompareFilters(items) {
  const { bucket, riskOnly, flaggedOnly, query, moduleId } = state.compareFilters;
  const q = (query || "").toLowerCase();
  return items.filter((it) => {
    // Use bucket if available, fallback to pair_status for backwards compatibility
    const itemBucket = it.bucket || it.pair_status;
    if (bucket !== "ALL" && itemBucket !== bucket) return false;
    if (moduleId && it.module_id !== moduleId) return false;
    if (riskOnly && it.risk_level !== "C") return false;
    if (flaggedOnly && !(it.flags && it.flags.length)) return false;
    if (q) {
      const hay = [
        it.label,
        it.module_name,
        it.question_id,
        ...(it.tags || [])
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderCompareAnswerLines(answer = {}, schema = "") {
  if (answer === null || answer === undefined) return ["—"];
  if (typeof answer !== "object") return [String(answer)];
  const lines = [];
  if (schema === "consent_rating") {
    if (answer.dom_status || answer.sub_status) {
      const dom = `Dom: ${answer.dom_status || "—"} | I ${answer.dom_interest ?? "—"} | K ${answer.dom_comfort ?? "—"}`;
      const sub = `Sub: ${answer.sub_status || "—"} | I ${answer.sub_interest ?? "—"} | K ${answer.sub_comfort ?? "—"}`;
      lines.push(dom, sub);
    } else if (answer.active_status || answer.passive_status) {
      const act = `Aktiv: ${answer.active_status || "—"} | I ${answer.active_interest ?? "—"} | K ${answer.active_comfort ?? "—"}`;
      const pas = `Passiv: ${answer.passive_status || "—"} | I ${answer.passive_interest ?? "—"} | K ${answer.passive_comfort ?? "—"}`;
      lines.push(act, pas);
    } else {
      lines.push(`Status: ${answer.status || "—"} | Interesse ${answer.interest ?? "—"} | Komfort ${answer.comfort ?? "—"}`);
    }
    if (answer.conditions) lines.push(`Bedingungen: ${answer.conditions}`);
  } else if (schema === "scale_0_10") {
    lines.push(`Wert: ${answer.value ?? "—"}`);
  } else if (schema === "enum" || schema === "multi") {
    const value = Array.isArray(answer.value) ? answer.value.join(", ") : answer.value;
    lines.push(`Auswahl: ${value || "—"}`);
  } else if (answer.text) {
    const text = String(answer.text);
    const trimmed = text.length > 140 ? `${text.slice(0, 140)}…` : text;
    lines.push(trimmed);
  } else if (answer.value !== undefined) {
    lines.push(String(answer.value));
  } else {
    lines.push("—");
  }
  return lines;
}

function renderCompareItem(it) {
  const card = document.createElement("div");
  card.className = "compare-item-card";
  // Use bucket if available, fallback to pair_status for backwards compatibility
  const bucket = it.bucket || it.pair_status || "EXPLORE";
  const bucketClass = bucket ? `status-${bucket.toLowerCase().replace(/\s+/g, "-")}` : "";
  if (bucketClass) card.classList.add(bucketClass);

  const header = document.createElement("div");
  header.className = "compare-item-header";
  const bucketLabels = {
    "DOABLE NOW": "Jetzt möglich",
    "EXPLORE": "Erkunden",
    "TALK FIRST": "Erst reden",
    "MISMATCH": "Konflikt",
    "MATCH": "Match",
    "BOUNDARY": "Grenze"
  };
  header.innerHTML = `
    <div class="compare-item-title">${escapeHtml(it.label || it.question_id || "")}</div>
    <span class="status-badge ${bucketClass}">${escapeHtml(bucketLabels[bucket] || bucket)}</span>
  `;

  const meta = document.createElement("div");
  meta.className = "compare-item-meta";
  const riskBadge = document.createElement("span");
  riskBadge.className = `badge risk-badge-${it.risk_level || "A"}`;
  riskBadge.textContent = `Risk ${it.risk_level || "A"}`;
  meta.appendChild(riskBadge);

  const moduleBadge = document.createElement("span");
  moduleBadge.className = "badge";
  moduleBadge.textContent = it.module_name || "Modul";
  meta.appendChild(moduleBadge);

  const idBadge = document.createElement("span");
  idBadge.className = "badge";
  idBadge.textContent = it.question_id || "";
  meta.appendChild(idBadge);

  if (it.delta_interest !== undefined && it.delta_interest !== null) {
    const delta = document.createElement("span");
    delta.className = "badge";
    delta.textContent = `ΔI ${it.delta_interest}`;
    meta.appendChild(delta);
  }
  if (it.delta_comfort !== undefined && it.delta_comfort !== null) {
    const delta = document.createElement("span");
    delta.className = "badge";
    delta.textContent = `ΔK ${it.delta_comfort}`;
    meta.appendChild(delta);
  }

  (it.tags || []).forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.className = "badge tag-badge";
    tagEl.textContent = tag;
    meta.appendChild(tagEl);
  });

  if (it.flags && it.flags.length) {
    it.flags.forEach((flag) => {
      const flagEl = document.createElement("span");
      flagEl.className = "badge flag-badge";
      flagEl.textContent = flag.replace(/_/g, " ");
      meta.appendChild(flagEl);
    });
  }

  const help = document.createElement("div");
  help.className = "compare-help";
  help.textContent = it.help || "";
  if (!it.help) help.classList.add("hidden");

  const answers = document.createElement("div");
  answers.className = "compare-answers";
  const aBlock = document.createElement("div");
  aBlock.className = "compare-answer-block";
  aBlock.innerHTML = `
    <div class="compare-answer-title">A</div>
    <div class="compare-answer-body">${renderCompareAnswerLines(it.a, it.schema).map(l => `<div>${escapeHtml(l)}</div>`).join("")}</div>
  `;
  const bBlock = document.createElement("div");
  bBlock.className = "compare-answer-block";
  bBlock.innerHTML = `
    <div class="compare-answer-title">B</div>
    <div class="compare-answer-body">${renderCompareAnswerLines(it.b, it.schema).map(l => `<div>${escapeHtml(l)}</div>`).join("")}</div>
  `;
  answers.appendChild(aBlock);
  answers.appendChild(bBlock);

  // Quick-Edit Button (nur wenn Formular verfügbar ist)
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "btn compare-edit-btn";
  editButton.innerHTML = `${Icons.edit} Bearbeiten`;
  editButton.onclick = () => {
    if (state.currentSession && state.currentPerson) {
      const questionId = it.question_id;
      if (questionId) {
        // Wechsle zum Formular und scrolle zur Frage
        show($("panelForm"), true);
        show($("panelCompare"), false);
        setTimeout(() => {
          scrollToQuestion(questionId);
        }, 100);
      }
    }
  };

  // Gesprächs-Prompts (expandierbar)
  const prompts = it.conversationPrompts || [];
  let promptsSection = null;
  if (prompts && prompts.length > 0) {
    promptsSection = document.createElement("div");
    promptsSection.className = "compare-prompts";
    const promptsToggle = document.createElement("button");
    promptsToggle.type = "button";
    promptsToggle.className = "compare-prompts-toggle";
    promptsToggle.innerHTML = `<span class="compare-prompts-icon">💬</span> <span class="compare-prompts-label">Gesprächs-Ideen (${prompts.length})</span> <span class="compare-prompts-arrow">▼</span>`;
    promptsToggle.setAttribute("aria-expanded", "false");
    
    const promptsList = document.createElement("div");
    promptsList.className = "compare-prompts-list hidden";
    prompts.forEach((prompt) => {
      const promptItem = document.createElement("div");
      promptItem.className = "compare-prompt-item";
      promptItem.textContent = prompt;
      promptsList.appendChild(promptItem);
    });
    
    promptsToggle.onclick = () => {
      const isExpanded = promptsToggle.getAttribute("aria-expanded") === "true";
      promptsToggle.setAttribute("aria-expanded", !isExpanded);
      promptsList.classList.toggle("hidden", isExpanded);
      const arrow = promptsToggle.querySelector(".compare-prompts-arrow");
      if (arrow) arrow.textContent = isExpanded ? "▼" : "▲";
    };
    
    promptsSection.appendChild(promptsToggle);
    promptsSection.appendChild(promptsList);
  }

  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(help);
  card.appendChild(answers);
  if (promptsSection) card.appendChild(promptsSection);
  
  // Quick-Edit Button
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "compare-item-actions";
  actionsDiv.appendChild(editButton);
  card.appendChild(actionsDiv);
  
  return card;
}

function renderCompareItems(listHost, items) {
  listHost.innerHTML = "";
  const filtered = applyCompareFilters(items || []);
  if (!filtered.length) {
    listHost.innerHTML = `<div class="compare-empty">Keine Treffer für die aktuellen Filter.</div>`;
    return;
  }

  const grouped = new Map();
  filtered.forEach((it) => {
    const key = it.module_name || "Ohne Modul";
    const moduleId = it.module_id || "";
    if (!grouped.has(key)) grouped.set(key, { items: [], moduleId });
    grouped.get(key).items.push(it);
  });

  grouped.forEach((groupData, moduleName) => {
    const group = document.createElement("div");
    group.className = "compare-group";
    group.dataset.moduleId = groupData.moduleId || "";
    const title = document.createElement("div");
    title.className = "compare-group-title";
    title.textContent = moduleName;
    group.appendChild(title);
    groupData.items.forEach((it) => group.appendChild(renderCompareItem(it)));
    listHost.appendChild(group);
  });
}

function renderCompareView(result) {
  const host = $("compareHost");
  host.innerHTML = "";
  state.compareData = result;
  state.compareFilters = { ...state.compareFilters };

  const summary = result.summary || {};
  const counts = summary.counts || {};
  const flags = summary.flags || {};

  const summaryGrid = document.createElement("div");
  summaryGrid.className = "compare-summary";
  const summaryCards = [
    { label: "DOABLE NOW", value: counts["DOABLE NOW"] || 0, cls: "status-doable-now" },
    { label: "EXPLORE", value: counts.EXPLORE || 0, cls: "status-explore" },
    { label: "TALK FIRST", value: counts["TALK FIRST"] || 0, cls: "status-talk-first" },
    { label: "MISMATCH", value: counts.MISMATCH || 0, cls: "status-mismatch" }
  ];
  summaryCards.forEach((c) => {
    const card = document.createElement("div");
    card.className = `summary-card ${c.cls}`;
    card.innerHTML = `<div class="summary-label">${c.label}</div><div class="summary-value">${c.value}</div>`;
    summaryGrid.appendChild(card);
  });
  const flagCard = document.createElement("div");
  flagCard.className = "summary-card";
  flagCard.innerHTML = `
    <div class="summary-label">Flags</div>
    <div class="summary-value">${Object.values(flags).reduce((a, b) => a + b, 0)}</div>
    <div class="summary-sub">${Object.entries(flags).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")}</div>
  `;
  summaryGrid.appendChild(flagCard);
  host.appendChild(summaryGrid);

  // Kategorien-Zusammenfassungen (Mobile Heatmap)
  const categorySummaries = result.categorySummaries || {};
  if (Object.keys(categorySummaries).length > 0) {
    const categorySection = document.createElement("div");
    categorySection.className = "compare-categories";
    const categoryTitle = document.createElement("div");
    categoryTitle.className = "compare-categories-title";
    categoryTitle.textContent = "Kategorien-Übersicht";
    categorySection.appendChild(categoryTitle);
    
    const categoryList = document.createElement("div");
    categoryList.className = "compare-categories-list";
    
    Object.entries(categorySummaries).forEach(([moduleId, summary]) => {
      const categoryCard = document.createElement("button");
      categoryCard.type = "button";
      categoryCard.className = "compare-category-card";
      categoryCard.dataset.moduleId = moduleId;
      
      const bucketCounts = summary.counts || {};
      const total = summary.total || 0;
      
      const bucketBadges = [];
      const bucketShortLabels = {
        "DOABLE NOW": "Jetzt",
        "EXPLORE": "Erkunden",
        "TALK FIRST": "Reden",
        "MISMATCH": "Konflikt"
      };
      ["DOABLE NOW", "EXPLORE", "TALK FIRST", "MISMATCH"].forEach((bucket) => {
        const count = bucketCounts[bucket] || 0;
        if (count > 0) {
          const badge = `<span class="compare-category-badge status-${bucket.toLowerCase().replace(/\s+/g, "-")}">${bucketShortLabels[bucket] || bucket}: ${count}</span>`;
          bucketBadges.push(badge);
        }
      });
      
      categoryCard.innerHTML = `
        <div class="compare-category-name">${escapeHtml(summary.name || moduleId)}</div>
        <div class="compare-category-badges">${bucketBadges.join("")}</div>
        <div class="compare-category-total">${total} Fragen</div>
      `;
      
      categoryCard.onclick = () => {
        // Filter auf dieses Modul setzen (erweitern wir später)
        state.compareFilters.moduleId = moduleId;
        renderCompareItems($("compareList"), result.items || []);
        // Scroll zu den Items dieses Moduls
        const moduleItems = document.querySelectorAll(`[data-module-id="${moduleId}"]`);
        if (moduleItems.length > 0) {
          moduleItems[0].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      
      categoryList.appendChild(categoryCard);
    });
    
    categorySection.appendChild(categoryList);
    host.appendChild(categorySection);
  }

  if (result.action_plan && result.action_plan.length) {
    const plan = document.createElement("div");
    plan.className = "action-plan";
    plan.innerHTML = `<div class="action-plan-title">Action Plan</div>`;
    const grid = document.createElement("div");
    grid.className = "action-plan-grid";
    result.action_plan.forEach((it) => {
      const card = document.createElement("div");
      card.className = "action-plan-card";
      const tags = (it.tags || []).slice(0, 3);
      card.innerHTML = `
        <div class="action-plan-label">${escapeHtml(it.label || it.question_id || "")}</div>
        <div class="action-plan-meta">
          <span class="badge risk-badge-${it.risk_level || "A"}">Risk ${it.risk_level || "A"}</span>
          <span class="badge">${escapeHtml(it.module_name || "Modul")}</span>
        </div>
        ${tags.length ? `<div class="action-plan-tags">${tags.map(t => `<span class="badge tag-badge">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
      `;
      grid.appendChild(card);
    });
    plan.appendChild(grid);
    host.appendChild(plan);
  }

  const filters = document.createElement("div");
  filters.className = "compare-filters";
  const bucketGroup = document.createElement("div");
  bucketGroup.className = "compare-filter-group";
  const bucketLabels = {
    "ALL": "Alle",
    "DOABLE NOW": "Jetzt möglich",
    "EXPLORE": "Erkunden",
    "TALK FIRST": "Erst reden",
    "MISMATCH": "Konflikt"
  };
  ["ALL", "DOABLE NOW", "EXPLORE", "TALK FIRST", "MISMATCH"].forEach((bucket) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.bucket = bucket;
    btn.className = `btn compare-filter-btn ${state.compareFilters.bucket === bucket ? "primary" : ""}`;
    btn.textContent = bucketLabels[bucket] || bucket;
    btn.onclick = () => {
      state.compareFilters.bucket = bucket;
      filters.querySelectorAll('[data-bucket]').forEach(b => b.classList.remove("primary"));
      btn.classList.add("primary");
      renderCompareItems($("compareList"), result.items || []);
    };
    bucketGroup.appendChild(btn);
  });
  filters.appendChild(bucketGroup);

  const toggles = document.createElement("div");
  toggles.className = "compare-filter-group";
  const riskToggle = document.createElement("label");
  riskToggle.className = "compare-filter-toggle";
  const riskInput = document.createElement("input");
  riskInput.type = "checkbox";
  riskInput.checked = !!state.compareFilters.riskOnly;
  riskInput.onchange = () => {
    state.compareFilters.riskOnly = riskInput.checked;
    renderCompareItems($("compareList"), result.items || []);
  };
  riskToggle.appendChild(riskInput);
  riskToggle.appendChild(document.createTextNode("Nur Risk C"));
  const flagToggle = document.createElement("label");
  flagToggle.className = "compare-filter-toggle";
  const flagInput = document.createElement("input");
  flagInput.type = "checkbox";
  flagInput.checked = !!state.compareFilters.flaggedOnly;
  flagInput.onchange = () => {
    state.compareFilters.flaggedOnly = flagInput.checked;
    renderCompareItems($("compareList"), result.items || []);
  };
  flagToggle.appendChild(flagInput);
  flagToggle.appendChild(document.createTextNode("Nur Flags"));
  toggles.appendChild(riskToggle);
  toggles.appendChild(flagToggle);
  filters.appendChild(toggles);

  const searchWrap = document.createElement("div");
  searchWrap.className = "compare-search";
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Suchen (Label, Modul, Tag)...";
  searchInput.value = state.compareFilters.query || "";
  let searchDebounceTimer = null;
  searchInput.oninput = () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.compareFilters.query = searchInput.value.trim();
      renderCompareItems($("compareList"), result.items || []);
    }, 300); // Debounce 300ms
  };
  searchWrap.appendChild(searchInput);
  filters.appendChild(searchWrap);
  host.appendChild(filters);
  
  // Mobile Filter Button
  const mobileFilterBtn = document.createElement("button");
  mobileFilterBtn.type = "button";
  mobileFilterBtn.className = "btn compare-filter-trigger mobile-only";
  mobileFilterBtn.innerHTML = "🔍 Filter öffnen";
  mobileFilterBtn.onclick = () => showFilterBottomSheet(result);
  filters.insertBefore(mobileFilterBtn, filters.firstChild);
  
  // Store result for filter bottom sheet
  state.lastCompareResult = result;

  const listHost = document.createElement("div");
  listHost.className = "compare-list";
  listHost.id = "compareList";
  host.appendChild(listHost);
  renderCompareItems(listHost, result.items || []);
}

// Actions
async function startFill(person) {
    const {password, pin} = getAuth();
    state.currentPerson = person;
    const res = await api(`/api/sessions/${state.currentSession.id}/responses/${person}/load`, {
        method: "POST", body: JSON.stringify({password, pin})
    });
    buildForm(state.currentTemplate, res.responses||{});
    show($("panelForm"), true);
    show($("panelCompare"), false);
    msg($("saveMsg"), "");
    setSaveStatus("Bereit");
    window.addEventListener('beforeunload', handleBeforeUnload);
}
async function saveFill() {
    const {password, pin} = getAuth();
    state.validationEnabled = true;
    const { errors } = validateAndShowHints({ scrollToError: true });
    if (errors.length) {
        msg($("saveMsg"), "Bitte erst die Fehler korrigieren.", "err");
        setSaveStatus("Speichern blockiert (Fehler)", "err");
        return;
    }
    await api(`/api/sessions/${state.currentSession.id}/responses/${state.currentPerson}/save`, {
        method: "POST", body: JSON.stringify({password, pin, responses: collectForm()})
    });
    state.hasUnsavedChanges = false;
    state.lastSaveTime = Date.now();
    msg($("saveMsg"), "Gespeichert", "ok");
    setSaveStatus(`Gespeichert um ${new Date(state.lastSaveTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`, "ok");
}
// Filter Bottom Sheet (Mobile)
function showFilterBottomSheet(result = null) {
  const res = result || state.lastCompareResult;
  if (!res) return;
  
  const sheet = document.createElement("div");
  sheet.className = "filter-bottom-sheet";
  sheet.innerHTML = `
    <div class="filter-bottom-sheet-backdrop"></div>
    <div class="filter-bottom-sheet-content">
      <div class="filter-bottom-sheet-header">
        <h3>Filter</h3>
        <button class="filter-bottom-sheet-close" aria-label="Schließen">✕</button>
      </div>
      <div class="filter-bottom-sheet-body">
        <div class="filter-section">
          <label class="filter-section-title">Bucket</label>
          <div class="filter-options">
            ${["ALL", "DOABLE NOW", "EXPLORE", "TALK FIRST", "MISMATCH"].map(bucket => `
              <button type="button" class="filter-option-btn ${state.compareFilters.bucket === bucket ? 'active' : ''}" data-bucket="${bucket}">
                ${bucket === "ALL" ? "Alle" : bucket === "DOABLE NOW" ? "Jetzt möglich" : bucket === "EXPLORE" ? "Erkunden" : bucket === "TALK FIRST" ? "Erst reden" : "Konflikt"}
              </button>
            `).join("")}
          </div>
        </div>
        <div class="filter-section">
          <label class="filter-section-title">Suche</label>
          <input type="search" class="filter-search-input" placeholder="Suchen..." value="${state.compareFilters.query || ""}">
        </div>
        <div class="filter-section">
          <label class="filter-section-title">Modul</label>
          <select class="filter-module-select">
            <option value="">Alle Module</option>
            ${Object.keys(res.categorySummaries || {}).map(moduleId => `
              <option value="${moduleId}" ${state.compareFilters.moduleId === moduleId ? "selected" : ""}>
                ${res.categorySummaries[moduleId].name || moduleId}
              </option>
            `).join("")}
          </select>
        </div>
        <div class="filter-section">
          <label class="checkbox-label-large">
            <input type="checkbox" class="filter-risk-only" ${state.compareFilters.riskOnly ? "checked" : ""}>
            <span>Nur Risk C</span>
          </label>
          <label class="checkbox-label-large">
            <input type="checkbox" class="filter-flagged-only" ${state.compareFilters.flaggedOnly ? "checked" : ""}>
            <span>Nur Flagged</span>
          </label>
        </div>
      </div>
      <div class="filter-bottom-sheet-footer">
        <button type="button" class="btn filter-reset-btn">Zurücksetzen</button>
        <button type="button" class="btn primary filter-apply-btn">Anwenden</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(sheet);
  setTimeout(() => sheet.classList.add("open"), 10);
  
  // Event handlers
  const backdrop = sheet.querySelector(".filter-bottom-sheet-backdrop");
  const closeBtn = sheet.querySelector(".filter-bottom-sheet-close");
  const applyBtn = sheet.querySelector(".filter-apply-btn");
  const resetBtn = sheet.querySelector(".filter-reset-btn");
  
  const close = () => {
    sheet.classList.remove("open");
    setTimeout(() => sheet.remove(), 300);
  };
  
  backdrop.onclick = close;
  closeBtn.onclick = close;
  
  sheet.querySelectorAll(".filter-option-btn").forEach(btn => {
    btn.onclick = () => {
      sheet.querySelectorAll(".filter-option-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });
  
  applyBtn.onclick = () => {
    const activeBucket = sheet.querySelector(".filter-option-btn.active")?.dataset.bucket || "ALL";
    const query = sheet.querySelector(".filter-search-input").value.trim();
    const moduleId = sheet.querySelector(".filter-module-select").value || null;
    const riskOnly = sheet.querySelector(".filter-risk-only").checked;
    const flaggedOnly = sheet.querySelector(".filter-flagged-only").checked;
    
    state.compareFilters = { bucket: activeBucket, query, moduleId, riskOnly, flaggedOnly };
    renderCompareItems($("compareList"), res.items || []);
    close();
  };
  
  resetBtn.onclick = () => {
    state.compareFilters = { bucket: "ALL", query: "", moduleId: null, riskOnly: false, flaggedOnly: false };
    renderCompareItems($("compareList"), res.items || []);
    close();
  };
}

async function doCompare() {
    msg($("sessionMsg"), "");
    const {password} = getAuth();
    const res = await api(`/api/sessions/${state.currentSession.id}/compare`, {
        method: "POST", body: JSON.stringify({password})
    });
    state.compareFilters = { bucket: "ALL", riskOnly: false, flaggedOnly: false, query: "", moduleId: null };
    renderCompareView(res);
    show($("panelCompare"), true);
    show($("panelForm"), false);
}

async function exportSession(format) {
    if (!state.currentSession) throw new Error("Keine Session aktiv");
    if (window.LocalApi && window.LocalApi.enabled) {
        throw new Error("Export ist im Offline-Modus derzeit nicht verfügbar");
    }
    const { password } = getAuth();
    const kind = format === "markdown" ? "markdown" : "json";
    const blob = await api(`/api/sessions/${state.currentSession.id}/export/${kind}`, {
        method: "POST",
        body: JSON.stringify({ password })
    });
    const ext = kind === "markdown" ? "md" : "json";
    downloadBlob(blob, `intimacy_export_${state.currentSession.id}.${ext}`);
    msg($("sessionMsg"), "Export erstellt.", "ok");
}

async function runAIAnalysis() {
    if (!state.currentSession) throw new Error("Keine Session aktiv");
    if (window.LocalApi && window.LocalApi.enabled) {
        throw new Error("KI-Analyse nur im Server-Modus verfügbar");
    }
    const { password } = getAuth();
    const apiKey = $("aiKey").value.trim();
    const model = $("aiModel").value.trim();
    const redact = $("aiRedact").value === "true";
    const maxTokens = Number($("aiMaxTokens").value) || 800;
    if (!apiKey || !model) throw new Error("API Key und Model sind erforderlich");
    const payload = {
        password,
        provider: "openrouter",
        api_key: apiKey,
        model,
        base_url: "https://openrouter.ai/api/v1",
        redact_free_text: redact,
        max_tokens: maxTokens
    };
    const report = await api(`/api/sessions/${state.currentSession.id}/ai/analyze`, {
        method: "POST",
        body: JSON.stringify(payload)
    });
    $("aiOut").textContent = report?.text || JSON.stringify(report, null, 2);
    msg($("sessionMsg"), "KI-Analyse abgeschlossen.", "ok");
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
        msg($("createMsg"), "Session erstellt.", "ok");
    } catch(e) { showError($("createMsg"), e, "Session konnte nicht erstellt werden"); }
};
$("btnBack").onclick = backHome;
$("btnFillA").onclick = () => startFill("A").catch((e) => showError($("sessionMsg"), e));
$("btnFillB").onclick = () => startFill("B").catch((e) => showError($("sessionMsg"), e));
$("btnSaveForm").onclick = () => saveFill().catch((e) => showError($("saveMsg"), e, "Speichern fehlgeschlagen"));
$("btnCloseForm").onclick = () => {
    show($("panelForm"), false);
    setNavOpen(false);
};
$("btnCompare").onclick = () => doCompare().catch((e) => showError($("sessionMsg"), e, "Vergleich fehlgeschlagen"));
$("btnCloseCompare").onclick = () => show($("panelCompare"), false);
$("btnScenarios").onclick = () => loadScenarios();
$("btnScenarios").innerHTML = `${Icons.cards} Szenarien-Modus`;
$("btnCloseScenarios").onclick = backHome;
$("btnValidate").onclick = () => {
    state.validationEnabled = true;
    validateAndShowHints({ scrollToError: true });
};
$("btnExpandAll").onclick = () => expandAllModules(true);
$("btnCollapseAll").onclick = () => expandAllModules(false);
$("btnNextOpen").onclick = () => goToNextOpenQuestion();
$("btnToggleNav").onclick = () => setNavOpen(!state.navOpen);
$("navBackdrop").onclick = () => setNavOpen(false);
$("btnExportJson").onclick = () => exportSession("json").catch((e) => showError($("sessionMsg"), e, "Export fehlgeschlagen"));
$("btnExportMd").onclick = () => exportSession("markdown").catch((e) => showError($("sessionMsg"), e, "Export fehlgeschlagen"));
$("btnRunAI").onclick = () => runAIAnalysis().catch((e) => showError($("sessionMsg"), e, "KI-Analyse fehlgeschlagen"));
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.navOpen) setNavOpen(false);
});

// Mobile Navigation
function initMobileNavigation() {
  const bottomNav = document.getElementById("mobileBottomNav");
  const fab = document.getElementById("fab");
  const navItems = bottomNav?.querySelectorAll(".mobile-nav-item");
  const mobileNavCompare = document.getElementById("mobileNavCompare");
  
  // Bottom Nav Items
  navItems?.forEach(item => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      if (!view) return;
      
      // Update active state
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      // Handle navigation
      if (view === "home") {
        backHome();
      } else if (view === "sessions") {
        // Show sessions list (already visible on home)
        backHome();
      } else if (view === "scenarios") {
        if ($("scenarioView")) {
          show($("scenarioView"), true);
          show($("home"), false);
          show($("sessionView"), false);
          loadScenarios();
        }
      }
    });
  });
  
  // FAB - Quick Actions
  fab?.addEventListener("click", () => {
    if (state.currentSession) {
      // If in session, show compare or form actions
      if ($("panelCompare") && !$("panelCompare").classList.contains("hidden")) {
        // Show compare actions menu
        showFABMenu();
      } else if ($("panelForm") && !$("panelForm").classList.contains("hidden")) {
        // Show form actions
        showFABMenu(["save", "compare", "scenarios"]);
      } else {
        // Show session actions
        showFABMenu(["compare", "export", "scenarios"]);
      }
    } else {
      // Show create session
      document.getElementById("create")?.scrollIntoView({ behavior: "smooth" });
    }
  });
  
  // Compare button in nav
  mobileNavCompare?.addEventListener("click", () => {
    if (state.currentSession) {
      doCompare().catch((e) => showError($("sessionMsg"), e, "Vergleich fehlgeschlagen"));
    }
  });
  
  // Update nav visibility based on context
  updateMobileNavVisibility();
}

function updateMobileNavVisibility() {
  const bottomNav = document.getElementById("mobileBottomNav");
  const fab = document.getElementById("fab");
  const mobileNavCompare = document.getElementById("mobileNavCompare");
  
  // Show/hide based on current view
  if (state.currentSession) {
    bottomNav?.classList.add("in-session");
    fab?.style.setProperty("display", "flex");
    mobileNavCompare?.style.setProperty("display", "flex");
  } else {
    bottomNav?.classList.remove("in-session");
    fab?.style.setProperty("display", window.innerWidth <= 768 ? "flex" : "none");
    mobileNavCompare?.style.setProperty("display", "none");
  }
}

function showFABMenu(actions = []) {
  // Simple implementation - could be expanded to a proper menu
  console.log("FAB Menu:", actions);
  // For now, just show a simple action
}

// Native Android Features (Capacitor)
function initNativeFeatures() {
  // Back Button Handling (Android)
  if (window.Capacitor && window.Capacitor.Plugins) {
    const { App } = window.Capacitor.Plugins;
    if (App && App.addListener) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack || state.navOpen) {
          setNavOpen(false);
          if (state.currentSession && !state.navOpen) {
            backHome();
          }
        } else {
          window.history.back();
        }
      });
    }
    
    // StatusBar styling
    const { StatusBar } = window.Capacitor.Plugins;
    if (StatusBar) {
      StatusBar.setStyle({ style: 'DARK' });
      StatusBar.setBackgroundColor({ color: '#1a0a1a' });
    }
    
    // Haptic Feedback (optional, via Capacitor)
    if (window.Capacitor.Plugins.Haptics) {
      window.hapticFeedback = {
        light: () => window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }),
        medium: () => window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' }),
        heavy: () => window.Capacitor.Plugins.Haptics.impact({ style: 'HEAVY' })
      };
      
      // Add haptic feedback to important actions
      document.addEventListener('click', (e) => {
        if (e.target.matches('.btn.primary, .fab, .mobile-nav-item')) {
          window.hapticFeedback?.light();
        }
      });
    }
  }
}

// Boot
(async () => {
    await loadTemplates();
    await loadSessions();
    initMobileNavigation();
    initNativeFeatures();
    updateOfflineIndicator();
    
    // Update nav on view changes
    const originalBackHome = backHome;
    backHome = function() {
      originalBackHome();
      updateMobileNavVisibility();
    };
    
    const originalOpenSession = openSession;
    openSession = async function(sessionId) {
      await originalOpenSession(sessionId);
      updateMobileNavVisibility();
    };
})();
