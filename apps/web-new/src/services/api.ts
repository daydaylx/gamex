import type { SessionListItem, SessionInfo, CreateSessionRequest } from '../types/session';
import type { TemplateListItem, Template } from '../types/template';
import type { ResponseMap } from '../types/form';
import type { CompareResponse } from '../types/compare';
import { compare } from './comparison/compare';

// Storage helpers
const STORAGE_PREFIX = 'gamex:';
const SESSIONS_KEY = `${STORAGE_PREFIX}sessions`;

function getStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Template loading (bundled JSON files)
let cachedTemplates: Template[] | null = null;

async function loadBundledTemplates(): Promise<Template[]> {
  if (cachedTemplates) return cachedTemplates;

  // Load all available templates
  const templateFiles = [
    'psycho_enhanced_v3.json',
    'unified_template.json',
    'default_template.json',
    'comprehensive_v1.json'
  ];

  try {
    const templates: Template[] = [];
    for (const file of templateFiles) {
      try {
        const response = await fetch(`/data/templates/${file}`);
        if (response.ok) {
          const template = await response.json();
          templates.push(template);
        }
      } catch (err) {
        console.warn(`Could not load template ${file}:`, err);
      }
    }
    cachedTemplates = templates;
    return cachedTemplates;
  } catch (err) {
    console.error('Failed to load templates:', err);
    return [];
  }
}

// API Functions
export async function listSessions(): Promise<SessionListItem[]> {
  return getStorage<SessionListItem[]>(SESSIONS_KEY) || [];
}

export async function getSessionInfo(sessionId: string): Promise<SessionInfo> {
  const sessions = await listSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const templates = await loadBundledTemplates();
  const template = templates.find(t => t.id === session.template_id);
  if (!template) {
    throw new Error('Template not found');
  }

  return {
    ...session,
    template,
    updated_at: new Date().toISOString(),
  };
}

export async function createSession(data: CreateSessionRequest): Promise<SessionInfo> {
  const id = generateId();
  const now = new Date().toISOString();

  const newSession: SessionListItem = {
    id,
    name: data.name,
    template_id: data.template_id,
    created_at: now,
    has_a: false,
    has_b: false,
  };

  const sessions = await listSessions();
  sessions.push(newSession);
  setStorage(SESSIONS_KEY, sessions);

  return getSessionInfo(id);
}

export async function listTemplates(): Promise<TemplateListItem[]> {
  const templates = await loadBundledTemplates();
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    version: t.version,
  }));
}

export async function loadResponses(sessionId: string, person: 'A' | 'B'): Promise<ResponseMap> {
  const key = `${STORAGE_PREFIX}responses:${sessionId}:${person}`;
  return getStorage<ResponseMap>(key) || {};
}

export async function saveResponses(
  sessionId: string,
  person: 'A' | 'B',
  responses: ResponseMap
): Promise<void> {
  const key = `${STORAGE_PREFIX}responses:${sessionId}:${person}`;
  setStorage(key, responses);

  // Update session completion status
  const sessions = await listSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    if (person === 'A') {
      session.has_a = Object.keys(responses).length > 0;
    } else {
      session.has_b = Object.keys(responses).length > 0;
    }
    setStorage(SESSIONS_KEY, sessions);
  }
}

export async function compareSession(sessionId: string): Promise<CompareResponse> {
  const sessionInfo = await getSessionInfo(sessionId);
  const respA = await loadResponses(sessionId, 'A');
  const respB = await loadResponses(sessionId, 'B');

  const result = compare(sessionInfo.template, respA, respB);

  // Add summary statistics
  const summary = {
    total: result.items.length,
    match: result.items.filter(i => i.pair_status === 'MATCH').length,
    explore: result.items.filter(i => i.pair_status === 'EXPLORE').length,
    boundary: result.items.filter(i => i.pair_status === 'BOUNDARY').length,
  };

  return {
    ...result,
    summary,
  };
}

// Scenario types
interface ScenarioOption {
  id: string;
  label: string;
  risk_type: string;
}

interface InfoCard {
  emotional_context?: string;
  typical_risks?: string;
  safety_gate?: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  info_card?: InfoCard;
  options: ScenarioOption[];
}

interface Deck {
  id: string;
  name: string;
  description: string;
  scenarios: string[];
  order: number;
  requires_safety_gate?: boolean;
}

interface ScenariosData {
  decks: Deck[];
  scenarios: Scenario[];
}

let cachedScenarios: ScenariosData | null = null;

export async function loadScenarios(): Promise<ScenariosData> {
  if (cachedScenarios) return cachedScenarios;

  try {
    const response = await fetch('/data/scenarios.json');
    if (!response.ok) {
      throw new Error(`Failed to load scenarios: ${response.status}`);
    }
    const data = await response.json();
    cachedScenarios = data as ScenariosData;
    return cachedScenarios;
  } catch (err) {
    console.error('Failed to load scenarios:', err);
    throw err;
  }
}
