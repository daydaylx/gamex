import type { InterviewAnswer } from "./interview";

export type MatchLevel = "MATCH" | "EXPLORE" | "BOUNDARY";

export interface ComparisonResult {
  question_id: string;
  label: string;
  schema: string;
  risk_level: string;
  module_id: string;
  pair_status: MatchLevel;

  // For consent_rating
  status_a: string | null;
  status_b: string | null;
  interest_a: number | null;
  interest_b: number | null;
  comfort_a: number | null;
  comfort_b: number | null;
  delta_interest: number | null;
  delta_comfort: number | null;

  // For other schemas (can be string, number, string[], object, etc.)
  value_a: unknown;
  value_b: unknown;

  // Flags
  flags: string[];
  flag_low_comfort_high_interest?: boolean;
  flag_discomfort?: boolean;

  // Display
  question_text?: string;
  help?: string;
  prompts?: string[];

  // Metadata - Full interview answer objects
  a?: InterviewAnswer;
  b?: InterviewAnswer;
}

export interface CompareSummary {
  total: number;
  match: number;
  explore: number;
  boundary: number;
}

export interface CompareResponse {
  items: ComparisonResult[];
  action_plan: string[];
  summary?: CompareSummary;
}
