/**
 * Local API Service
 * Provides offline-first API implementation using IndexedDB
 * Mimics backend API structure for seamless fallback
 */

import { init, get, getAll, put } from '../storage/indexedDB';
import { normalizeTemplate } from '../templates/normalize';
import { validateResponses } from '../validation/validator';
import { compare } from '../comparison/compare';
import type { Template, TemplateListItem } from '../../types';
import type { ResponseMap, ResponseValue } from '../../types/form';
import type { Session, SessionInfo, SessionListItem } from '../../types/session';
import type { CompareResponse } from '../../types/compare';

const DB_NAME = 'intimacy_tool';
const DB_VERSION = 2;
const STORE_SESSIONS = 'sessions';
const STORE_RESPONSES = 'responses';

// Caching
let templatesIndex: { templates?: TemplateListItem[] } | null = null;
const templateCache = new Map<string, Template>();
let scenariosCache: Record<string, unknown>[] | null = null;

/**
 * Detects if local API mode should be enabled
 */
export function isLocalApiEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const forceLocal = params.get('local') === '1' || window.localStorage.getItem('LOCAL_API') === '1';

  // Check for Capacitor (native app)
  const isNative =
    !!window.Capacitor &&
    (typeof window.Capacitor.isNativePlatform === 'function'
      ? window.Capacitor.isNativePlatform()
      : true);

  // Check for file: or capacitor: protocol
  const isLocalProtocol = window.location.protocol === 'file:' || window.location.protocol === 'capacitor:';

  return forceLocal || isNative || isLocalProtocol;
}

/**
 * Generates a random UUID
 */
function randomUUID(): string {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  // Fallback polyfill
  const buf = new Uint8Array(16);
  window.crypto.getRandomValues(buf);
  buf[6] = (buf[6]! & 0x0f) | 0x40;
  buf[8] = (buf[8]! & 0x3f) | 0x80;
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Loads the templates index from data/templates.json
 */
async function loadTemplatesIndex(): Promise<{ templates?: TemplateListItem[] }> {
  if (templatesIndex) return templatesIndex;

  const res = await fetch('/data/templates.json');
  if (!res.ok) throw new Error('Templates index not found');

  const data = await res.json();
  templatesIndex = data;
  return data;
}

/**
 * Lists all available templates
 */
export async function listTemplates(): Promise<TemplateListItem[]> {
  const idx = await loadTemplatesIndex();
  return (idx.templates || []).map((t) => ({
    id: t.id,
    name: t.name,
    version: t.version,
  }));
}

/**
 * Loads a template by ID with caching
 */
export async function loadTemplateById(templateId: string): Promise<Template> {
  if (templateCache.has(templateId)) {
    return templateCache.get(templateId)!;
  }

  const idx = await loadTemplatesIndex();
  const meta = (idx.templates || []).find((t) => t.id === templateId);
  if (!meta) throw new Error('Template not found');

  // Type assertion for extended meta properties
  const metaExt = meta as TemplateListItem & { file: string; override_id?: string };

  const res = await fetch(metaExt.file);
  if (!res.ok) throw new Error('Template not found');

  let tpl = await res.json();

  // Override ID if specified
  if (metaExt.override_id) {
    tpl.id = metaExt.override_id;
  }

  // Normalize template
  tpl = normalizeTemplate(tpl);

  templateCache.set(templateId, tpl);
  return tpl;
}

/**
 * Loads scenarios from data/scenarios.json
 */
export async function loadScenarios(): Promise<Record<string, unknown>[]> {
  if (scenariosCache) return scenariosCache;

  const res = await fetch('/data/scenarios.json');
  if (!res.ok) return [];

  const data = await res.json();
  scenariosCache = data;
  return data;
}

/**
 * Lists all sessions with response flags
 */
export async function listSessions(): Promise<SessionListItem[]> {
  await init(DB_NAME, DB_VERSION);

  const sessions = await getAll<Session>(STORE_SESSIONS);
  const responses = await getAll<{ id: string; session_id: string; person: string }>(STORE_RESPONSES);

  // Build flags for which persons have responses
  const flags = new Map<string, { has_a: boolean; has_b: boolean }>();
  for (const r of responses) {
    if (!r || !r.session_id || !r.person) continue;
    const entry = flags.get(r.session_id) || { has_a: false, has_b: false };
    if (r.person === 'A') entry.has_a = true;
    if (r.person === 'B') entry.has_b = true;
    flags.set(r.session_id, entry);
  }

  // Sort by created_at descending
  sessions.sort((a: Session, b: Session) => {
    const ta = Date.parse(a.created_at || '') || 0;
    const tb = Date.parse(b.created_at || '') || 0;
    return tb - ta;
  });

  return sessions.map((s: Session) => {
    const fb = flags.get(s.id) || { has_a: false, has_b: false };
    return {
      id: s.id,
      name: s.name,
      template_id: s.template_id,
      created_at: s.created_at,
      has_a: fb.has_a,
      has_b: fb.has_b,
    };
  });
}

/**
 * Creates a new session
 */
export async function createSession(req: { name: string; template_id: string }): Promise<SessionListItem> {
  if (!req || typeof req !== 'object') throw new Error('Invalid request');

  const name = String(req.name || '').trim();
  const templateId = String(req.template_id || '').trim();

  if (!name) throw new Error('Name fehlt.');
  if (!templateId) throw new Error('Template fehlt.');

  // Verify template exists
  await loadTemplateById(templateId);

  const sessionId = randomUUID();
  const createdAt = new Date().toISOString();

  await init(DB_NAME, DB_VERSION);
  await put(STORE_SESSIONS, {
    id: sessionId,
    name,
    template_id: templateId,
    created_at: createdAt,
  });

  return {
    id: sessionId,
    name,
    template_id: templateId,
    created_at: createdAt,
    has_a: false,
    has_b: false,
  };
}

/**
 * Loads a session row from IndexedDB
 */
async function loadSessionRow(sessionId: string): Promise<Session> {
  await init(DB_NAME, DB_VERSION);
  const row = await get<Session>(STORE_SESSIONS, sessionId);
  if (!row) throw new Error('Session not found');
  return row;
}

/**
 * Gets session information with template and response flags
 */
export async function getSessionInfo(sessionId: string): Promise<SessionInfo> {
  const row = await loadSessionRow(sessionId);
  const tpl = await loadTemplateById(row.template_id);

  await init(DB_NAME, DB_VERSION);
  const responses = await getAll<{ id: string; session_id: string; person: string }>(STORE_RESPONSES);

  const hasA = responses.some((r: { id: string; session_id: string; person: string }) => r.session_id === sessionId && r.person === 'A');
  const hasB = responses.some((r: { id: string; session_id: string; person: string }) => r.session_id === sessionId && r.person === 'B');

  return {
    id: row.id,
    name: row.name,
    template: tpl,
    created_at: row.created_at,
    has_a: hasA,
    has_b: hasB,
  };
}

/**
 * Loads responses for a specific person in a session
 */
export async function loadResponses(
  sessionId: string,
  person: 'A' | 'B',
  _req?: unknown
): Promise<{ responses: ResponseMap }> {
  if (person !== 'A' && person !== 'B') throw new Error('Invalid person');

  await loadSessionRow(sessionId);
  await init(DB_NAME, DB_VERSION);

  const respRow = await get<{ id: string; json: string }>(STORE_RESPONSES, `${sessionId}:${person}`);
  if (!respRow) return { responses: {} };

  return { responses: JSON.parse(respRow.json || '{}') };
}

/**
 * Saves responses for a specific person in a session
 */
export async function saveResponses(
  sessionId: string,
  person: 'A' | 'B',
  req: { responses: ResponseMap }
): Promise<{ ok: boolean; updated_at: string }> {
  if (person !== 'A' && person !== 'B') throw new Error('Invalid person');
  if (!req || typeof req !== 'object') throw new Error('Invalid request');

  const responses = req.responses;
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    throw new Error('responses must be object/dict');
  }

  const row = await loadSessionRow(sessionId);
  const template = await loadTemplateById(row.template_id);

  // Validate responses
  const validation = validateResponses(template, responses);
  if (validation.errors && validation.errors.length) {
    const msg = validation.errors[0]?.message || 'Validation errors';
    throw new Error(msg);
  }

  const blob = JSON.stringify(responses);
  const updatedAt = new Date().toISOString();

  await init(DB_NAME, DB_VERSION);
  await put(STORE_RESPONSES, {
    id: `${sessionId}:${person}`,
    session_id: sessionId,
    person,
    json: blob,
    updated_at: updatedAt,
  });

  return { ok: true, updated_at: updatedAt };
}

/**
 * Compares responses for both persons in a session
 */
export async function compareSession(sessionId: string, _req?: unknown): Promise<CompareResponse> {
  const row = await loadSessionRow(sessionId);

  await init(DB_NAME, DB_VERSION);
  const respA = await get<{ json: string }>(STORE_RESPONSES, `${sessionId}:A`);
  const respB = await get<{ json: string }>(STORE_RESPONSES, `${sessionId}:B`);

  if (!respA || !respB) {
    throw new Error('Need both A and B responses to compare');
  }

  const parsedA = JSON.parse(respA.json || '{}');
  const parsedB = JSON.parse(respB.json || '{}');

  const template = await loadTemplateById(row.template_id);
  const scenarios = await loadScenarios();

  // Convert scenarios array to map for compare function
  const scenariosMap: Record<string, ResponseValue> = {};
  for (const scenario of scenarios) {
    if (scenario && typeof scenario === 'object' && 'id' in scenario) {
      scenariosMap[String(scenario.id)] = scenario as ResponseValue;
    }
  }

  return compare(template, parsedA, parsedB, scenariosMap);
}

/**
 * Main API request handler
 * Routes requests to appropriate handlers based on path and method
 */
export interface ApiRequestOptions {
  method?: string;
  body?: string | object | null;
}

export async function request(path: string, opts: ApiRequestOptions = {}): Promise<unknown> {
  const method = (opts.method || 'GET').toUpperCase();
  const cleanPath = String(path || '').split('?')[0] || '';
  let body: unknown = null;

  if (opts.body) {
    if (typeof opts.body === 'string') {
      body = JSON.parse(opts.body);
    } else if (typeof opts.body === 'object') {
      body = opts.body;
    }
  }

  // Route: GET /api/templates
  if (cleanPath === '/api/templates' && method === 'GET') {
    return listTemplates();
  }

  // Route: GET /api/scenarios
  if (cleanPath === '/api/scenarios' && method === 'GET') {
    return loadScenarios();
  }

  // Route: GET /api/sessions
  if (cleanPath === '/api/sessions' && method === 'GET') {
    return listSessions();
  }

  // Route: POST /api/sessions
  if (cleanPath === '/api/sessions' && method === 'POST') {
    return createSession(body as { name: string; template_id: string });
  }

  // Route: GET /api/sessions/:id
  const sessionMatch = cleanPath.match(/^\/api\/sessions\/([a-zA-Z0-9-]+)$/);
  if (sessionMatch && method === 'GET') {
    return getSessionInfo(sessionMatch[1]!);
  }

  // Route: POST /api/sessions/:id/responses/:person/:action
  const responseMatch = cleanPath.match(/^\/api\/sessions\/([a-zA-Z0-9-]+)\/responses\/(A|B)\/(load|save)$/);
  if (responseMatch && method === 'POST') {
    const sessionId = responseMatch[1]!;
    const person = responseMatch[2]! as 'A' | 'B';
    const action = responseMatch[3]!;

    if (action === 'load') {
      return loadResponses(sessionId, person, body);
    }
    if (action === 'save') {
      return saveResponses(sessionId, person, body as { responses: ResponseMap });
    }
  }

  // Route: POST /api/sessions/:id/compare
  const compareMatch = cleanPath.match(/^\/api\/sessions\/([a-zA-Z0-9-]+)\/compare$/);
  if (compareMatch && method === 'POST') {
    return compareSession(compareMatch[1]!, body);
  }

  throw new Error(`Unknown local API route: ${method} ${cleanPath}`);
}

/**
 * Clears all caches
 */
export function clearCache(): void {
  templatesIndex = null;
  templateCache.clear();
  scenariosCache = null;
}
