(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const forceLocal = params.get("local") === "1" || window.localStorage.getItem("LOCAL_API") === "1";
  const hasCrypto = !!(window.crypto && window.crypto.subtle);
  const isNative = !!window.Capacitor && (typeof window.Capacitor.isNativePlatform === "function" ? window.Capacitor.isNativePlatform() : true);
  const isLocalProtocol = window.location.protocol === "file:" || window.location.protocol === "capacitor:";
  const enabled = (forceLocal || isNative || isLocalProtocol) && hasCrypto;

  const LocalApi = {
    enabled,
    request: async () => {
      throw new Error("Local API not initialized");
    },
    clearCache: () => {}
  };

  window.LocalApi = LocalApi;

  if (!enabled) {
    if (forceLocal && !hasCrypto) {
      console.warn("Local API disabled: Web Crypto not available.");
    }
    return;
  }

  const DB_NAME = "intimacy_tool";
  const DB_VERSION = 1;
  const STORE_SESSIONS = "sessions";
  const STORE_RESPONSES = "responses";

  const PBKDF_ITERATIONS = 390000;
  const PIN_ITERATIONS = 220000;

  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  let dbPromise = null;
  let templatesIndex = null;
  const templateCache = new Map();
  let scenariosCache = null;
  const keyCache = new Map();

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

  function bytesToBase64(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      const slice = bytes.subarray(i, i + chunk);
      binary += String.fromCharCode.apply(null, slice);
    }
    return btoa(binary);
  }

  function base64ToBytes(b64) {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  }

  function bytesToHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 1) {
      out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
  }

  function concatBytes(...parts) {
    const total = parts.reduce((sum, p) => sum + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
      out.set(p, offset);
      offset += p.length;
    }
    return out;
  }

  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  async function sha256Bytes(data) {
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(hash);
  }

  async function deriveRawKey(password, saltBytes, iterations) {
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      textEncoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await window.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return new Uint8Array(bits);
  }

  async function verifierFromRaw(raw) {
    const marker = textEncoder.encode("::verifier");
    const data = concatBytes(raw, marker);
    const hash = await sha256Bytes(data);
    return bytesToHex(hash);
  }

  async function getKeyMaterial(sessionId, password, saltBytes) {
    const cacheKey = `${sessionId}:${password}`;
    const saltB64 = bytesToBase64(saltBytes);
    const cached = keyCache.get(cacheKey);
    if (cached && cached.saltB64 === saltB64) return cached;

    const raw = await deriveRawKey(password, saltBytes, PBKDF_ITERATIONS);
    const verifier = await verifierFromRaw(raw);
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
    const entry = { raw, verifier, aesKey, saltB64 };
    keyCache.set(cacheKey, entry);
    return entry;
  }

  async function hashPin(pin, saltBytes, person) {
    const marker = textEncoder.encode(`${person}::pin`);
    const pinSalt = await sha256Bytes(concatBytes(saltBytes, marker));
    const raw = await deriveRawKey(pin, pinSalt, PIN_ITERATIONS);
    const hash = await sha256Bytes(raw);
    return bytesToHex(hash);
  }

  async function encryptJson(aesKey, plaintext) {
    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      textEncoder.encode(plaintext)
    );
    return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
  }

  async function decryptJson(aesKey, blob) {
    const parts = String(blob || "").split(".");
    if (parts.length !== 2) throw new Error("Decrypt failed");
    const iv = base64ToBytes(parts[0]);
    const data = base64ToBytes(parts[1]);
    const plaintext = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      data
    );
    return textDecoder.decode(plaintext);
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
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
    const password = String(req.password || "");
    const pinA = String(req.pin_a || "").trim() || null;
    const pinB = String(req.pin_b || "").trim() || null;

    if (!name) throw new Error("Name fehlt.");
    if (!templateId) throw new Error("Template fehlt.");
    if (!password || password.length < 6) throw new Error("Passwort fehlt oder ist zu kurz.");

    await loadTemplateById(templateId);

    const saltBytes = new Uint8Array(16);
    window.crypto.getRandomValues(saltBytes);
    const salt = bytesToBase64(saltBytes);
    const raw = await deriveRawKey(password, saltBytes, PBKDF_ITERATIONS);
    const verifier = await verifierFromRaw(raw);

    const sessionId = randomUUID();
    const createdAt = new Date().toISOString();

    const pinAHash = pinA ? await hashPin(pinA, saltBytes, "A") : null;
    const pinBHash = pinB ? await hashPin(pinB, saltBytes, "B") : null;

    await dbPut(STORE_SESSIONS, {
      id: sessionId,
      name,
      template_id: templateId,
      created_at: createdAt,
      salt,
      pw_verifier: verifier,
      pin_a_hash: pinAHash,
      pin_b_hash: pinBHash
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

  async function requirePassword(sessionRow, sessionId, password) {
    const saltBytes = base64ToBytes(sessionRow.salt);
    const km = await getKeyMaterial(sessionId, password, saltBytes);
    if (!safeEqual(km.verifier, sessionRow.pw_verifier)) {
      throw new Error("Wrong password");
    }
    return { saltBytes, aesKey: km.aesKey };
  }

  async function verifyPin(pin, storedHash, saltBytes, person) {
    if (!storedHash) return true;
    if (!pin) return false;
    const candidate = await hashPin(pin, saltBytes, person);
    return safeEqual(candidate, storedHash);
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
    if (!req || typeof req !== "object") throw new Error("Invalid request");
    const password = String(req.password || "");
    const pin = String(req.pin || "").trim() || null;

    const row = await loadSessionRow(sessionId);
    const { saltBytes, aesKey } = await requirePassword(row, sessionId, password);

    const storedPinHash = person === "A" ? row.pin_a_hash : row.pin_b_hash;
    const okPin = await verifyPin(pin, storedPinHash, saltBytes, person);
    if (!okPin) throw new Error("Wrong PIN");

    const respRow = await dbGet(STORE_RESPONSES, `${sessionId}:${person}`);
    if (!respRow) return { responses: {} };

    const plaintext = await decryptJson(aesKey, respRow.encrypted_blob);
    return { responses: JSON.parse(plaintext) };
  }

  async function saveResponses(sessionId, person, req) {
    if (person !== "A" && person !== "B") throw new Error("Invalid person");
    if (!req || typeof req !== "object") throw new Error("Invalid request");
    const password = String(req.password || "");
    const pin = String(req.pin || "").trim() || null;
    const responses = req.responses;

    if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
      throw new Error("responses must be object/dict");
    }

    const row = await loadSessionRow(sessionId);
    const { saltBytes, aesKey } = await requirePassword(row, sessionId, password);

    const storedPinHash = person === "A" ? row.pin_a_hash : row.pin_b_hash;
    const okPin = await verifyPin(pin, storedPinHash, saltBytes, person);
    if (!okPin) throw new Error("Wrong PIN");

    const template = await loadTemplateById(row.template_id);
    if (typeof window.validateResponses === "function") {
      const validation = window.validateResponses(template, responses) || { errors: [], warnings: [] };
      if (validation.errors && validation.errors.length) {
        const msg = validation.errors[0]?.message || "Validation errors";
        throw new Error(msg);
      }
    }

    const blob = await encryptJson(aesKey, JSON.stringify(responses));
    const updatedAt = new Date().toISOString();

    await dbPut(STORE_RESPONSES, {
      id: `${sessionId}:${person}`,
      session_id: sessionId,
      person,
      encrypted_blob: blob,
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
    if (!req || typeof req !== "object") throw new Error("Invalid request");
    const password = String(req.password || "");

    const row = await loadSessionRow(sessionId);
    const { aesKey } = await requirePassword(row, sessionId, password);

    const respA = await dbGet(STORE_RESPONSES, `${sessionId}:A`);
    const respB = await dbGet(STORE_RESPONSES, `${sessionId}:B`);
    if (!respA || !respB) throw new Error("Need both A and B responses to compare");

    const plainA = await decryptJson(aesKey, respA.encrypted_blob);
    const plainB = await decryptJson(aesKey, respB.encrypted_blob);
    const parsedA = JSON.parse(plainA);
    const parsedB = JSON.parse(plainB);

    const template = await loadTemplateById(row.template_id);
    return compare(template, parsedA, parsedB);
  }

  LocalApi.clearCache = () => {
    keyCache.clear();
  };

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
