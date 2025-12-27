import type { QuestionSchema, RiskLevel, Tag } from './common';

/**
 * Template types for questionnaire structure
 */

export interface TemplateListItem {
  id: string;
  name: string;
  version: number;
}

export interface Question {
  id: string;
  schema: QuestionSchema;
  risk_level: RiskLevel;
  tags: Tag[];
  label: string;
  text?: string; // Alternative field for question text
  help?: string;
  info_details?: string; // Detailed explanation for the question
  examples?: string[]; // Examples to show in info popover
  options?: string[] | Array<{ value: string; label: string }>; // Support both formats
  min?: number; // For scale questions
  max?: number; // For scale questions
  labels?: { min?: string; max?: string }; // For scale questions
}

export interface Module {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

export interface Template {
  id: string;
  name: string;
  version: number;
  modules: Module[];
}
