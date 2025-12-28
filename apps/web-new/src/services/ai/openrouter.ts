import type { OpenRouterRequest, OpenRouterResponse, OpenRouterConfig } from "../../types/ai";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_TIMEOUT = 25000; // 25 seconds

/**
 * Sanitize API key for logging (show only first 8 and last 4 characters)
 */
function sanitizeApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) return "***";
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Call OpenRouter API with retry logic and error handling
 */
export async function callOpenRouter(
  config: OpenRouterConfig,
  request: OpenRouterRequest
): Promise<OpenRouterResponse> {
  const { apiKey, model, timeout = DEFAULT_TIMEOUT } = config;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "OpenRouter API-Key ist nicht konfiguriert. Bitte in den Einstellungen setzen."
    );
  }

  // Override model from config if provided
  const finalRequest: OpenRouterRequest = {
    ...request,
    model: model || request.model,
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": window.location.origin,
    "X-Title": "GameX Intimacy Tool",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;
  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[OpenRouter] Calling API (attempt ${attempt + 1}/${maxRetries + 1})`, {
        model: finalRequest.model,
        apiKey: sanitizeApiKey(apiKey),
        messageCount: finalRequest.messages.length,
      });

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(finalRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const _errorText = await response.text().catch(() => "Unknown error");
        void _errorText; // Reserved for detailed error logging
        let errorMessage = `OpenRouter API Fehler: ${response.status}`;

        // Handle specific error codes
        if (response.status === 401) {
          errorMessage =
            "API-Key ist ungültig oder abgelaufen. Bitte in den Einstellungen überprüfen.";
        } else if (response.status === 429) {
          errorMessage = "Rate Limit erreicht. Bitte später erneut versuchen.";
        } else if (response.status === 402) {
          errorMessage = "OpenRouter Account hat keine Credits mehr.";
        } else if (response.status >= 500) {
          // Retry on server errors
          if (
            attempt < maxRetries &&
            (response.status === 502 || response.status === 503 || response.status === 504)
          ) {
            console.warn(`[OpenRouter] Server error ${response.status}, retrying...`);
            lastError = new Error(errorMessage);
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            continue;
          }
        }

        throw new Error(errorMessage);
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenRouter API hat keine Antwort zurückgegeben");
      }

      console.log(`[OpenRouter] Success`, {
        model: data.model,
        tokens: data.usage?.total_tokens,
      });

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error(`Anfrage-Timeout nach ${timeout}ms. Bitte erneut versuchen.`);
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Netzwerkfehler. Bitte Internetverbindung überprüfen.");
      }

      // If this was a retry attempt and we still have retries left, continue
      if (attempt < maxRetries && error.message && error.message.includes("502|503|504")) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      // Re-throw if it's already a formatted error
      if (error.message && !error.message.includes("OpenRouter API")) {
        throw error;
      }

      // Otherwise, wrap it
      throw new Error(error.message || "Unbekannter Fehler bei OpenRouter API-Anfrage");
    }
  }

  // If we exhausted retries, throw last error
  throw lastError || new Error("OpenRouter API-Anfrage fehlgeschlagen");
}

/**
 * Extract text content from OpenRouter response
 */
export function extractResponseText(response: OpenRouterResponse): string {
  if (!response.choices || response.choices.length === 0) {
    throw new Error("Keine Antwort in OpenRouter Response gefunden");
  }

  const content = response.choices[0].message?.content;
  if (!content) {
    throw new Error("Leere Antwort von OpenRouter API");
  }

  return content.trim();
}
