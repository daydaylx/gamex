import type { AISettings } from '../types/ai';

const STORAGE_PREFIX = 'gamex:';
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;

// No default API key - user must configure their own
const DEFAULT_API_KEY = '';
// Free, uncensored model for help popup (32k context, $0)
const DEFAULT_HELP_MODEL = 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free';
// High-quality model for report generation (max quality, cost not a concern)
// Note: If this model ID doesn't work, check OpenRouter for the exact identifier
const DEFAULT_REPORT_MODEL = 'nousresearch/hermes-4-405b';

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

/**
 * Get current AI settings from localStorage
 */
export function getAISettings(): AISettings {
  const stored = getStorage<AISettings>(SETTINGS_KEY);
  
  if (stored && stored.apiKey) {
    return {
      apiKey: stored.apiKey,
      helpModel: stored.helpModel || DEFAULT_HELP_MODEL,
      reportModel: stored.reportModel || DEFAULT_REPORT_MODEL,
    };
  }
  
  // Return defaults if nothing stored
  return {
    apiKey: DEFAULT_API_KEY,
    helpModel: DEFAULT_HELP_MODEL,
    reportModel: DEFAULT_REPORT_MODEL,
  };
}

/**
 * Save AI settings to localStorage
 */
export function saveAISettings(settings: Partial<AISettings>): void {
  const current = getAISettings();
  const updated: AISettings = {
    ...current,
    ...settings,
  };
  
  // Validate API key format (basic check)
  if (updated.apiKey && updated.apiKey.trim().length === 0) {
    throw new Error('API-Key darf nicht leer sein');
  }
  
  setStorage(SETTINGS_KEY, updated);
}

/**
 * Check if API key is configured
 */
export function hasAPIKey(): boolean {
  const settings = getAISettings();
  return !!(settings.apiKey && settings.apiKey.trim().length > 0);
}

/**
 * Validate settings
 */
export function validateSettings(settings: Partial<AISettings>): { valid: boolean; error?: string } {
  if (settings.apiKey !== undefined) {
    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      return { valid: false, error: 'API-Key ist erforderlich' };
    }
    if (!settings.apiKey.startsWith('sk-')) {
      return { valid: false, error: 'API-Key scheint ungültig zu sein' };
    }
  }
  
  if (settings.helpModel !== undefined && !settings.helpModel.trim()) {
    return { valid: false, error: 'Help-Modell ist erforderlich' };
  }
  
  if (settings.reportModel !== undefined && !settings.reportModel.trim()) {
    return { valid: false, error: 'Report-Modell ist erforderlich' };
  }
  
  return { valid: true };
}

