import type { CompareResponse } from './compare';
import type {
  CreateSessionRequest,
  SaveResponsesRequest,
  SessionInfo,
  SessionListItem,
} from './session';
import type { Template, TemplateListItem } from './template';

/**
 * API client types for backend communication
 */

export interface APIError {
  detail: string;
  status?: number;
}

export interface APIClient {
  // Templates
  listTemplates: () => Promise<TemplateListItem[]>;
  getTemplate: (templateId: string) => Promise<Template>;

  // Sessions
  createSession: (request: CreateSessionRequest) => Promise<SessionInfo>;
  listSessions: () => Promise<SessionListItem[]>;
  getSession: (sessionId: string) => Promise<SessionInfo>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Responses
  saveResponses: (
    sessionId: string,
    person: 'A' | 'B',
    request: SaveResponsesRequest
  ) => Promise<void>;
  loadResponses: (sessionId: string, person: 'A' | 'B') => Promise<Record<string, unknown>>;

  // Comparison
  compare: (sessionId: string) => Promise<CompareResponse>;

  // Export
  exportMarkdown: (sessionId: string) => Promise<string>;
  exportJSON: (sessionId: string) => Promise<Record<string, unknown>>;
}

/**
 * API configuration
 */
export interface APIConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}
