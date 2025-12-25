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
  const idbStorage = (window.Storage && typeof window.Storage.createIndexedDbStorage === "function")
    ? window.Storage.createIndexedDbStorage({
        dbName: DB_NAME,
        dbVersion: DB_VERSION,
        onUpgrade: ({ db, req }) => {
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
        }
      })
    : null;
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
    if (idbStorage) return idbStorage.openDb();
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
    if (idbStorage) return await idbStorage.get(storeName, key);
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
    if (idbStorage) return await idbStorage.getAll(storeName);
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
    if (idbStorage) return await idbStorage.put(storeName, value);
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
    if (window.TemplateNormalization && typeof window.TemplateNormalization.normalizeTemplate === "function") {
      templateCache.set(templateId, window.TemplateNormalization.normalizeTemplate(tpl));
      return templateCache.get(templateId);
    }
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

  function getCoreCompare() {
    const cc = window.CoreCompare;
    if (!cc || typeof cc.compare !== "function") {
      throw new Error("CoreCompare module not loaded");
    }
    return cc;
  }

  async function compareSession(sessionId, req) {
    const row = await loadSessionRow(sessionId);

    const respA = await dbGet(STORE_RESPONSES, `${sessionId}:A`);
    const respB = await dbGet(STORE_RESPONSES, `${sessionId}:B`);
    if (!respA || !respB) throw new Error("Need both A and B responses to compare");

    const parsedA = JSON.parse(respA.json || "{}");
    const parsedB = JSON.parse(respB.json || "{}");

    const template = await loadTemplateById(row.template_id);
    const scenarios = await loadScenarios();
    return getCoreCompare().compare(template, parsedA, parsedB, scenarios);
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
