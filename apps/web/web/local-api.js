(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const forceLocal = params.get("local") === "1" || window.localStorage.getItem("LOCAL_API") === "1";
  const isNative = !!window.Capacitor && (typeof window.Capacitor.isNativePlatform === "function" ? window.Capacitor.isNativePlatform() : true);
  const isLocalProtocol = window.location.protocol === "file:" || window.location.protocol === "capacitor:";
  const enabled = (forceLocal || isNative || isLocalProtocol);

  const LocalApi = {
    enabled,
    request: async () => {
      throw new Error("Local API not initialized");
    },
    clearCache: () => {}
  };

  window.LocalApi = LocalApi;

  if (!enabled) {
    return;
  }

  const DB_NAME = "intimacy_tool";
  const DB_VERSION = 2;
  const STORE_SESSIONS = "sessions";
  const STORE_RESPONSES = "responses";

  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  let dbPromise = null;
  let templatesIndex = null;
  const templateCache = new Map();
  let scenariosCache = null;

  function randomUUID() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    const buf = new Uint8Array(16);
    window.crypto.getRandomValues(buf);
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        // v2: remove legacy encrypted schema (breaking change) and recreate stores
        if (req.oldVersion && req.oldVersion < 2) {
          for (const name of [STORE_SESSIONS, STORE_RESPONSES]) {
            if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name);
          }
        }
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_RESPONSES)) {
          db.createObjectStore(STORE_RESPONSES, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function dbGet(storeName, key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGetAll(storeName) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbPut(storeName, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function loadTemplatesIndex() {
    if (templatesIndex) return templatesIndex;
    const res = await fetch("/data/templates.json");
    if (!res.ok) throw new Error("Templates index not found");
    templatesIndex = await res.json();
    return templatesIndex;
  }

  async function listTemplates() {
    const idx = await loadTemplatesIndex();
    return (idx.templates || []).map((t) => ({
      id: t.id,
      name: t.name,
      version: t.version
    }));
  }

  async function loadTemplateById(templateId) {
    if (templateCache.has(templateId)) return templateCache.get(templateId);
    const idx = await loadTemplatesIndex();
    const meta = (idx.templates || []).find((t) => t.id === templateId);
    if (!meta) throw new Error("Template not found");
    const res = await fetch(meta.file);
    if (!res.ok) throw new Error("Template not found");
    const tpl = await res.json();
    if (meta.override_id) tpl.id = meta.override_id;
    templateCache.set(templateId, tpl);
    return tpl;
  }

  async function loadScenarios() {
    if (scenariosCache) return scenariosCache;
    const res = await fetch("/data/scenarios.json");
    if (!res.ok) return [];
    scenariosCache = await res.json();
    return scenariosCache;
  }

  async function listSessions() {
    const sessions = await dbGetAll(STORE_SESSIONS);
    const responses = await dbGetAll(STORE_RESPONSES);
    const flags = new Map();

    for (const r of responses) {
      if (!r || !r.session_id || !r.person) continue;
      const entry = flags.get(r.session_id) || { has_a: false, has_b: false };
      if (r.person === "A") entry.has_a = true;
      if (r.person === "B") entry.has_b = true;
      flags.set(r.session_id, entry);
    }

    sessions.sort((a, b) => {
      const ta = Date.parse(a.created_at || "") || 0;
      const tb = Date.parse(b.created_at || "") || 0;
      return tb - ta;
    });

    return sessions.map((s) => {
      const fb = flags.get(s.id) || { has_a: false, has_b: false };
      return {
        id: s.id,
        name: s.name,
        template_id: s.template_id,
        created_at: s.created_at,
        has_a: fb.has_a,
        has_b: fb.has_b
      };
    });
  }

  async function createSession(req) {
    if (!req || typeof req !== "object") throw new Error("Invalid request");
    const name = String(req.name || "").trim();
    const templateId = String(req.template_id || "").trim();

    if (!name) throw new Error("Name fehlt.");
    if (!templateId) throw new Error("Template fehlt.");

    await loadTemplateById(templateId);

    const sessionId = randomUUID();
    const createdAt = new Date().toISOString();

    await dbPut(STORE_SESSIONS, {
      id: sessionId,
      name,
      template_id: templateId,
      created_at: createdAt
    });

    return {
      id: sessionId,
      name,
      template_id: templateId,
      created_at: createdAt,
      has_a: false,
      has_b: false
    };
  }

  async function loadSessionRow(sessionId) {
    const row = await dbGet(STORE_SESSIONS, sessionId);
    if (!row) throw new Error("Session not found");
    return row;
  }

  async function getSessionInfo(sessionId) {
    const row = await loadSessionRow(sessionId);
    const tpl = await loadTemplateById(row.template_id);

    const responses = await dbGetAll(STORE_RESPONSES);
    const hasA = responses.some((r) => r.session_id === sessionId && r.person === "A");
    const hasB = responses.some((r) => r.session_id === sessionId && r.person === "B");

    return {
      id: row.id,
      name: row.name,
      template: tpl,
      created_at: row.created_at,
      has_a: hasA,
      has_b: hasB
    };
  }

  async function loadResponses(sessionId, person, req) {
    if (person !== "A" && person !== "B") throw new Error("Invalid person");
    await loadSessionRow(sessionId);

    const respRow = await dbGet(STORE_RESPONSES, `${sessionId}:${person}`);
    if (!respRow) return { responses: {} };
    return { responses: JSON.parse(respRow.json || "{}") };
  }

  async function saveResponses(sessionId, person, req) {
    if (person !== "A" && person !== "B") throw new Error("Invalid person");
    if (!req || typeof req !== "object") throw new Error("Invalid request");
    const responses = req.responses;

    if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
      throw new Error("responses must be object/dict");
    }

    const row = await loadSessionRow(sessionId);

    const template = await loadTemplateById(row.template_id);
    if (typeof window.validateResponses === "function") {
      const validation = window.validateResponses(template, responses) || { errors: [], warnings: [] };
      if (validation.errors && validation.errors.length) {
        const msg = validation.errors[0]?.message || "Validation errors";
        throw new Error(msg);
      }
    }

    const blob = JSON.stringify(responses);
    const updatedAt = new Date().toISOString();

    await dbPut(STORE_RESPONSES, {
      id: `${sessionId}:${person}`,
      session_id: sessionId,
      person,
      json: blob,
      updated_at: updatedAt
    });

    return { ok: true, updated_at: updatedAt };
  }

  function _statusPair(a, b) {
    if (a === "NO" || a === "HARD_LIMIT" || b === "NO" || b === "HARD_LIMIT") return "BOUNDARY";
    if (a === "YES" && b === "YES") return "MATCH";
    return "EXPLORE";
  }

  function _safeInt(v) {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : Math.trunc(n);
  }

  function _absDelta(a, b) {
    if (a === null || b === null) return null;
    return Math.abs(a - b);
  }

  function _flagLowComfortHighInterest(entry) {
    try {
      const i = Number(entry.interest);
      const c = Number(entry.comfort);
      return i >= 3 && c <= 2;
    } catch (_e) {
      return false;
    }
  }

  function _generateActionPlan(items) {
    const matches = items.filter((it) => it.pair_status === "MATCH" && it.schema === "consent_rating");

    const comfortFiltered = [];
    for (const m of matches) {
      const ca = _safeInt(m.a?.comfort) || 0;
      const cb = _safeInt(m.b?.comfort) || 0;
      if (ca >= 3 && cb >= 3) comfortFiltered.push(m);
    }

    const scored = comfortFiltered.map((m) => {
      const ia = _safeInt(m.a?.interest) || 0;
      const ib = _safeInt(m.b?.interest) || 0;
      const ca = _safeInt(m.a?.comfort) || 0;
      const cb = _safeInt(m.b?.comfort) || 0;
      let score = ia + ib + ca + cb;
      if (m.risk_level === "B") score += 1;
      if (m.risk_level === "A") score += 2;
      return { score, item: m };
    });

    scored.sort((a, b) => b.score - a.score);

    const plan = [];
    const usedModules = new Set();
    const usedTags = new Set();
    const tagCategories = {
      soft: ["kissing", "touching", "cuddling"],
      toy: ["toy", "vibrator", "plug"],
      kink: ["bdsm", "roleplay", "fetish"],
      intense: ["impact", "breath", "edge"]
    };

    for (const entry of scored) {
      if (plan.length >= 3) break;
      const tags = new Set(entry.item.tags || []);
      let category = null;
      for (const [cat, tagList] of Object.entries(tagCategories)) {
        if (tagList.some((t) => tags.has(t))) {
          category = cat;
          break;
        }
      }
      if (category && !usedTags.has(category)) {
        plan.push(entry.item);
        usedModules.add(entry.item.module_id);
        usedTags.add(category);
      }
    }

    for (const entry of scored) {
      if (plan.length >= 3) break;
      if (!usedModules.has(entry.item.module_id) && !plan.includes(entry.item)) {
        plan.push(entry.item);
        usedModules.add(entry.item.module_id);
      }
    }

    for (const entry of scored) {
      if (plan.length >= 3) break;
      if (!plan.includes(entry.item)) {
        plan.push(entry.item);
      }
    }

    return plan;
  }

  async function compare(template, respA, respB) {
    const items = [];
    const summary = {
      counts: { MATCH: 0, EXPLORE: 0, BOUNDARY: 0 },
      flags: { low_comfort_high_interest: 0, big_delta: 0, high_risk: 0, hard_limit_violation: 0 },
      generated_at: new Date().toISOString()
    };

    const modules = template.modules || [];
    for (const mod of modules) {
      const modId = mod.id || "";
      const modName = mod.name || "";
      for (const q of mod.questions || []) {
        const qid = q.id;
        const schema = q.schema;
        const risk = q.risk_level || "A";
        const label = q.label || "";
        const helpText = q.help || "";
        const tags = q.tags || [];

        const row = {
          question_id: qid,
          module_id: modId,
          module_name: modName,
          label,
          help: helpText,
          schema,
          risk_level: risk,
          tags
        };

        const a = respA[qid] && typeof respA[qid] === "object" ? respA[qid] : {};
        const b = respB[qid] && typeof respB[qid] === "object" ? respB[qid] : {};
        row.a = a;
        row.b = b;

        const flags = [];
        let pairStatus = null;

        if (schema === "consent_rating") {
          if (a.dom_status !== undefined || b.dom_status !== undefined) {
            const domSa = a.dom_status;
            const domSb = b.dom_status;
            const subSa = a.sub_status;
            const subSb = b.sub_status;

            const domStatus = _statusPair(domSa || "MAYBE", domSb || "MAYBE");
            const subStatus = _statusPair(subSa || "MAYBE", subSb || "MAYBE");

            if (domStatus === "BOUNDARY" || subStatus === "BOUNDARY") pairStatus = "BOUNDARY";
            else if (domStatus === "MATCH" && subStatus === "MATCH") pairStatus = "MATCH";
            else pairStatus = "EXPLORE";

            const domIa = _safeInt(a.dom_interest);
            const domIb = _safeInt(b.dom_interest);
            const domCa = _safeInt(a.dom_comfort);
            const domCb = _safeInt(b.dom_comfort);
            const subIa = _safeInt(a.sub_interest);
            const subIb = _safeInt(b.sub_interest);
            const subCa = _safeInt(a.sub_comfort);
            const subCb = _safeInt(b.sub_comfort);

            row.delta_interest = Math.max(_absDelta(domIa, domIb) || 0, _absDelta(subIa, subIb) || 0);
            row.delta_comfort = Math.max(_absDelta(domCa, domCb) || 0, _absDelta(subCa, subCb) || 0);

            row.dom_status = domStatus;
            row.sub_status = subStatus;
          } else if (a.active_status !== undefined || b.active_status !== undefined) {
            const activeSa = a.active_status;
            const activeSb = b.active_status;
            const passiveSa = a.passive_status;
            const passiveSb = b.passive_status;

            const activeStatus = _statusPair(activeSa || "MAYBE", activeSb || "MAYBE");
            const passiveStatus = _statusPair(passiveSa || "MAYBE", passiveSb || "MAYBE");

            if (activeStatus === "BOUNDARY" || passiveStatus === "BOUNDARY") pairStatus = "BOUNDARY";
            else if (activeStatus === "MATCH" && passiveStatus === "MATCH") pairStatus = "MATCH";
            else pairStatus = "EXPLORE";

            const activeIa = _safeInt(a.active_interest);
            const activeIb = _safeInt(b.active_interest);
            const activeCa = _safeInt(a.active_comfort);
            const activeCb = _safeInt(b.active_comfort);
            const passiveIa = _safeInt(a.passive_interest);
            const passiveIb = _safeInt(b.passive_interest);
            const passiveCa = _safeInt(a.passive_comfort);
            const passiveCb = _safeInt(b.passive_comfort);

            row.delta_interest = Math.max(_absDelta(activeIa, activeIb) || 0, _absDelta(passiveIa, passiveIb) || 0);
            row.delta_comfort = Math.max(_absDelta(activeCa, activeCb) || 0, _absDelta(passiveCa, passiveCb) || 0);

            row.active_status = activeStatus;
            row.passive_status = passiveStatus;
          } else {
            const sa = a.status;
            const sb = b.status;
            pairStatus = sa && sb ? _statusPair(sa, sb) : "EXPLORE";

            const wantsIt = ["YES", "MAYBE"];
            if ((sa === "HARD_LIMIT" && wantsIt.includes(sb)) || (sb === "HARD_LIMIT" && wantsIt.includes(sa))) {
              flags.push("hard_limit_violation");
              summary.flags.hard_limit_violation += 1;
            }

            const ia = _safeInt(a.interest);
            const ib = _safeInt(b.interest);
            const ca = _safeInt(a.comfort);
            const cb = _safeInt(b.comfort);

            row.delta_interest = _absDelta(ia, ib);
            row.delta_comfort = _absDelta(ca, cb);

            if (_flagLowComfortHighInterest(a) || _flagLowComfortHighInterest(b)) {
              flags.push("low_comfort_high_interest");
              summary.flags.low_comfort_high_interest += 1;
            }

            if ((row.delta_interest !== null && row.delta_interest >= 3) || (row.delta_comfort !== null && row.delta_comfort >= 3)) {
              flags.push("big_delta");
              summary.flags.big_delta += 1;
            }
          }
        } else if (schema === "scale_0_10") {
          const va = _safeInt(a.value);
          const vb = _safeInt(b.value);
          row.delta_value = _absDelta(va, vb);
          pairStatus = va !== null && vb !== null && row.delta_value <= 1 ? "MATCH" : "EXPLORE";
          if (row.delta_value !== null && row.delta_value >= 4) {
            flags.push("big_delta");
            summary.flags.big_delta += 1;
          }
        } else if (schema === "enum") {
          const va = a.value;
          const vb = b.value;
          row.match_value = va === vb && va !== undefined && va !== null;
          pairStatus = row.match_value ? "MATCH" : "EXPLORE";
        } else if (schema === "multi") {
          const la = Array.isArray(a.values) ? a.values : [];
          const lb = Array.isArray(b.values) ? b.values : [];
          const inter = Array.from(new Set(la.filter((v) => lb.includes(v)))).sort();
          row.intersection = inter;
          pairStatus = inter.length ? "MATCH" : "EXPLORE";
        } else if (schema === "text") {
          pairStatus = "EXPLORE";
        } else {
          pairStatus = "EXPLORE";
        }

        if (risk === "C") {
          flags.push("high_risk");
          summary.flags.high_risk += 1;
        }

        row.pair_status = pairStatus;
        row.flags = flags;

        if (summary.counts[pairStatus] !== undefined) {
          summary.counts[pairStatus] += 1;
        }

        items.push(row);
      }
    }

    const scenarios = await loadScenarios();
    for (const scen of scenarios || []) {
      const sid = scen.id;
      const key = `SCENARIO_${sid}`;
      const sa = respA[key];
      const sb = respB[key];

      if (sa || sb) {
        const choiceA = sa && typeof sa === "object" ? sa.choice : null;
        const choiceB = sb && typeof sb === "object" ? sb.choice : null;

        let pStatus = "EXPLORE";
        if (choiceA && choiceB) {
          if (choiceA === choiceB) {
            pStatus = "MATCH";
          } else {
            const riskA = sa?.risk_type;
            const riskB = sb?.risk_type;
            const riskyTypes = ["active", "explore", "masochism", "submission", "fantasy_active"];
            const stopTypes = ["boundary", "safety", "no"];
            if ((riskyTypes.includes(riskA) && stopTypes.includes(riskB)) || (riskyTypes.includes(riskB) && stopTypes.includes(riskA))) {
              pStatus = "BOUNDARY";
            }
          }
        }

        if (summary.counts[pStatus] !== undefined) summary.counts[pStatus] += 1;

        items.push({
          question_id: sid,
          module_id: "scenarios",
          module_name: `Szenario: ${scen.category}`,
          label: scen.title,
          help: scen.description,
          schema: "scenario",
          risk_level: "B",
          tags: ["scenario"],
          a: sa,
          b: sb,
          pair_status: pStatus,
          flags: ["scenario"]
        });
      }
    }

    const order = { BOUNDARY: 0, EXPLORE: 1, MATCH: 2 };
    items.sort((x, y) => {
      const ax = order[x.pair_status] ?? 9;
      const ay = order[y.pair_status] ?? 9;
      if (ax !== ay) return ax - ay;
      const rx = x.risk_level === "C" ? 0 : 1;
      const ry = y.risk_level === "C" ? 0 : 1;
      if (rx !== ry) return rx - ry;
      const mx = x.module_name || "";
      const my = y.module_name || "";
      if (mx !== my) return mx.localeCompare(my);
      return String(x.question_id || "").localeCompare(String(y.question_id || ""));
    });

    const actionPlan = _generateActionPlan(items);
    const meta = {
      template_id: template.id,
      template_name: template.name,
      template_version: template.version
    };
    return { meta, summary, items, action_plan: actionPlan };
  }

  async function compareSession(sessionId, req) {
    const row = await loadSessionRow(sessionId);

    const respA = await dbGet(STORE_RESPONSES, `${sessionId}:A`);
    const respB = await dbGet(STORE_RESPONSES, `${sessionId}:B`);
    if (!respA || !respB) throw new Error("Need both A and B responses to compare");

    const parsedA = JSON.parse(respA.json || "{}");
    const parsedB = JSON.parse(respB.json || "{}");

    const template = await loadTemplateById(row.template_id);
    return compare(template, parsedA, parsedB);
  }

  LocalApi.clearCache = () => {};

  LocalApi.request = async (path, opts = {}) => {
    const method = (opts.method || "GET").toUpperCase();
    const cleanPath = String(path || "").split("?")[0];
    let body = null;

    if (opts.body) {
      if (typeof opts.body === "string") body = JSON.parse(opts.body);
      else if (typeof opts.body === "object") body = opts.body;
    }

    if (cleanPath === "/api/templates" && method === "GET") return listTemplates();
    if (cleanPath === "/api/scenarios" && method === "GET") return loadScenarios();
    if (cleanPath === "/api/sessions" && method === "GET") return listSessions();
    if (cleanPath === "/api/sessions" && method === "POST") return createSession(body);

    const sessionMatch = cleanPath.match(/^\/api\/sessions\/([a-zA-Z0-9-]+)$/);
    if (sessionMatch && method === "GET") return getSessionInfo(sessionMatch[1]);

    const responseMatch = cleanPath.match(/^\/api\/sessions\/([a-zA-Z0-9-]+)\/responses\/(A|B)\/(load|save)$/);
    if (responseMatch && method === "POST") {
      const sessionId = responseMatch[1];
      const person = responseMatch[2];
      const action = responseMatch[3];
      if (action === "load") return loadResponses(sessionId, person, body || {});
      if (action === "save") return saveResponses(sessionId, person, body || {});
    }

    const compareMatch = cleanPath.match(/^\/api\/sessions\/([a-zA-Z0-9-]+)\/compare$/);
    if (compareMatch && method === "POST") return compareSession(compareMatch[1], body || {});

    throw new Error(`Unknown local API route: ${method} ${cleanPath}`);
  };
})();
