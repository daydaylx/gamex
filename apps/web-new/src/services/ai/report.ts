import { callOpenRouter, extractResponseText } from "./openrouter";
import { getAISettings } from "../settings";
import type { AIReportResponse } from "../../types/ai";
import type { Template, Question } from "../../types/template";
import type { ResponseMap } from "../../types/form";
import type { ComparisonResult } from "../../types/compare";

/**
 * Extended report input with scenario comparisons
 */
export interface ExtendedReportInput {
  template: Template;
  responsesA: ResponseMap;
  responsesB: ResponseMap;
  scenarioComparisons?: ComparisonResult[];
}

const SYSTEM_PROMPT = `Du bist ein empathischer Auswertungs-Assistent für Paar-Fragebögen zu Intimität und Sexualität. Du fasst objektiv zusammen, beschreibst Unterschiede ohne Wertung, und gibst konkrete Gesprächsanlässe. Keine Diagnosen, keine Therapie, keine moralischen Urteile. Sei warm aber professionell. Antworte als valides JSON im vorgegebenen Schema. Keine zusätzlichen Texte außerhalb des JSON.

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
function formatResponseValue(value: unknown, schema?: string): string {
  if (value === null || value === undefined) {
    return "Keine Antwort";
  }

  if (schema === "consent_rating" && typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const parts: string[] = [];
    if (obj.status) parts.push(`Status: ${obj.status}`);
    if (obj.interest !== null && obj.interest !== undefined)
      parts.push(`Interesse: ${obj.interest}`);
    if (obj.comfort !== null && obj.comfort !== undefined)
      parts.push(`Komfort: ${obj.comfort}`);
    return parts.join(", ") || "Keine Antwort";
  }

  if (schema === "scale" || schema === "slider") {
    if (typeof value === "number") return String(value);
    if (typeof value === "object" && value !== null && "value" in value) {
      const obj = value as Record<string, unknown>;
      return String(obj.value ?? "Keine Antwort");
    }
  }

  if (schema === "enum") {
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null && "value" in value) {
      const obj = value as Record<string, unknown>;
      const val = obj.value;
      return typeof val === "string" ? val : "Keine Antwort";
    }
  }

  if (schema === "multi") {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object" && value !== null && "values" in value) {
      const obj = value as Record<string, unknown>;
      return Array.isArray(obj.values) ? obj.values.join(", ") : "Keine Antwort";
    }
  }

  if (schema === "text") {
    if (typeof value === "object" && value !== null && "text" in value) {
      const obj = value as Record<string, unknown>;
      const text = obj.text;
      return typeof text === "string" ? text : "Keine Antwort";
    }
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

/**
 * Build context from template and responses
 */
function buildReportContext(
  template: Template,
  responsesA: ResponseMap,
  responsesB: ResponseMap,
  scenarioComparisons?: ComparisonResult[]
): string {
  const parts: string[] = [];

  parts.push(`Fragebogen: ${template.name} (Version ${template.version})`);
  parts.push("");

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

  parts.push(`Anzahl Fragebogen-Fragen: ${allQuestions.length}`);
  parts.push("");

  // Format questions and answers
  for (const question of allQuestions) {
    const answerA = responsesA[question.id];
    const answerB = responsesB[question.id];

    const questionText = question.text || question.label;
    const moduleInfo = question.moduleName ? `[${question.moduleName}] ` : "";

    parts.push(`${moduleInfo}Frage: ${questionText}`);
    parts.push(`  Schema: ${question.schema}`);
    if (question.tags && question.tags.length > 0) {
      parts.push(`  Tags: ${question.tags.join(", ")}`);
    }
    parts.push(`  Person A: ${formatResponseValue(answerA, question.schema)}`);
    parts.push(`  Person B: ${formatResponseValue(answerB, question.schema)}`);
    parts.push("");
  }

  // Add scenario comparisons if available
  if (scenarioComparisons && scenarioComparisons.length > 0) {
    parts.push("---");
    parts.push("SZENARIEN-VERGLEICH (Hypothetische Situationen und Interview-Antworten)");
    parts.push(`Anzahl Szenarien: ${scenarioComparisons.length}`);
    parts.push("");

    for (const scenario of scenarioComparisons) {
      const statusLabel =
        scenario.pair_status === "MATCH"
          ? "Übereinstimmung"
          : scenario.pair_status === "BOUNDARY"
            ? "Grenze beachten"
            : "Unterschiedlich";

      parts.push(`Szenario: ${scenario.label}`);
      if (scenario.question_text) {
        parts.push(`  Beschreibung: ${scenario.question_text.substring(0, 200)}...`);
      }
      parts.push(`  Status: ${statusLabel}`);
      parts.push(`  Person A wählt: Option ${scenario.value_a || "keine"}`);
      parts.push(`  Person B wählt: Option ${scenario.value_b || "keine"}`);
      if (scenario.comfort_a !== null || scenario.comfort_b !== null) {
        parts.push(`  Komfort: A=${scenario.comfort_a ?? "?"}/5, B=${scenario.comfort_b ?? "?"}/5`);
      }

      // Include detailed interview answer data if available
      const answerA = scenario.a;
      const answerB = scenario.b;

      if (answerA || answerB) {
        // Emotions
        if (
          (answerA?.emotion && answerA.emotion.length > 0) ||
          (answerB?.emotion && answerB.emotion.length > 0)
        ) {
          parts.push(`  Emotionen:`);
          if (answerA?.emotion && answerA.emotion.length > 0)
            parts.push(`    A: ${answerA.emotion.join(", ")}`);
          if (answerB?.emotion && answerB.emotion.length > 0)
            parts.push(`    B: ${answerB.emotion.join(", ")}`);
        }

        // Conditions
        if (answerA?.conditions || answerB?.conditions) {
          parts.push(`  Bedingungen:`);
          if (answerA?.conditions) parts.push(`    A: ${answerA.conditions}`);
          if (answerB?.conditions) parts.push(`    B: ${answerB.conditions}`);
        }

        // Notes
        if (answerA?.notes || answerB?.notes) {
          parts.push(`  Notizen:`);
          if (answerA?.notes) parts.push(`    A: ${answerA.notes}`);
          if (answerB?.notes) parts.push(`    B: ${answerB.notes}`);
        }

        // Continue preference
        if (answerA?.continue_preference || answerB?.continue_preference) {
          parts.push(`  Weitermachen-Präferenz:`);
          if (answerA?.continue_preference) parts.push(`    A: ${answerA.continue_preference}`);
          if (answerB?.continue_preference) parts.push(`    B: ${answerB.continue_preference}`);
        }
      }

      parts.push("");
    }
  }

  return parts.join("\n");
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
function validateAndNormalizeReport(data: unknown): AIReportResponse {
  // Type guard for data object
  if (typeof data !== "object" || data === null) {
    return {
      summary: "",
      high_alignment: [],
      differences: [],
      conversation_starters: [],
      boundaries_and_safety: [],
    };
  }

  const obj = data as Record<string, unknown>;

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    high_alignment: Array.isArray(obj.high_alignment)
      ? obj.high_alignment.filter((x: unknown): x is string => typeof x === "string")
      : [],
    differences: Array.isArray(obj.differences)
      ? obj.differences
          .filter((d: unknown): d is Record<string, unknown> => d !== null && typeof d === "object")
          .map((d) => ({
            topic: typeof d.topic === "string" ? d.topic : "",
            personA: typeof d.personA === "string" ? d.personA : "",
            personB: typeof d.personB === "string" ? d.personB : "",
            note: typeof d.note === "string" ? d.note : "",
          }))
      : [],
    conversation_starters: Array.isArray(obj.conversation_starters)
      ? obj.conversation_starters.filter((x: unknown): x is string => typeof x === "string")
      : [],
    boundaries_and_safety: Array.isArray(obj.boundaries_and_safety)
      ? obj.boundaries_and_safety.filter((x: unknown): x is string => typeof x === "string")
      : [],
  };
}

/**
 * Generate AI report from template and responses
 */
export async function generateAIReport(
  template: Template,
  responsesA: ResponseMap,
  responsesB: ResponseMap,
  scenarioComparisons?: ComparisonResult[]
): Promise<{ report: AIReportResponse; rawText?: string }> {
  const settings = getAISettings();

  if (!settings.apiKey || settings.apiKey.trim().length === 0) {
    throw new Error(
      "OpenRouter API-Key ist nicht konfiguriert. Bitte in den Einstellungen setzen."
    );
  }

  const context = buildReportContext(template, responsesA, responsesB, scenarioComparisons);

  const userPrompt = `Bitte erstelle eine strukturierte Auswertung der folgenden Fragebogen-Antworten:\n\n${context}\n\nAntworte NUR mit validen JSON, keine zusätzlichen Texte.`;

  const openRouterRequest = {
    model: settings.reportModel,
    messages: [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT,
      },
      {
        role: "user" as const,
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
        summary: "",
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
    throw new Error("Unbekannter Fehler bei KI-Auswertung");
  }
}
