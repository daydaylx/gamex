import { callOpenRouter, extractResponseText } from "./openrouter";
import { getAISettings } from "../settings";
import type { AIHelpRequest, AIHelpResponse } from "../../types/ai";

const SYSTEM_PROMPT = `Du bist ein kurzer, neutraler Assistent für einen Fragebogen. Erkläre Begriffe einfach, gib Beispiele und hilf dem Nutzer zu verstehen, wie er antworten soll. Du entscheidest NICHT die Antwort für ihn. Antworte knapp (max. 8 Sätze), ohne moralische Wertung.`;

/**
 * Build context string from question data
 */
function buildContext(request: AIHelpRequest): string {
  const parts: string[] = [];

  if (request.sectionTitle) {
    parts.push(`Abschnitt: ${request.sectionTitle}`);
  }

  parts.push(`Frage-ID: ${request.questionId}`);
  parts.push(`Frage: ${request.questionText}`);

  if (request.helpText) {
    parts.push(`Hilfetext: ${request.helpText}`);
  }

  parts.push(`Antworttyp: ${request.answerType}`);

  if (request.options && request.options.length > 0) {
    const optionsList = request.options
      .map((opt) => {
        if (typeof opt === "string") return opt;
        return `${opt.value} (${opt.label})`;
      })
      .join(", ");
    parts.push(`Verfügbare Optionen: ${optionsList}`);
  }

  if (request.currentAnswer !== null && request.currentAnswer !== undefined) {
    const answerStr =
      typeof request.currentAnswer === "object"
        ? JSON.stringify(request.currentAnswer)
        : String(request.currentAnswer);
    parts.push(`Bisherige Antwort: ${answerStr}`);
  }

  return parts.join("\n");
}

/**
 * Ask AI for help with a question
 */
export async function askAIHelp(request: AIHelpRequest): Promise<AIHelpResponse> {
  const settings = getAISettings();

  if (!settings.apiKey || settings.apiKey.trim().length === 0) {
    throw new Error(
      "OpenRouter API-Key ist nicht konfiguriert. Bitte in den Einstellungen setzen."
    );
  }

  const context = buildContext(request);

  const userPrompt = `Kontext zur Frage:\n${context}\n\nNutzerfrage: ${request.userQuestion}`;

  const openRouterRequest = {
    model: settings.helpModel,
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
    temperature: 0.7,
    max_tokens: 500, // Limit response length
  };

  try {
    const response = await callOpenRouter(
      {
        apiKey: settings.apiKey,
        model: settings.helpModel,
      },
      openRouterRequest
    );

    const answer = extractResponseText(response);

    return {
      answer,
    };
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unbekannter Fehler bei KI-Hilfe-Anfrage");
  }
}
