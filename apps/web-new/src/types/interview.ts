/**
 * Interview Mode Types
 * Schema Version: 1
 */

export const INTERVIEW_SCHEMA_VERSION = 2;

/**
 * Scenario (Szenario-Definition)
 */
export interface InterviewSceneChoice {
  id: string;
  label: string;
  next?: string;
  followup?: string;
  reaction_template?: string;
}

export interface InterviewSceneNode {
  id: string;
  prompt: string;
  choices: InterviewSceneChoice[];
  next?: string;
  followup?: string;
  reaction_template?: string;
}

export interface InterviewScenario {
  id: string;
  section: string;
  title: string;
  scenario_text: string;
  primary_answer_type: "likert5" | "yes_maybe_no";
  primary_label: string;
  help_text?: string;
  examples?: string[];
  tags: string[];
  risk_level: "low" | "medium" | "high";
  followup_rules?: {
    condition: "interest_high_comfort_low" | "skipped" | "boundary";
    followup_goal: string;
  };
  /**
   * Optional Story-Nodes für den Chat-Stream
   */
  scene_nodes?: InterviewSceneNode[];
  scene_entry?: string;
  reaction_templates?: {
    default?: string;
    followup?: string;
  };
}

/**
 * Scenarios File with versioning
 */
export interface InterviewScenariosFile {
  schema_version: number;
  scenarios: InterviewScenario[];
}

/**
 * Answer (Antwort pro Person pro Szenario)
 */
export interface InterviewAnswer {
  scenario_id: string;
  person: "A" | "B";
  primary: number | string; // number for likert5, string for yes_maybe_no
  emotion?: string[];
  comfort?: number; // 1-5
  continue_preference?: "ja" | "vielleicht" | "nein";
  conditions?: string;
  notes?: string;
  skipped: boolean;
  timestamp: string;
}

export interface InterviewSceneDecision {
  scenario_id: string;
  person: "A" | "B";
  node_id: string;
  choice_id: string;
  reaction?: string;
  timestamp: string;
}

/**
 * Session with versioning
 */
export interface InterviewSession {
  schema_version: number;
  session_id: string;
  people: ["A", "B"];
  scenario_order: string[];
  answers: InterviewAnswer[];
  scene_paths: InterviewSceneDecision[];
  progress: { current_index: number };
  created_at: string;
  updated_at: string;
}

/**
 * Interview Settings (API keys, models)
 */
export interface InterviewSettings {
  openrouter_api_key?: string;
  help_model?: string;
  report_model?: string;
}

/**
 * Follow-up rule evaluation result
 */
export interface FollowupResult {
  shouldTrigger: boolean;
  question?: string;
}

/**
 * Report data structure (from KI)
 */
export interface ReportData {
  summary: string;
  high_alignment: string[];
  differences: Array<{
    topic: string;
    personA: string;
    personB: string;
    note: string;
  }>;
  conversation_starters: string[];
  boundaries_and_safety: string[];
  low_risk_experiments: string[];
}

/**
 * Report result with parsing status
 */
export interface ReportResult {
  success: boolean;
  data?: ReportData;
  rawText?: string;
  error?: string;
}
