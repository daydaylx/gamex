/**
 * OpenRouter Client for AI Help and Report Generation
 */

import type { InterviewSession, InterviewSettings, ReportResult, ReportData } from "../types/interview";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_HELP_MODEL = "cognitivecomputations/dolphin-mistral-24b-venice-edition:free";
const DEFAULT_REPORT_MODEL = "nousresearch/hermes-4-70b";
const REQUEST_TIMEOUT = 25000; // 25 seconds
const MAX_RETRIES = 1;

// Storage key for settings
const SETTINGS_KEY = "gamex_interview_v1_settings";

/**
 * Load settings from localStorage
 */
export function loadInterviewSettings(): InterviewSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Save settings to localStorage
 */
export function saveInterviewSettings(settings: InterviewSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Help System Prompt
 */
const HELP_SYSTEM_PROMPT = `Du bist ein kurzer, neutraler Assistent für einen Fragebogen. 
Erkläre Begriffe einfach, gib Beispiele und hilf dem Nutzer zu verstehen, wie er antworten soll. 
Du entscheidest NICHT die Antwort für ihn. 
Antworte knapp (max. 8 Sätze), ohne moralische Wertung.`;

/**
 * Report System Prompt (JSON-focused)
 */
const REPORT_SYSTEM_PROMPT = `Du bist ein neutraler Auswertungs-Assistent für Fragebogen-Antworten von Paaren. 
Du fasst objektiv zusammen, beschreibst Unterschiede ohne Wertung, und gibst konkrete Gesprächsanlässe. 
Keine Diagnosen, keine Therapie, keine moralischen Urteile.

WICHTIG: Antworte AUSSCHLIESSLICH mit validem JSON. Kein Text davor oder danach.

JSON Schema:
{
  "summary": "string - 2-3 Sätze Zusammenfassung",
  "high_alignment": ["string array - Bereiche mit hoher Übereinstimmung"],
  "differences": [{"topic": "string", "personA": "string", "personB": "string", "note": "string"}],
  "conversation_starters": ["string array - Gesprächsanregungen"],
  "boundaries_and_safety": ["string array - Wichtige Grenzen"],
  "low_risk_experiments": ["string array - Sichere Experimente zum Ausprobieren"]
}`;

/**
 * Format session data for report generation
 */
function formatSessionForReport(session: InterviewSession): string {
  // Group answers by person
  const answersByPerson: Record<string, InterviewSession["answers"]> = {
    A: [],
    B: [],
  };

  for (const answer of session.answers) {
    if (answer.person === "A" || answer.person === "B") {
      answersByPerson[answer.person].push(answer);
    }
  }

  return `Analysiere die folgenden Interview-Antworten von zwei Personen.

Session ID: ${session.session_id}
Anzahl Antworten: ${session.answers.length}
Personen: ${session.people.join(", ")}

Antworten von Person A:
${JSON.stringify(answersByPerson.A, null, 2)}

Antworten von Person B:
${JSON.stringify(answersByPerson.B, null, 2)}

Bitte erstelle eine neutrale Auswertung als JSON gemäß dem Schema:
- summary: 2-3 Sätze Zusammenfassung
- high_alignment: Array von Bereichen mit hoher Übereinstimmung
- differences: Array von Objekten mit {topic, personA, personB, note}
- conversation_starters: Array von Gesprächsanregungen
- boundaries_and_safety: Array von wichtigen Grenzen
- low_risk_experiments: Array von sicheren Experimenten zum Ausprobieren`;
}

/**
 * Validate report schema
 */
function validateReportSchema(obj: unknown): obj is ReportData {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.summary === "string" &&
    Array.isArray(r.high_alignment) &&
    Array.isArray(r.differences) &&
    Array.isArray(r.conversation_starters) &&
    Array.isArray(r.boundaries_and_safety) &&
    Array.isArray(r.low_risk_experiments)
  );
}

/**
 * Parse report response with multiple fallback strategies
 */
function parseReportResponse(content: string): ReportResult {
  // 1. Try direct parsing
  try {
    const parsed = JSON.parse(content);
    if (validateReportSchema(parsed)) {
      return { success: true, data: parsed };
    }
  } catch {}

  // 2. Try extracting JSON from markdown block
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (validateReportSchema(parsed)) {
        return { success: true, data: parsed };
      }
    } catch {}
  }

  // 3. Try finding JSON anywhere in text (between first { and last })
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      if (validateReportSchema(parsed)) {
        return { success: true, data: parsed };
      }
    } catch {}
  }

  // 4. Fallback: Return raw text (UI should display it, not crash)
  return {
    success: false,
    rawText: content,
    error: "JSON konnte nicht geparst werden",
  };
}

/**
 * Make request with timeout and retry logic
 */
async function makeRequest(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: { responseFormat?: { type: string } } = {}
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
        },
        body: JSON.stringify({
          model,
          messages,
          ...options,
          temperature: 0.3, // Lower = more deterministic
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        // Retry on 502/503/504
        if ((status === 502 || status === 503 || status === 504) && attempt < MAX_RETRIES) {
          lastError = new Error(`Server error ${status}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      if (!content) {
        throw new Error("Empty response from API");
      }
      return content;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout after 25 seconds");
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Request failed");
}

/**
 * Ask for help (contextual assistance)
 */
export async function askHelp(
  context: {
    section?: string;
    scenario_id?: string;
    scenario_text?: string;
    answer_type?: string;
    help_text?: string;
    current_answer?: unknown;
  },
  userQuestion: string
): Promise<string> {
  const settings = loadInterviewSettings();
  const apiKey = settings.openrouter_api_key;
  const model = settings.help_model || DEFAULT_HELP_MODEL;

  if (!apiKey) {
    throw new Error("OpenRouter API Key nicht konfiguriert");
  }

  const contextPrompt = `Kontext:
${context.section ? `Bereich: ${context.section}\n` : ""}${context.scenario_text ? `Szenario: ${context.scenario_text}\n` : ""}${context.help_text ? `Hilfetext: ${context.help_text}\n` : ""}${context.answer_type ? `Antworttyp: ${context.answer_type}\n` : ""}

Frage des Nutzers: ${userQuestion}`;

  try {
    const content = await makeRequest(apiKey, model, [
      { role: "system", content: HELP_SYSTEM_PROMPT },
      { role: "user", content: contextPrompt },
    ]);

    // Log without sensitive data
    console.log("[OpenRouter Help] Response received");
    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("[OpenRouter Help] Error:", message);
    throw new Error(`KI-Hilfe fehlgeschlagen: ${message}`);
  }
}

/**
 * Generate report from session data
 */
export async function generateReport(session: InterviewSession): Promise<ReportResult> {
  const settings = loadInterviewSettings();
  const apiKey = settings.openrouter_api_key;
  const model = settings.report_model || DEFAULT_REPORT_MODEL;

  if (!apiKey) {
    throw new Error("OpenRouter API Key nicht konfiguriert");
  }

  try {
    const content = await makeRequest(
      apiKey,
      model,
      [
        { role: "system", content: REPORT_SYSTEM_PROMPT },
        { role: "user", content: formatSessionForReport(session) },
      ],
      {
        // JSON Mode (if model supports it)
        responseFormat: { type: "json_object" },
      }
    );

    // Log without sensitive data
    console.log("[OpenRouter Report] Response received");

    return parseReportResponse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("[OpenRouter Report] Error:", message);
    return {
      success: false,
      error: `Report-Generierung fehlgeschlagen: ${message}`,
    };
  }
}

