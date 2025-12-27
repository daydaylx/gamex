/**
 * AI-related type definitions for OpenRouter integration
 */

export interface AISettings {
  apiKey: string;
  helpModel: string;
  reportModel: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  timeout?: number;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenRouterChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIHelpRequest {
  questionId: string;
  questionText: string;
  sectionTitle?: string;
  helpText?: string;
  answerType: string;
  options?: string[] | Array<{ value: string; label: string }>;
  currentAnswer?: any;
  userQuestion: string;
}

export interface AIHelpResponse {
  answer: string;
}

export interface AIReportRequest {
  templateName: string;
  templateVersion: number;
  questions: Array<{
    id: string;
    text: string;
    schema: string;
    tags?: string[];
  }>;
  responsesA: Record<string, any>;
  responsesB: Record<string, any>;
}

export interface AIReportDifference {
  topic: string;
  personA: string;
  personB: string;
  note: string;
}

export interface AIReportResponse {
  summary: string;
  high_alignment: string[];
  differences: AIReportDifference[];
  conversation_starters: string[];
  boundaries_and_safety: string[];
}

