import type { Person, YesMaybeNo } from './common';

/**
 * Form state and response types
 */

/**
 * ConsentRating response - the most complex question type
 */
export interface ConsentRatingValue {
  interest?: number; // 0-5
  dom_status?: YesMaybeNo;
  dom_conditions?: string;
  sub_status?: YesMaybeNo;
  sub_conditions?: string;
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
