/**
 * Comparison AI Popup Component
 * Modal for getting AI insights on comparison items
 */

import { useState } from "preact/hooks";
import { Sparkles, X, Send, Loader2, AlertCircle } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { hasAPIKey, getAISettings } from "../services/settings";
import { callOpenRouter, extractResponseText } from "../services/ai/openrouter";
import type { ComparisonResult } from "../types/compare";

interface ComparisonAIPopupProps {
  item: ComparisonResult;
  open: boolean;
  onClose: () => void;
}

const INSIGHT_SYSTEM_PROMPT = `Du bist ein empathischer Beziehungsberater, der Paaren hilft, ihre Unterschiede und Gemeinsamkeiten zu verstehen. Du gibst kurze, praktische Impulse ohne Wertung.

Antworte in deutscher Sprache. Deine Antworten sollten:
- Maximal 3-4 kurze Absätze sein
- Konkrete Gesprächsanlässe bieten
- Unterschiede als Chance zur Kommunikation darstellen
- Bei Grenzen diese respektvoll anerkennen
- Keine Diagnosen oder Therapie-Empfehlungen enthalten`;

export function ComparisonAIPopup({
  item,
  open,
  onClose,
}: ComparisonAIPopupProps) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");

  const apiKeyConfigured = hasAPIKey();

  async function generateInsight(customQ?: string) {
    if (!apiKeyConfigured) return;

    setLoading(true);
    setError(null);

    try {
      const settings = getAISettings();

      const statusLabel = item.pair_status === 'MATCH' ? 'Übereinstimmung'
        : item.pair_status === 'BOUNDARY' ? 'Grenze beachten'
        : 'Unterschiedlich';

      let context = `Thema: ${item.label}
Status: ${statusLabel}
Person A antwortet: ${formatValue(item.value_a || item.status_a)}
Person B antwortet: ${formatValue(item.value_b || item.status_b)}`;

      if (item.comfort_a !== null || item.comfort_b !== null) {
        context += `\nKomfort-Level: A=${item.comfort_a ?? '?'}/5, B=${item.comfort_b ?? '?'}/5`;
      }

      if (item.question_text) {
        context += `\nBeschreibung: ${item.question_text}`;
      }

      const userPrompt = customQ
        ? `${context}\n\nFrage des Nutzers: ${customQ}`
        : `${context}\n\nBitte gib einen kurzen, hilfreichen Impuls zu diesem Thema. Was könnten die beiden daraus lernen? Wie können sie darüber ins Gespräch kommen?`;

      const response = await callOpenRouter(
        {
          apiKey: settings.apiKey,
          model: settings.helpModel,
        },
        {
          model: settings.helpModel,
          messages: [
            { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }
      );

      const text = extractResponseText(response);
      setInsight(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Abrufen der KI-Analyse");
    } finally {
      setLoading(false);
    }
  }

  function handleAskCustom(e: Event) {
    e.preventDefault();
    if (customQuestion.trim()) {
      generateInsight(customQuestion.trim());
    }
  }

  function handleClose() {
    setInsight(null);
    setError(null);
    setCustomQuestion("");
    onClose();
  }

  if (!open) return null;

  const statusConfig = {
    MATCH: { color: "text-emerald-500", label: "Übereinstimmung" },
    EXPLORE: { color: "text-amber-500", label: "Diskussion" },
    BOUNDARY: { color: "text-red-500", label: "Grenze beachten" },
  }[item.pair_status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-lg max-h-[85vh] flex flex-col">
          <CardHeader className="flex-shrink-0 pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  KI-Analyse
                </CardTitle>
                <CardDescription className="mt-1">
                  Erhalte Impulse für euer Gespräch
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="min-h-[44px] min-w-[44px]">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {/* Item Context */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{item.label}</span>
                <span className={`text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Person A:</span>{" "}
                  <span className="font-medium">{formatValue(item.value_a || item.status_a)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Person B:</span>{" "}
                  <span className="font-medium">{formatValue(item.value_b || item.status_b)}</span>
                </div>
              </div>
            </div>

            {/* API Key Warning */}
            {!apiKeyConfigured && (
              <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Hinweis:</strong> OpenRouter API-Key nicht konfiguriert.
                Bitte konfiguriere den API-Key in den Einstellungen.
              </div>
            )}

            {/* Generate Button (if no insight yet) */}
            {!insight && !loading && apiKeyConfigured && (
              <Button
                onClick={() => generateInsight()}
                disabled={loading}
                className="w-full gap-2"
              >
                <Sparkles className="h-4 w-4" />
                KI-Impuls generieren
              </Button>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-sm text-muted-foreground">Analysiere...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Insight Result */}
            {insight && (
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {insight}
                  </div>
                </div>

                {/* Custom Question Form */}
                <form onSubmit={handleAskCustom} className="space-y-2">
                  <label htmlFor="customQuestion" className="text-xs font-medium text-muted-foreground">
                    Eigene Frage stellen:
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="customQuestion"
                      type="text"
                      value={customQuestion}
                      onInput={(e) => setCustomQuestion((e.target as HTMLInputElement).value)}
                      placeholder="z.B. Wie können wir damit umgehen?"
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={loading}
                    />
                    <Button type="submit" size="icon" disabled={!customQuestion.trim() || loading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>

                {/* Regenerate Button */}
                <Button
                  onClick={() => generateInsight()}
                  variant="outline"
                  disabled={loading}
                  className="w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Neuen Impuls generieren
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return "Keine Antwort";
  if (Array.isArray(val)) return val.join(", ");

  const translations: Record<string, string> = {
    'YES': 'Ja',
    'MAYBE': 'Vielleicht',
    'NO': 'Nein',
    'HARD_LIMIT': 'Tabu'
  };

  return translations[String(val).toUpperCase()] || String(val);
}
