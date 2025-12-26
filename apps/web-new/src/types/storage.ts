import type { Person } from './common';
import type { ResponseMap } from './form';
import type { SessionListItem } from './session';
import type { Template, TemplateListItem } from './template';

/**
 * IndexedDB storage types
 */

export interface StoredSession extends SessionListItem {
  template?: Template;
}

export interface StoredResponses {
  session_id: string;
  person: Person;
  responses: ResponseMap;
  last_modified: string;
}

export interface StoredTemplate extends TemplateListItem {
  data?: Template;
}

/**
 * IndexedDB store names
 */
export const DB_NAME = 'intimacy-tool-db';
export const DB_VERSION = 2;

export const STORES = {
  SESSIONS: 'sessions',
  RESPONSES: 'responses',
  TEMPLATES: 'templates',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

/**
 * Database initialization config
 */
export interface DBConfig {
  name: string;
  version: number;
  stores: {
    name: StoreName;
    keyPath: string;
    indexes?: { name: string; keyPath: string; unique: boolean }[];
  }[];
}
