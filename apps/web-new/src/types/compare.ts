import type { ResponseValue } from './form';
import type { Question } from './template';

/**
 * Comparison types for matching responses
 */

export type MatchLevel = 'match' | 'partial' | 'mismatch' | 'incomplete';

export interface ComparisonResult {
  question_id: string;
  question: Question;
  match_level: MatchLevel;
  value_a: ResponseValue;
  value_b: ResponseValue;
  explanation?: string;
}

export interface CompareFilters {
  risk_levels?: string[];
  tags?: string[];
  match_levels?: MatchLevel[];
  modules?: string[];
  search?: string;
}

export interface CompareResponse {
  results: ComparisonResult[];
  summary: {
    total: number;
    matches: number;
    partial: number;
    mismatches: number;
    incomplete: number;
  };
}
