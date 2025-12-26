import type { Template } from './template';

/**
 * Session types for managing questionnaire sessions
 */

export interface CreateSessionRequest {
  name: string;
  template_id: string;
  password?: string;
}

export interface SessionListItem {
  id: string;
  name: string;
  template_id: string;
  created_at: string;
  has_a: boolean;
  has_b: boolean;
  encrypted: boolean;
}

export interface SessionInfo {
  id: string;
  name: string;
  template: Template;
  created_at: string;
  has_a: boolean;
  has_b: boolean;
}

export interface SaveResponsesRequest {
  responses: Record<string, unknown>;
}

export interface LoadResponsesRequest {
  // Empty for now, may have options in future
}
