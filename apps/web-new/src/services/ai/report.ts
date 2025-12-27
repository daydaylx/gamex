import { callOpenRouter, extractResponseText } from './openrouter';
import { getAISettings } from '../settings';
import type { AIReportRequest, AIReportResponse } from '../../types/ai';
import type { Template, Question } from '../../types/template';
import type { ResponseMap } from '../../types/form';

const SYSTEM_PROMPT = `Du bist ein neutraler Auswertungs-Assistent für Fragebogen-Antworten von Paaren. Du fasst objektiv zusammen, beschreibst Unterschiede ohne Wertung, und gibst konkrete Gesprächsanlässe. Keine Diagnosen, keine Therapie, keine moralischen Urteile. Antworte als valides JSON im vorgegebenen Schema. Keine zusätzlichen Texte außerhalb des JSON.

Das JSON-Schema ist:
{
  "summary": "kurze Zusammenfassung",
  "high_alignment": ["Thema ...", "Thema ..."],
  "differences": [
    {
      "topic": "...",
      "personA": "...",
      "personB": "...",
      "note": "..."
    }
  ],
  "conversation_starters": ["Frage 1 ...", "Frage 2 ..."],
  "boundaries_and_safety": ["Hinweis ...", "Hinweis ..."]
}

Wenn Informationen fehlen, setze leere Strings/Arrays, erfinde nichts.`;

/**
 * Format a response value for display in context
 */
function formatResponseValue(value: any, schema?: string): string {
  if (value === null || value === undefined) {
    return 'Keine Antwort';
  }
  
  if (schema === 'consent_rating' && typeof value === 'object') {
    const parts: string[] = [];
    if (value.status) parts.push(`Status: ${value.status}`);
    if (value.interest !== null && value.interest !== undefined) parts.push(`Interesse: ${value.interest}`);
    if (value.comfort !== null && value.comfort !== undefined) parts.push(`Komfort: ${value.comfort}`);
    return parts.join(', ') || 'Keine Antwort';
  }
  
  if (schema === 'scale' || schema === 'slider') {
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return String(value.value ?? 'Keine Antwort');
    }
  }
  
  if (schema === 'enum') {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return value.value ?? 'Keine Antwort';
    }
  }
  
  if (schema === 'multi') {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null && 'values' in value) {
      return Array.isArray(value.values) ? value.values.join(', ') : 'Keine Antwort';
    }
  }
  
  if (schema === 'text') {
    if (typeof value === 'object' && value !== null && 'text' in value) {
      return value.text ?? 'Keine Antwort';
    }
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  return String(value);
}

/**
 * Build context from template and responses
 */
function buildReportContext(
  template: Template,
  responsesA: ResponseMap,
  responsesB: ResponseMap
): string {
  const parts: string[] = [];
  
  parts.push(`Fragebogen: ${template.name} (Version ${template.version})`);
  parts.push('');
  
  // Collect all questions from modules
  const allQuestions: (Question & { moduleName?: string })[] = [];
  if (template.modules) {
    for (const module of template.modules) {
      if (module.questions) {
        for (const q of module.questions) {
          allQuestions.push({ ...q, moduleName: module.name });
        }
      }
    }
  }
  
  parts.push(`Anzahl Fragen: ${allQuestions.length}`);
  parts.push('');
  
  // Format questions and answers
  for (const question of allQuestions) {
    const answerA = responsesA[question.id];
    const answerB = responsesB[question.id];
    
    const questionText = question.text || question.label;
    const moduleInfo = question.moduleName ? `[${question.moduleName}] ` : '';
    
    parts.push(`${moduleInfo}Frage: ${questionText}`);
    parts.push(`  Schema: ${question.schema}`);
    if (question.tags && question.tags.length > 0) {
      parts.push(`  Tags: ${question.tags.join(', ')}`);
    }
    parts.push(`  Person A: ${formatResponseValue(answerA, question.schema)}`);
    parts.push(`  Person B: ${formatResponseValue(answerB, question.schema)}`);
    parts.push('');
  }
  
  return parts.join('\n');
}

/**
 * Try to parse and repair JSON response
 */
function parseJSONResponse(text: string): AIReportResponse | null {
  // First, try direct parsing
  try {
    const parsed = JSON.parse(text);
    return validateAndNormalizeReport(parsed);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        return validateAndNormalizeReport(parsed);
      } catch (e2) {
        // Ignore
      }
    }
    
    // Try to find JSON object in text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateAndNormalizeReport(parsed);
      } catch (e3) {
        // Ignore
      }
    }
    
    return null;
  }
}

/**
 * Validate and normalize report structure
 */
function validateAndNormalizeReport(data: any): AIReportResponse {
  return {
    summary: typeof data.summary === 'string' ? data.summary : '',
    high_alignment: Array.isArray(data.high_alignment) 
      ? data.high_alignment.filter((x: any) => typeof x === 'string')
      : [],
    differences: Array.isArray(data.differences)
      ? data.differences
          .filter((d: any) => d && typeof d === 'object')
          .map((d: any) => ({
            topic: typeof d.topic === 'string' ? d.topic : '',
            personA: typeof d.personA === 'string' ? d.personA : '',
            personB: typeof d.personB === 'string' ? d.personB : '',
            note: typeof d.note === 'string' ? d.note : '',
          }))
      : [],
    conversation_starters: Array.isArray(data.conversation_starters)
      ? data.conversation_starters.filter((x: any) => typeof x === 'string')
      : [],
    boundaries_and_safety: Array.isArray(data.boundaries_and_safety)
      ? data.boundaries_and_safety.filter((x: any) => typeof x === 'string')
      : [],
  };
}

/**
 * Generate AI report from template and responses
 */
export async function generateAIReport(
  template: Template,
  responsesA: ResponseMap,
  responsesB: ResponseMap
): Promise<{ report: AIReportResponse; rawText?: string }> {
  const settings = getAISettings();
  
  if (!settings.apiKey || settings.apiKey.trim().length === 0) {
    throw new Error('OpenRouter API-Key ist nicht konfiguriert. Bitte in den Einstellungen setzen.');
  }
  
  const context = buildReportContext(template, responsesA, responsesB);
  
  const userPrompt = `Bitte erstelle eine strukturierte Auswertung der folgenden Fragebogen-Antworten:\n\n${context}\n\nAntworte NUR mit validen JSON, keine zusätzlichen Texte.`;
  
  const openRouterRequest = {
    model: settings.reportModel,
    messages: [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user' as const,
        content: userPrompt,
      },
    ],
    temperature: 0.5, // Lower temperature for more structured output
    max_tokens: 2000,
  };
  
  try {
    const response = await callOpenRouter(
      {
        apiKey: settings.apiKey,
        model: settings.reportModel,
      },
      openRouterRequest
    );
    
    const rawText = extractResponseText(response);
    
    // Try to parse JSON
    const parsed = parseJSONResponse(rawText);
    
    if (parsed) {
      return { report: parsed };
    }
    
    // If parsing failed, return normalized structure with raw text
    return {
      report: {
        summary: '',
        high_alignment: [],
        differences: [],
        conversation_starters: [],
        boundaries_and_safety: [],
      },
      rawText,
    };
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unbekannter Fehler bei KI-Auswertung');
  }
}

