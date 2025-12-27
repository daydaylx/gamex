/**
 * Ask AI Popup Component
 * Modal for asking AI questions with context
 */

import { useState } from "preact/hooks";
import { MessageCircle, X, Send, Loader2 } from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { askHelp, loadInterviewSettings } from "../../services/openrouter";
import type { InterviewScenario } from "../../types/interview";

interface AskAIPopupProps {
  scenario: InterviewScenario;
  currentAnswer?: unknown;
  open: boolean;
  onClose: () => void;
}

export function AskAIPopup({
  scenario,
  currentAnswer,
  open,
  onClose,
}: AskAIPopupProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settings = loadInterviewSettings();
  const hasApiKey = !!settings.openrouter_api_key;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!question.trim() || !hasApiKey) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const context = {
        section: scenario.section,
        scenario_id: scenario.id,
        scenario_text: scenario.scenario_text,
        answer_type: scenario.primary_answer_type,
        help_text: scenario.help_text,
        current_answer: currentAnswer,
      };

      const response = await askHelp(context, question.trim());
      setAnswer(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Abrufen der Antwort");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setQuestion("");
    setAnswer(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-2xl max-h-[80vh] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Frage an KI
                </CardTitle>
                <CardDescription>
                  Stelle eine Frage zu diesem Szenario
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="min-h-[44px] min-w-[44px]">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {/* API Key Warning */}
            {!hasApiKey && (
              <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Hinweis:</strong> OpenRouter API-Key nicht konfiguriert.
                Bitte konfiguriere den API-Key in den Einstellungen, um KI-Hilfe zu nutzen.
              </div>
            )}

            {/* Scenario Context (collapsed info) */}
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              <strong>Kontext:</strong> {scenario.section} • {scenario.title}
            </div>

            {/* Question Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="question" className="block text-sm font-medium mb-2">
                  Deine Frage
                </label>
                <textarea
                  id="question"
                  value={question}
                  onInput={(e) => setQuestion((e.target as HTMLTextAreaElement).value)}
                  disabled={loading || !hasApiKey}
                  placeholder="z.B. Was bedeutet 'Führung übernehmen' genau?"
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                disabled={!question.trim() || loading || !hasApiKey}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fragt KI...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Frage stellen
                  </>
                )}
              </Button>
            </form>

            {/* Answer */}
            {answer && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Antwort:</div>
                <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

