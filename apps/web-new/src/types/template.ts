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
  help?: string;
  options?: string[];
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
