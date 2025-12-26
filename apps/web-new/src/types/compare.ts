import type { ResponseValue } from './form';
import type { QuestionSchema, RiskLevel } from './common';

/**
 * Comparison types for matching responses
 */

export type MatchLevel = 'MATCH' | 'EXPLORE' | 'BOUNDARY';

export interface ComparisonResult {
  question_id: string;
  label: string;
  schema: QuestionSchema;
  risk_level: RiskLevel;
  module_id: string;
  pair_status: MatchLevel;
  status_a: string | null;
  status_b: string | null;
  interest_a: number | null;
  interest_b: number | null;
  comfort_a: number | null;
  comfort_b: number | null;
  value_a: ResponseValue;
  value_b: ResponseValue;
  delta_interest: number | null;
  delta_comfort: number | null;
  flags: string[];
}

export interface CompareFilters {
  risk_levels?: string[];
  tags?: string[];
  match_levels?: MatchLevel[];
  modules?: string[];
  search?: string;
}

export interface CompareResponse {
  items: ComparisonResult[];
  action_plan: string[];
}
