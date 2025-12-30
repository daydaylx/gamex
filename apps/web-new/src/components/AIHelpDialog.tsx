import { useState } from "preact/hooks";
import { MessageCircle, X, Send, Loader2 } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { askAIHelp } from "../services/ai/help";
import { hasAPIKey } from "../services/settings";
import type { AIHelpRequest } from "../types/ai";
import type { Question } from "../types/template";

interface AIHelpDialogProps {
  question: Question;
  sectionTitle?: string;
  currentAnswer?: unknown;
  className?: string;
}

export function AIHelpDialog({
  question,
  sectionTitle,
  currentAnswer,
  className = "",
}: AIHelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!userQuestion.trim()) {
      setError("Bitte gib eine Frage ein.");
      return;
    }

    if (!hasAPIKey()) {
      setError("OpenRouter API-Key ist nicht konfiguriert. Bitte in den Einstellungen setzen.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const request: AIHelpRequest = {
        questionId: question.id,
        questionText: question.text || question.label,
        sectionTitle,
        helpText: question.help,
        answerType: question.schema,
        options: question.options,
        currentAnswer,
        userQuestion: userQuestion.trim(),
      };

      const response = await askAIHelp(request);
      setAnswer(response.answer);
      setUserQuestion(""); // Clear input after successful submission
    } catch (err) {
      console.error("AI Help error:", err);
      setError(err instanceof Error ? err.message : "Fehler bei KI-Anfrage");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setUserQuestion("");
    setAnswer(null);
    setError(null);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Help Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[44px] min-w-[44px] rounded-full hover:bg-primary/10"
        aria-label="Frage an KI"
        title="Frage an KI stellen"
      >
        <MessageCircle className="h-5 w-5 text-primary" />
      </Button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClose} />

          {/* Dialog Card */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <Card variant="elevated" className="border-2 flex flex-col max-h-[90vh]">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">Frage an KI</CardTitle>
                    <CardDescription className="mt-1">
                      Stelle eine Frage zur aktuellen Fragebogen-Frage. Die KI hilft dir beim
                      Verständnis, entscheidet aber nicht für dich.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Question Context (read-only) */}
                <div className="p-3 bg-muted rounded-md text-sm">
                  <div className="font-medium mb-1">Aktuelle Frage:</div>
                  <div className="text-muted-foreground">{question.text || question.label}</div>
                </div>

                {/* User Input */}
                <div className="space-y-2 flex-shrink-0">
                  <label htmlFor="ai-help-question" className="text-sm font-medium">
                    Deine Frage:
                  </label>
                  <textarea
                    id="ai-help-question"
                    value={userQuestion}
                    onInput={(e) => setUserQuestion((e.target as HTMLTextAreaElement).value)}
                    onKeyDown={handleKeyDown}
                    placeholder="z.B. 'Was bedeutet diese Frage genau?' oder 'Wie soll ich hier antworten?'"
                    className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    disabled={loading}
                  />
                  <div className="text-xs text-muted-foreground">
                    Tipp: Strg/Cmd + Enter zum Senden
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end flex-shrink-0">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !userQuestion.trim()}
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Lädt...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Senden
                      </>
                    )}
                  </Button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex-shrink-0">
                    {error}
                  </div>
                )}

                {/* Answer Display */}
                {answer && (
                  <div className="flex-1 overflow-y-auto flex-shrink min-h-0">
                    <div className="p-4 bg-muted rounded-md">
                      <div className="font-medium mb-2 text-sm">KI-Antwort:</div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{answer}</div>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-2 border-t flex-shrink-0">
                  <Button variant="outline" onClick={handleClose}>
                    Schließen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
