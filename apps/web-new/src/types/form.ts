import type { Person, YesMaybeNo } from './common';

/**
 * Form state and response types
 */

/**
 * ConsentRating response - the most complex question type
 * Supports three variants: standard, dom/sub, active/passive
 */
export interface ConsentRatingValue {
  // Standard variant
  status?: YesMaybeNo | 'HARD_LIMIT';
  interest?: number; // 0-4
  comfort?: number; // 0-4
  conditions?: string;

  // Dom/Sub variant
  dom_status?: YesMaybeNo | 'HARD_LIMIT';
  dom_interest?: number; // 0-4
  dom_comfort?: number; // 0-4
  dom_conditions?: string;
  sub_status?: YesMaybeNo | 'HARD_LIMIT';
  sub_interest?: number; // 0-4
  sub_comfort?: number; // 0-4
  sub_conditions?: string;

  // Active/Passive variant
  active_status?: YesMaybeNo | 'HARD_LIMIT';
  active_interest?: number; // 0-4
  active_comfort?: number; // 0-4
  active_conditions?: string;
  passive_status?: YesMaybeNo | 'HARD_LIMIT';
  passive_interest?: number; // 0-4
  passive_comfort?: number; // 0-4
  passive_conditions?: string;

  // Legacy
  hard_no?: boolean;
}

/**
 * Generic response value - can be any question response
 */
export type ResponseValue =
  | ConsentRatingValue
  | number
  | string
  | boolean
  | string[]
  | null
  | undefined;

/**
 * Response map for all questions
 */
export type ResponseMap = Record<string, ResponseValue>;

/**
 * Form metadata
 */
export interface FormMetadata {
  session_id: string;
  person: Person;
  last_saved?: string;
  is_dirty: boolean;
  current_module?: string;
  current_question?: string;
}
