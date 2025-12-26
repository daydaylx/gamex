/**
 * API service exports
 */

export {
  isLocalApiEnabled,
  request,
  clearCache,
  listTemplates,
  loadTemplateById,
  loadScenarios,
  listSessions,
  createSession,
  getSessionInfo,
  loadResponses,
  saveResponses,
  compareSession,
} from './localApi';

export type { ApiRequestOptions } from './localApi';
