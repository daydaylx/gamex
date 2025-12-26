/**
 * Template Normalization Service
 * Normalizes and validates template structures from various formats
 */

import type { Template, Module, Question } from '../../types';

interface ValidationResult {
  ok: boolean;
  message: string;
}

/**
 * Converts a value to an array
 */
function asList<T>(v: T | T[] | null | undefined): T[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Ensures value is a string with optional default
 */
function ensureStr(v: unknown, defaultValue = ''): string {
  if (v === null || v === undefined) return defaultValue;
  return typeof v === 'string' ? v : String(v);
}

/**
 * Ensures value is an integer with optional default
 */
function ensureInt(v: unknown, defaultValue = 1): number {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.trunc(n);
  return defaultValue;
}

/**
 * Normalizes a question object, inferring schema if missing
 */
function normalizeQuestion(q: Partial<Question> | null | undefined): Question {
  const out: Record<string, unknown> = { ...(q || {}) };

  // Handle different ID field names
  const qid = out.id ?? out.question_id ?? out.key;
  if (qid !== undefined && qid !== null) {
    out.id = ensureStr(qid);
  }

  // Infer schema if not provided
  if (!out.schema) {
    if (Array.isArray(out.options) && out.options.length > 0) {
      out.schema = 'enum';
    } else if (Array.isArray(out.values)) {
      out.schema = 'multi';
    } else if ('text' in out) {
      out.schema = 'text';
    } else {
      out.schema = 'consent_rating';
    }
  }

  out.risk_level = ensureStr(out.risk_level || 'A');
  out.tags = asList(out.tags)
    .filter((t) => t !== null && t !== undefined)
    .map((t) => String(t));
  out.label = 'label' in out ? ensureStr(out.label) : ensureStr(out.id || '');
  out.help = ensureStr(out.help || '');

  return out as unknown as Question;
}

/**
 * Normalizes a module object
 */
function normalizeModule(m: Partial<Module> | null | undefined, idx: number): Module {
  const out: Record<string, unknown> = { ...(m || {}) };

  out.id = ensureStr(out.id || `module_${idx + 1}`);
  out.name = ensureStr(out.name || out.id);
  out.description = ensureStr(out.description || '');

  const questions = Array.isArray(out.questions) ? out.questions : [];
  out.questions = questions
    .filter((q): q is Partial<Question> => q !== null && typeof q === 'object')
    .map(normalizeQuestion);

  return out as unknown as Module;
}

/**
 * Validates template structure
 */
function validateTemplate(tpl: unknown): ValidationResult {
  if (!tpl || typeof tpl !== 'object') {
    return { ok: false, message: 'template must be an object' };
  }

  const template = tpl as Record<string, unknown>;

  if (!Array.isArray(template.modules)) {
    return { ok: false, message: 'template.modules must be a list' };
  }

  for (const mod of template.modules) {
    if (!mod || typeof mod !== 'object') {
      return { ok: false, message: 'module must be an object' };
    }

    const module = mod as Record<string, unknown>;
    if (!Array.isArray(module.questions)) {
      return { ok: false, message: 'module.questions must be a list' };
    }

    for (const q of module.questions) {
      if (!q || typeof q !== 'object') {
        return { ok: false, message: 'question must be an object' };
      }

      const question = q as Record<string, unknown>;
      if (!question.id) {
        return { ok: false, message: 'question.id is required' };
      }
      if (!question.schema) {
        return { ok: false, message: 'question.schema is required' };
      }
    }
  }

  return { ok: true, message: 'ok' };
}

/**
 * Normalizes a raw template object into a consistent structure
 * @throws {Error} If template validation fails
 */
export function normalizeTemplate(raw: unknown): Template {
  // Deep clone to avoid mutations
  const tpl =
    raw && typeof raw === 'object' ? (JSON.parse(JSON.stringify(raw)) as Record<string, unknown>) : {};

  tpl.id = ensureStr(tpl.id || '');
  tpl.name = ensureStr(tpl.name || '');
  tpl.version = ensureInt(tpl.version, 1);
  tpl.description = ensureStr(tpl.description || '');

  // Handle both module-based and flat question arrays
  let modules = tpl.modules;
  if (!Array.isArray(modules)) {
    if (Array.isArray(tpl.questions)) {
      modules = [{ id: 'default', name: 'Fragen', questions: tpl.questions }];
    } else {
      modules = [];
    }
  }

  tpl.modules = (modules as unknown[])
    .filter((m): m is Partial<Module> => m !== null && typeof m === 'object')
    .map(normalizeModule);

  // Validate before returning
  const validation = validateTemplate(tpl);
  if (!validation.ok) {
    throw new Error(`Invalid template: ${validation.message}`);
  }

  return tpl as unknown as Template;
}

/**
 * Checks if a template is valid without throwing
 */
export function isValidTemplate(raw: unknown): boolean {
  try {
    normalizeTemplate(raw);
    return true;
  } catch {
    return false;
  }
}
