const $ = (id) => document.getElementById(id);

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
};

async function api(path, opts = {}) {
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
  if (yes) el.classList.remove("hidden");
  else el.classList.add("hidden");
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
  for (const s of state.sessions) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="title">${escapeHtml(s.name)}
        <span class="badge">A: ${s.has_a ? "✓" : "—"}</span>
        <span class="badge">B: ${s.has_b ? "✓" : "—"}</span>
      </div>
      <div class="hint">Session: ${escapeHtml(s.id)} | Template: ${escapeHtml(s.template_id)} | ${escapeHtml(s.created_at)}</div>
      <div class="row" style="margin-top:10px">
        <button class="btn" data-open="${escapeHtml(s.id)}">Öffnen</button>
      </div>
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
  show($("sessionView"), true);

  $("sessTitle").textContent = `Session: ${info.name}`;
  $("sessMeta").textContent = `A: ${info.has_a ? "gefüllt" : "offen"} | B: ${info.has_b ? "gefüllt" : "offen"} | Template: ${info.template.name} v${info.template.version}`;

  show($("panelForm"), false);
  show($("panelCompare"), false);
  show($("panelAI"), false);
  msg($("sessionMsg"), "");
}

function backHome() {
  // Remove beforeunload listener
  window.removeEventListener('beforeunload', handleBeforeUnload);
  
  // Stop save status updates
  stopSaveStatusUpdates();
  
  state.currentSession = null;
  state.currentTemplate = null;
  state.hasUnsavedChanges = false;
  state.lastSaveTime = null;
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
  show($("sessionView"), false);
  show($("home"), true);
  show($("create"), true);
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function getAuth() {
  const password = $("authPassword").value.trim();
  const pin = $("authPin").value.trim();
  if (!password || password.length < 6) throw new Error("Passwort fehlt/zu kurz.");
  return { password, pin: pin || null };
}

function renderConsentRating(q, existing = {}) {
  const wrap = document.createElement("div");
  wrap.className = "item";

  const status = existing.status || "MAYBE";
  const interest = (existing.interest ?? 2);
  const comfort = (existing.comfort ?? 2);
  const conditions = existing.conditions || "";
  const notes = existing.notes || "";

  const riskClass = `risk-badge-${q.risk_level || "A"}`;
  const tagsHtml = (q.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join("");

  wrap.innerHTML = `
    <div class="title">
      ${escapeHtml(q.id)} 
      <span class="badge ${riskClass}">Risk ${escapeHtml(q.risk_level || "A")}</span>
      ${tagsHtml}
    </div>
    <div style="margin-top:6px"><strong>${escapeHtml(q.label)}</strong></div>
    ${q.help ? `<div class="hint">${escapeHtml(q.help)}</div>` : ""}
    <div class="row" style="margin-top:10px">
      <label style="min-width:160px">Status
        <select data-k="status" aria-label="Status für ${escapeHtml(q.id)}">
          <option value="YES">JA</option>
          <option value="MAYBE">VIELLEICHT</option>
          <option value="NO">NEIN</option>
        </select>
      </label>
      <label style="min-width:160px">Interesse (0–4)
        <input data-k="interest" type="number" min="0" max="4" step="1" aria-label="Interesse für ${escapeHtml(q.id)}" />
      </label>
      <label style="min-width:160px">Komfort (0–4)
        <input data-k="comfort" type="number" min="0" max="4" step="1" aria-label="Komfort für ${escapeHtml(q.id)}" />
      </label>
    </div>
    <div class="grid2" style="margin-top:10px">
      <label>Bedingungen
        <textarea data-k="conditions" placeholder="Nur wenn..., nicht wenn..., Tempo..., Stop..." aria-label="Bedingungen für ${escapeHtml(q.id)}"></textarea>
      </label>
      <label>Notizen (optional)
        <textarea data-k="notes" placeholder="kurz & ehrlich" aria-label="Notizen für ${escapeHtml(q.id)}"></textarea>
      </label>
    </div>
  `;

  const sel = wrap.querySelector('select[data-k="status"]');
  sel.value = status;
  wrap.querySelector('input[data-k="interest"]').value = interest;
  wrap.querySelector('input[data-k="comfort"]').value = comfort;
  wrap.querySelector('textarea[data-k="conditions"]').value = conditions;
  wrap.querySelector('textarea[data-k="notes"]').value = notes;

  // Add change listeners for validation
  const inputs = wrap.querySelectorAll('select[data-k="status"], input[data-k="interest"], input[data-k="comfort"], textarea[data-k="conditions"]');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      state.hasUnsavedChanges = true;
      state.formResponses = collectForm();
      validateAndShowHints();
      updateProgress();
      scheduleAutoSave();
    });
    input.addEventListener('input', () => {
      state.hasUnsavedChanges = true;
      state.formResponses = collectForm();
      updateProgress();
      scheduleAutoSave();
    });
  });

  return wrap;
}

function renderScale(q, existing = {}) {
  const wrap = document.createElement("div");
  wrap.className = "item";
  const value = existing.value ?? 5;

  const riskClass = `risk-badge-${q.risk_level || "A"}`;
  const tagsHtml = (q.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join("");

  wrap.innerHTML = `
    <div class="title">
      ${escapeHtml(q.id)} 
      <span class="badge ${riskClass}">Risk ${escapeHtml(q.risk_level || "A")}</span>
      ${tagsHtml}
    </div>
    <div style="margin-top:6px"><strong>${escapeHtml(q.label)}</strong></div>
    ${q.help ? `<div class="hint">${escapeHtml(q.help)}</div>` : ""}
    <label style="margin-top:10px">Wert (0–10)
      <input data-k="value" type="number" min="0" max="10" step="1" aria-label="Wert für ${escapeHtml(q.id)}" />
    </label>
  `;
  const input = wrap.querySelector('input[data-k="value"]');
  input.value = value;
  input.addEventListener('change', () => {
    state.hasUnsavedChanges = true;
    state.formResponses = collectForm();
    validateAndShowHints();
    updateProgress();
    scheduleAutoSave();
  });
  input.addEventListener('input', () => {
    state.hasUnsavedChanges = true;
    state.formResponses = collectForm();
    updateProgress();
    scheduleAutoSave();
  });
  return wrap;
}

function renderEnum(q, existing = {}) {
  const wrap = document.createElement("div");
  wrap.className = "item";
  const value = existing.value ?? (q.options?.[0] ?? "");

  const riskClass = `risk-badge-${q.risk_level || "A"}`;
  const tagsHtml = (q.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join("");
  const opts = (q.options || []).map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
  wrap.innerHTML = `
    <div class="title">
      ${escapeHtml(q.id)} 
      <span class="badge ${riskClass}">Risk ${escapeHtml(q.risk_level || "A")}</span>
      ${tagsHtml}
    </div>
    <div style="margin-top:6px"><strong>${escapeHtml(q.label)}</strong></div>
    ${q.help ? `<div class="hint">${escapeHtml(q.help)}</div>` : ""}
    <label style="margin-top:10px">Auswahl
      <select data-k="value" aria-label="Auswahl für ${escapeHtml(q.id)}">${opts}</select>
    </label>
  `;
  const sel = wrap.querySelector('select[data-k="value"]');
  sel.value = value;
  sel.addEventListener('change', () => {
    state.hasUnsavedChanges = true;
    state.formResponses = collectForm();
    updateProgress();
    scheduleAutoSave();
  });
  return wrap;
}

function renderMulti(q, existing = {}) {
  const wrap = document.createElement("div");
  wrap.className = "item";
  const values = new Set(existing.values || []);

  const riskClass = `risk-badge-${q.risk_level || "A"}`;
  const tagsHtml = (q.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join("");
  const boxes = (q.options || []).map(o => {
    const checked = values.has(o) ? "checked" : "";
    return `<label style="display:flex;gap:10px;align-items:center;margin-top:8px;color:var(--text)">
      <input type="checkbox" data-v="${escapeHtml(o)}" ${checked} aria-label="${escapeHtml(o)}" />
      <span>${escapeHtml(o)}</span>
    </label>`;
  }).join("");

  wrap.innerHTML = `
    <div class="title">
      ${escapeHtml(q.id)} 
      <span class="badge ${riskClass}">Risk ${escapeHtml(q.risk_level || "A")}</span>
      ${tagsHtml}
    </div>
    <div style="margin-top:6px"><strong>${escapeHtml(q.label)}</strong></div>
    ${q.help ? `<div class="hint">${escapeHtml(q.help)}</div>` : ""}
    <div style="margin-top:10px">${boxes}</div>
  `;
  wrap.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.hasUnsavedChanges = true;
      state.formResponses = collectForm();
      updateProgress();
      scheduleAutoSave();
    });
  });
  return wrap;
}

function renderText(q, existing = {}) {
  const wrap = document.createElement("div");
  wrap.className = "item";
  const text = existing.text || "";

  const riskClass = `risk-badge-${q.risk_level || "A"}`;
  const tagsHtml = (q.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join("");
  wrap.innerHTML = `
    <div class="title">
      ${escapeHtml(q.id)} 
      <span class="badge ${riskClass}">Risk ${escapeHtml(q.risk_level || "A")}</span>
      ${tagsHtml}
    </div>
    <div style="margin-top:6px"><strong>${escapeHtml(q.label)}</strong></div>
    ${q.help ? `<div class="hint">${escapeHtml(q.help)}</div>` : ""}
    <label style="margin-top:10px">Text
      <textarea data-k="text" placeholder="kurz & ehrlich" aria-label="Text für ${escapeHtml(q.id)}">${escapeHtml(text)}</textarea>
    </label>
  `;
  const textarea = wrap.querySelector('textarea[data-k="text"]');
  textarea.addEventListener('input', () => {
    state.hasUnsavedChanges = true;
    state.formResponses = collectForm();
    updateProgress();
    scheduleAutoSave();
  });
  return wrap;
}

function buildForm(template, responses) {
  const host = $("formHost");
  host.innerHTML = "";

  state.formResponses = responses;
  updateProgress();

  for (const mod of template.modules || []) {
    const section = document.createElement("div");
    section.className = "panel collapsible-section";
    section.dataset.moduleId = mod.id;
    
    const header = document.createElement("div");
    header.className = "collapsible-header";
    header.innerHTML = `
      <h4>${escapeHtml(mod.name)}</h4>
      <button class="collapse-btn" aria-label="Abschnitt ein-/ausklappen">▼</button>
    `;
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      const btn = header.querySelector('.collapse-btn');
      btn.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
    });

    const content = document.createElement("div");
    content.className = "collapsible-content";
    content.innerHTML = `
      ${mod.description ? `<div class="hint">${escapeHtml(mod.description)}</div>` : ""}
      <div class="divider"></div>
    `;

    for (const q of mod.questions || []) {
      const existing = responses[q.id] || {};
      let el;
      if (q.schema === "consent_rating") el = renderConsentRating(q, existing);
      else if (q.schema === "scale_0_10") el = renderScale(q, existing);
      else if (q.schema === "enum") el = renderEnum(q, existing);
      else if (q.schema === "multi") el = renderMulti(q, existing);
      else if (q.schema === "text") el = renderText(q, existing);
      else el = renderText({ ...q, schema: "text" }, existing);

      el.dataset.qid = q.id;
      el.dataset.schema = q.schema;
      content.appendChild(el);
    }

    section.appendChild(header);
    section.appendChild(content);
    host.appendChild(section);
  }

  validateAndShowHints();
}

function collectForm() {
  const host = $("formHost");
  const blocks = host.querySelectorAll(".item[data-qid]");
  const out = {};
  blocks.forEach((b) => {
    const qid = b.dataset.qid;
    const schema = b.dataset.schema;

    if (schema === "consent_rating") {
      out[qid] = {
        status: b.querySelector('select[data-k="status"]').value,
        interest: Number(b.querySelector('input[data-k="interest"]').value),
        comfort: Number(b.querySelector('input[data-k="comfort"]').value),
        conditions: b.querySelector('textarea[data-k="conditions"]').value.trim(),
        notes: b.querySelector('textarea[data-k="notes"]').value.trim(),
      };
    } else if (schema === "scale_0_10") {
      out[qid] = { value: Number(b.querySelector('input[data-k="value"]').value) };
    } else if (schema === "enum") {
      out[qid] = { value: b.querySelector('select[data-k="value"]').value };
    } else if (schema === "multi") {
      const vals = [];
      b.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        if (cb.checked) vals.push(cb.dataset.v);
      });
      out[qid] = { values: vals };
    } else if (schema === "text") {
      out[qid] = { text: b.querySelector('textarea[data-k="text"]').value.trim() };
    } else {
      out[qid] = {};
    }
  });
  return out;
}

function validateConsentRating(qid, data, question) {
  const errors = [];
  const warnings = [];

  // MAYBE requires conditions
  if (data.status === "MAYBE" && !data.conditions.trim()) {
    errors.push(`Bei Status "VIELLEICHT" müssen Bedingungen angegeben werden.`);
  }

  // Validate interest/comfort ranges
  if (data.interest < 0 || data.interest > 4) {
    errors.push(`Interesse muss zwischen 0 und 4 liegen.`);
  }
  if (data.comfort < 0 || data.comfort > 4) {
    errors.push(`Komfort muss zwischen 0 und 4 liegen.`);
  }

  // Low comfort high interest warning
  if (data.interest >= 3 && data.comfort <= 2) {
    warnings.push(`Achtung: Hohes Interesse (${data.interest}) aber niedriger Komfort (${data.comfort}). Bitte besonders vorsichtig sein.`);
  }

  // High-risk questions need conditions if YES
  if (question.risk_level === "C" && data.status === "YES" && !data.conditions.trim()) {
    warnings.push(`High-Risk Frage: Bitte Bedingungen für Sicherheit notieren.`);
  }

  // NO status reminder
  if (data.status === "NO") {
    warnings.push(`Erinnerung: "NEIN" ist final und sollte nicht diskutiert werden.`);
  }

  return { errors, warnings };
}

function validateForm() {
  const host = $("formHost");
  const blocks = host.querySelectorAll(".item[data-qid]");
  const allErrors = [];
  const allWarnings = [];
  const questionMap = {};

  // Build question map
  if (state.currentTemplate) {
    for (const mod of state.currentTemplate.modules || []) {
      for (const q of mod.questions || []) {
        questionMap[q.id] = q;
      }
    }
  }

  blocks.forEach((b) => {
    const qid = b.dataset.qid;
    const schema = b.dataset.schema;
    const question = questionMap[qid];
    if (!question) return;

    const data = collectForm()[qid];
    if (!data) return;

    if (schema === "consent_rating") {
      const result = validateConsentRating(qid, data, question);
      allErrors.push(...result.errors.map(e => ({ qid, message: e })));
      allWarnings.push(...result.warnings.map(w => ({ qid, message: w })));
    } else if (schema === "scale_0_10") {
      const value = data.value;
      if (value < 0 || value > 10) {
        allErrors.push({ qid, message: `Wert muss zwischen 0 und 10 liegen.` });
      }
    }
  });

  return { errors: allErrors, warnings: allWarnings };
}

function showValidationErrors(errors, warnings) {
  const host = $("formHost");
  
  // Remove existing validation messages
  host.querySelectorAll(".validation-error, .validation-warning").forEach(el => el.remove());

  // Show errors
  errors.forEach(({ qid, message }) => {
    const block = host.querySelector(`.item[data-qid="${qid}"]`);
    if (block) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "validation-error";
      errorDiv.textContent = message;
      block.appendChild(errorDiv);
    }
  });

  // Show warnings
  warnings.forEach(({ qid, message }) => {
    const block = host.querySelector(`.item[data-qid="${qid}"]`);
    if (block) {
      const warningDiv = document.createElement("div");
      warningDiv.className = "validation-warning";
      warningDiv.textContent = message;
      block.appendChild(warningDiv);
    }
  });
}

function calculateProgress(responses, template) {
  if (!template || !template.modules) return { answered: 0, total: 0, percentage: 0 };
  
  let total = 0;
  let answered = 0;

  for (const mod of template.modules) {
    for (const q of mod.questions || []) {
      total++;
      const resp = responses[q.id];
      if (resp) {
        // Check if question has meaningful answer
        if (q.schema === "consent_rating") {
          if (resp.status) answered++;
        } else if (q.schema === "scale_0_10") {
          if (resp.value !== undefined && resp.value !== null) answered++;
        } else if (q.schema === "enum") {
          if (resp.value) answered++;
        } else if (q.schema === "multi") {
          if (resp.values && resp.values.length > 0) answered++;
        } else if (q.schema === "text") {
          if (resp.text && resp.text.trim()) answered++;
        }
      }
    }
  }

  return {
    answered,
    total,
    percentage: total > 0 ? Math.round((answered / total) * 100) : 0
  };
}

function renderProgressBar(progress) {
  const existing = $("progressBar");
  if (existing) existing.remove();

  const container = $("formHost");
  if (!container) return;

  const progressDiv = document.createElement("div");
  progressDiv.id = "progressBar";
  progressDiv.className = "progress-bar";
  progressDiv.innerHTML = `
    <div class="progress-info">
      <span>Fortschritt: ${progress.answered} / ${progress.total} Fragen beantwortet (${progress.percentage}%)</span>
    </div>
    <div class="progress-fill" style="width: ${progress.percentage}%"></div>
  `;
  container.insertBefore(progressDiv, container.firstChild);
}

function updateProgress() {
  if (!state.currentTemplate || !state.formResponses) return;
  const progress = calculateProgress(state.formResponses, state.currentTemplate);
  renderProgressBar(progress);
  renderQuestionNavigation();
}

function renderQuestionNavigation() {
  if (!state.currentTemplate) return;
  
  let existingNav = $("questionNav");
  if (existingNav) existingNav.remove();

  const navContainer = document.createElement("div");
  navContainer.id = "questionNav";
  navContainer.className = "question-nav";
  
  const navTitle = document.createElement("div");
  navTitle.className = "nav-title";
  navTitle.textContent = "Navigation";
  navContainer.appendChild(navTitle);

  for (const mod of state.currentTemplate.modules || []) {
    const modDiv = document.createElement("div");
    modDiv.className = "nav-module";
    
    const modHeader = document.createElement("div");
    modHeader.className = "nav-module-header";
    modHeader.textContent = mod.name;
    modDiv.appendChild(modHeader);

    const modProgress = calculateModuleProgress(mod, state.formResponses);
    const modProgressBar = document.createElement("div");
    modProgressBar.className = "nav-module-progress";
    modProgressBar.innerHTML = `<div class="nav-progress-fill" style="width: ${modProgress.percentage}%"></div>`;
    modDiv.appendChild(modProgressBar);

    const questionsList = document.createElement("div");
    questionsList.className = "nav-questions";

    for (const q of mod.questions || []) {
      const qLink = document.createElement("a");
      qLink.href = "#";
      qLink.className = "nav-question-link";
      qLink.textContent = `${q.id}: ${q.label.substring(0, 40)}${q.label.length > 40 ? '...' : ''}`;
      qLink.dataset.qid = q.id;
      
      // Check if answered
      const resp = state.formResponses[q.id];
      if (resp && isQuestionAnswered(q, resp)) {
        qLink.classList.add('answered');
      }
      
      qLink.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToQuestion(q.id);
      });
      
      questionsList.appendChild(qLink);
    }

    modDiv.appendChild(questionsList);
    navContainer.appendChild(modDiv);
  }

  const formHost = $("formHost");
  if (formHost && formHost.parentElement) {
    formHost.parentElement.insertBefore(navContainer, formHost);
  }
}

function calculateModuleProgress(module, responses) {
  let total = 0;
  let answered = 0;

  for (const q of module.questions || []) {
    total++;
    const resp = responses[q.id];
    if (resp && isQuestionAnswered(q, resp)) {
      answered++;
    }
  }

  return {
    answered,
    total,
    percentage: total > 0 ? Math.round((answered / total) * 100) : 0
  };
}

function isQuestionAnswered(question, response) {
  if (question.schema === "consent_rating") {
    return !!response.status;
  } else if (question.schema === "scale_0_10") {
    return response.value !== undefined && response.value !== null;
  } else if (question.schema === "enum") {
    return !!response.value;
  } else if (question.schema === "multi") {
    return response.values && response.values.length > 0;
  } else if (question.schema === "text") {
    return response.text && response.text.trim();
  }
  return false;
}

function scrollToQuestion(qid) {
  const block = document.querySelector(`.item[data-qid="${qid}"]`);
  if (block) {
    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
    block.style.animation = 'highlight 1s';
    setTimeout(() => {
      block.style.animation = '';
    }, 1000);
  }
}

function validateAndShowHints() {
  const validation = validateForm();
  showValidationErrors(validation.errors, validation.warnings);
  showContextualHints();
}

function showContextualHints() {
  const host = $("formHost");
  if (!host || !state.currentTemplate) return;
  
  // Remove existing contextual hints
  host.querySelectorAll(".contextual-hint").forEach(el => el.remove());
  
  const blocks = host.querySelectorAll(".item[data-qid]");
  const questionMap = {};
  
  // Build question map
  for (const mod of state.currentTemplate.modules || []) {
    for (const q of mod.questions || []) {
      questionMap[q.id] = q;
    }
  }
  
  blocks.forEach((block) => {
    const qid = block.dataset.qid;
    const schema = block.dataset.schema;
    const question = questionMap[qid];
    if (!question) return;
    
    const data = collectForm()[qid];
    if (!data) return;
    
    const hints = [];
    
    if (schema === "consent_rating") {
      const status = data.status;
      const riskLevel = question.risk_level || "A";
      
      // NO status reminder
      if (status === "NO") {
        hints.push({
          type: "info",
          message: "Erinnerung: 'NEIN' ist final und sollte nicht diskutiert werden."
        });
      }
      
      // MAYBE requires conditions
      if (status === "MAYBE") {
        if (!data.conditions || !data.conditions.trim()) {
          hints.push({
            type: "warning",
            message: "Bei 'VIELLEICHT' müssen Bedingungen angegeben werden."
          });
        } else {
          hints.push({
            type: "info",
            message: "Gut: Bedingungen sind angegeben. 'VIELLEICHT' gilt nur unter diesen Bedingungen."
          });
        }
      }
      
      // High-risk warning
      if (riskLevel === "C" && status === "YES") {
        if (!data.conditions || !data.conditions.trim()) {
          hints.push({
            type: "warning",
            message: "High-Risk Frage: Bitte Bedingungen für Sicherheit notieren."
          });
        }
      }
      
      // Low comfort high interest
      if (data.interest >= 3 && data.comfort <= 2) {
        hints.push({
          type: "warning",
          message: "Achtung: Hohes Interesse aber niedriger Komfort. Bitte besonders vorsichtig sein und Bedingungen klar definieren."
        });
      }
    }
    
    // Show hints
    hints.forEach(hint => {
      const hintDiv = document.createElement("div");
      hintDiv.className = `contextual-hint contextual-hint-${hint.type}`;
      hintDiv.textContent = hint.message;
      block.appendChild(hintDiv);
    });
  });
}

let autoSaveTimeout = null;
function scheduleAutoSave() {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    if (state.hasUnsavedChanges && state.currentPerson && state.currentSession) {
      autoSave();
    }
  }, 500);
}

async function autoSave() {
  if (!state.currentPerson || !state.currentSession) return;
  
  try {
    const { password, pin } = getAuth();
    const responses = collectForm();
    
    // Skip validation errors for auto-save, just save what we have
    await api(`/api/sessions/${state.currentSession.id}/responses/${state.currentPerson}/save`, {
      method: "POST",
      body: JSON.stringify({ password, pin, responses }),
    }).catch(e => {
      // If save fails due to validation, don't update state
      // User will see error when manually saving
      throw e;
    });

    state.hasUnsavedChanges = false;
    state.lastSaveTime = new Date();
    updateSaveStatus();
    
    // Update progress
    state.formResponses = responses;
    updateProgress();
    
    // Update navigation
    renderQuestionNavigation();
  } catch (e) {
    console.error("Auto-save failed:", e);
    // Don't show error to user for auto-save failures
  }
}

let saveStatusInterval = null;

function updateSaveStatus() {
  const saveMsg = $("saveMsg");
  if (!saveMsg) return;
  
  if (state.lastSaveTime) {
    const secondsAgo = Math.floor((new Date() - state.lastSaveTime) / 1000);
    if (secondsAgo < 60) {
      msg(saveMsg, `Auto-gespeichert vor ${secondsAgo} Sekunden`, "ok");
    } else {
      const minutesAgo = Math.floor(secondsAgo / 60);
      msg(saveMsg, `Auto-gespeichert vor ${minutesAgo} Minute${minutesAgo > 1 ? 'n' : ''}`, "ok");
    }
  } else if (state.hasUnsavedChanges) {
    msg(saveMsg, "Ungespeicherte Änderungen", "");
  } else {
    msg(saveMsg, "", "");
  }
}

function startSaveStatusUpdates() {
  if (saveStatusInterval) clearInterval(saveStatusInterval);
  saveStatusInterval = setInterval(() => {
    updateSaveStatus();
  }, 1000);
}

function stopSaveStatusUpdates() {
  if (saveStatusInterval) {
    clearInterval(saveStatusInterval);
    saveStatusInterval = null;
  }
}

async function startFill(person) {
  const { password, pin } = getAuth();
  state.currentPerson = person;
  state.hasUnsavedChanges = false;
  state.lastSaveTime = null;
  $("formTitle").textContent = `Fragebogen: Person ${person}`;
  msg($("saveMsg"), "");

  // Clear auto-save timer
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }

  const loaded = await api(`/api/sessions/${state.currentSession.id}/responses/${person}/load`, {
    method: "POST",
    body: JSON.stringify({ password, pin }),
  });

  state.formResponses = loaded.responses || {};
  buildForm(state.currentTemplate, state.formResponses);
  
  // Update formResponses after building form for navigation
  setTimeout(() => {
    state.formResponses = collectForm();
    updateProgress();
  }, 100);

  show($("panelForm"), true);
  show($("panelCompare"), false);
  show($("panelAI"), false);
  
  // Setup beforeunload warning
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Start save status updates
  startSaveStatusUpdates();
}

function handleBeforeUnload(e) {
  if (state.hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
}

async function saveFill() {
  const { password, pin } = getAuth();
  const person = state.currentPerson;
  if (!person) throw new Error("No person selected");

  // Validate before saving
  const validation = validateForm();
  if (validation.errors.length > 0) {
    showValidationErrors(validation.errors, validation.warnings);
    msg($("saveMsg"), "Bitte Fehler beheben bevor speichern.", "err");
    return;
  }

  const responses = collectForm();
  
  try {
    await api(`/api/sessions/${state.currentSession.id}/responses/${person}/save`, {
      method: "POST",
      body: JSON.stringify({ password, pin, responses }),
    });

    state.hasUnsavedChanges = false;
    state.lastSaveTime = new Date();
    msg($("saveMsg"), "Gespeichert.", "ok");
    
    // refresh session metadata
    await openSession(state.currentSession.id);
    show($("panelForm"), true);
    
    // Update progress
    state.formResponses = responses;
    updateProgress();
    
    // Update navigation
    renderQuestionNavigation();
    
    // Update save status
    updateSaveStatus();
  } catch (e) {
    // Handle server validation errors
    const errorText = e.message || String(e);
    try {
      // Try to extract JSON from error message
      const jsonMatch = errorText.match(/\{.*\}/);
      if (jsonMatch) {
        const errorData = JSON.parse(jsonMatch[0]);
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const serverErrors = errorData.errors.map(err => {
            // Extract question ID from error message if possible
            const match = String(err).match(/Question (\w+):/);
            return {
              qid: match ? match[1] : null,
              message: err
            };
          });
          const serverWarnings = (errorData.warnings || []).map(warn => {
            const match = String(warn).match(/Question (\w+):/);
            return {
              qid: match ? match[1] : null,
              message: warn
            };
          });
          showValidationErrors(serverErrors, serverWarnings);
          msg($("saveMsg"), "Server-Validierungsfehler. Bitte beheben.", "err");
          return;
        }
      }
    } catch (parseError) {
      // Not a JSON error, fall through to generic error handling
    }
    
    msg($("saveMsg"), `Fehler beim Speichern: ${errorText}`, "err");
  }
}

function renderCompare(result) {
  const host = $("compareHost");
  host.innerHTML = "";

  // Summary with better formatting
  const top = document.createElement("div");
  top.className = "item";
  top.innerHTML = `
    <div class="title">Zusammenfassung</div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 12px;">
      <div style="padding: 12px; background: rgba(67, 209, 123, 0.1); border: 1px solid rgba(67, 209, 123, 0.4); border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: var(--ok);">${result.summary.counts.MATCH}</div>
        <div style="font-size: 12px; color: var(--muted);">MATCH</div>
      </div>
      <div style="padding: 12px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.4); border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${result.summary.counts.EXPLORE}</div>
        <div style="font-size: 12px; color: var(--muted);">EXPLORE</div>
      </div>
      <div style="padding: 12px; background: rgba(255, 93, 93, 0.1); border: 1px solid rgba(255, 93, 93, 0.4); border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: var(--danger);">${result.summary.counts.BOUNDARY}</div>
        <div style="font-size: 12px; color: var(--muted);">BOUNDARY</div>
      </div>
    </div>
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line);">
      <div class="hint">Flags: low_comfort_high_interest ${result.summary.flags.low_comfort_high_interest} | big_delta ${result.summary.flags.big_delta} | high_risk ${result.summary.flags.high_risk}</div>
    </div>
  `;
  host.appendChild(top);

  // Filter controls
  const filterDiv = document.createElement("div");
  filterDiv.className = "item";
  filterDiv.style.marginTop = "12px";
  filterDiv.innerHTML = `
    <div class="title">Filter</div>
    <div class="row" style="margin-top: 8px;">
      <label style="display: flex; align-items: center; gap: 6px;">
        <input type="checkbox" id="filterMatch" checked />
        <span>MATCH</span>
      </label>
      <label style="display: flex; align-items: center; gap: 6px;">
        <input type="checkbox" id="filterExplore" checked />
        <span>EXPLORE</span>
      </label>
      <label style="display: flex; align-items: center; gap: 6px;">
        <input type="checkbox" id="filterBoundary" checked />
        <span>BOUNDARY</span>
      </label>
    </div>
  `;
  host.appendChild(filterDiv);

  // Store result for filtering
  state.compareResult = result;

  // Render items
  renderCompareItems(result.items || [], host);

  // Add filter listeners
  filterDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      renderCompareItems(result.items || [], host);
    });
  });
}

function renderCompareItems(items, host) {
  // Remove existing items (keep summary and filters)
  const existingItems = host.querySelectorAll('.compare-item');
  existingItems.forEach(el => el.remove());

  // Get filter state
  const showMatch = $("filterMatch")?.checked !== false;
  const showExplore = $("filterExplore")?.checked !== false;
  const showBoundary = $("filterBoundary")?.checked !== false;

  for (const it of items) {
    // Apply filters
    if (it.pair_status === "MATCH" && !showMatch) continue;
    if (it.pair_status === "EXPLORE" && !showExplore) continue;
    if (it.pair_status === "BOUNDARY" && !showBoundary) continue;

    const div = document.createElement("div");
    div.className = `item compare-item ${it.pair_status.toLowerCase()}-highlight`;
    
    const flags = (it.flags || []).map(f => `<span class="badge">${escapeHtml(f)}</span>`).join(" ");
    const riskClass = `risk-badge-${it.risk_level || "A"}`;
    const risk = `<span class="badge ${riskClass}">Risk ${escapeHtml(it.risk_level || "A")}</span>`;
    
    // Format answers better
    const formatAnswer = (data, schema) => {
      if (!data || Object.keys(data).length === 0) return "<em>Nicht beantwortet</em>";
      if (schema === "consent_rating") {
        const parts = [];
        if (data.status) parts.push(`Status: <strong>${data.status}</strong>`);
        if (data.interest !== undefined) parts.push(`Interesse: ${data.interest}`);
        if (data.comfort !== undefined) parts.push(`Komfort: ${data.comfort}`);
        if (data.conditions) parts.push(`Bedingungen: ${escapeHtml(data.conditions)}`);
        if (data.notes) parts.push(`Notizen: ${escapeHtml(data.notes)}`);
        return parts.join(" | ");
      }
      return escapeHtml(JSON.stringify(data, null, 2));
    };

    div.innerHTML = `
      <div class="title">
        <span class="status-badge status-${it.pair_status.toLowerCase()}">${escapeHtml(it.pair_status)}</span>
        ${risk} ${flags}
      </div>
      <div style="margin-top:6px"><strong>${escapeHtml(it.label)}</strong></div>
      <div class="hint">${escapeHtml(it.module_name)} | ${escapeHtml(it.question_id)}</div>
      <hr />
      <div class="grid2">
        <div>
          <div class="hint">Person A</div>
          <div class="compare-answer">${formatAnswer(it.a, it.schema)}</div>
        </div>
        <div>
          <div class="hint">Person B</div>
          <div class="compare-answer">${formatAnswer(it.b, it.schema)}</div>
        </div>
      </div>
    `;
    host.appendChild(div);
  }
}

async function doCompare() {
  const { password } = getAuth();
  const result = await api(`/api/sessions/${state.currentSession.id}/compare`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  renderCompare(result);
  show($("panelCompare"), true);
  show($("panelForm"), false);
  show($("panelAI"), true);
}

async function doExport(kind) {
  const { password } = getAuth();
  const blob = await api(`/api/sessions/${state.currentSession.id}/export/${kind}`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = kind === "markdown" ? "report.md" : "export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function doAI() {
  const { password } = getAuth();
  const apiKey = $("aiKey").value.trim();
  const model = $("aiModel").value.trim();
  const redact = $("aiRedact").value === "true";
  const maxTokens = Number($("aiMaxTokens").value || 800);

  if (!apiKey || !model) {
    $("aiOut").textContent = "API Key und Model fehlen.";
    return;
  }

  $("aiOut").textContent = "läuft...";
  try {
    const rep = await api(`/api/sessions/${state.currentSession.id}/ai/analyze`, {
      method: "POST",
      body: JSON.stringify({
        password,
        provider: "openrouter",
        api_key: apiKey,
        model,
        redact_free_text: redact,
        max_tokens: maxTokens,
      }),
    });
    $("aiOut").textContent = rep.text || JSON.stringify(rep, null, 2);
  } catch (e) {
    $("aiOut").textContent = String(e);
  }
}

// Keyboard navigation
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Don't interfere with input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }
    
    // Escape to close panels
    if (e.key === 'Escape') {
      if (!$("panelForm").classList.contains("hidden")) {
        show($("panelForm"), false);
      }
      if (!$("panelCompare").classList.contains("hidden")) {
        show($("panelCompare"), false);
      }
    }
  });
}

// wire events
setupKeyboardNavigation();
$("btnRefresh").addEventListener("click", () => loadSessions());
$("btnCreate").addEventListener("click", async () => {
  msg($("createMsg"), "");
  try {
    const name = $("newName").value.trim();
    const templateId = $("newTemplate").value;
    const password = $("newPassword").value;
    const pinA = $("newPinA").value || null;
    const pinB = $("newPinB").value || null;

    if (!name) throw new Error("Name fehlt.");
    if (!password || password.length < 6) throw new Error("Passwort fehlt/zu kurz.");

    await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        name,
        template_id: templateId,
        password,
        pin_a: pinA,
        pin_b: pinB,
      }),
    });
    msg($("createMsg"), "Session erstellt.", "ok");
    $("newName").value = "";
    $("newPassword").value = "";
    $("newPinA").value = "";
    $("newPinB").value = "";
    await loadSessions();
  } catch (e) {
    msg($("createMsg"), String(e), "err");
  }
});

$("btnBack").addEventListener("click", backHome);
$("btnFillA").addEventListener("click", () => startFill("A").catch(e => msg($("sessionMsg"), String(e), "err")));
$("btnFillB").addEventListener("click", () => startFill("B").catch(e => msg($("sessionMsg"), String(e), "err")));
$("btnSaveForm").addEventListener("click", () => saveFill().catch(e => msg($("saveMsg"), String(e), "err")));
$("btnCloseForm").addEventListener("click", () => show($("panelForm"), false));
$("btnCompare").addEventListener("click", () => doCompare().catch(e => msg($("sessionMsg"), String(e), "err")));
$("btnCloseCompare").addEventListener("click", () => show($("panelCompare"), false));
$("btnExportMd").addEventListener("click", () => doExport("markdown").catch(e => msg($("sessionMsg"), String(e), "err")));
$("btnExportJson").addEventListener("click", () => doExport("json").catch(e => msg($("sessionMsg"), String(e), "err")));
$("btnRunAI").addEventListener("click", () => doAI());

// initial load
(async () => {
  await loadTemplates();
  await loadSessions();
})();


