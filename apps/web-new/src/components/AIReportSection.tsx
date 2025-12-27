import { useState, useEffect } from "preact/hooks";
import { Sparkles, Loader2, X, AlertCircle, Clock } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { generateAIReport } from "../services/ai/report";
import { hasAPIKey } from "../services/settings";
import type { AIReportResponse } from "../types/ai";
import type { Template } from "../types/template";
import type { ResponseMap } from "../types/form";
import type { ComparisonResult } from "../types/compare";

const CACHE_PREFIX = "gamex:ai-report:";

interface CachedReport {
  report: AIReportResponse;
  timestamp: string;
}

function getCachedReport(sessionId: string): CachedReport | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${sessionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function setCachedReport(sessionId: string, report: AIReportResponse): void {
  try {
    const cacheEntry: CachedReport = {
      report,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${sessionId}`, JSON.stringify(cacheEntry));
  } catch {
    // Storage might be full
  }
}

interface AIReportSectionProps {
  sessionId: string;
  template: Template;
  responsesA: ResponseMap;
  responsesB: ResponseMap;
  scenarioComparisons?: ComparisonResult[];
}

export function AIReportSection({
  sessionId,
  template,
  responsesA,
  responsesB,
  scenarioComparisons,
}: AIReportSectionProps) {
  const [report, setReport] = useState<AIReportResponse | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);

  // Load cached report on mount
  useEffect(() => {
    const cached = getCachedReport(sessionId);
    if (cached) {
      setReport(cached.report);
      setCacheTimestamp(cached.timestamp);
      setIsCached(true);
      setIsExpanded(true);
    }
  }, [sessionId]);

  async function handleGenerate() {
    if (!hasAPIKey()) {
      setError("OpenRouter API-Key ist nicht konfiguriert. Bitte in den Einstellungen setzen.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setRawText(null);
    setIsCached(false);

    try {
      const result = await generateAIReport(template, responsesA, responsesB, scenarioComparisons);
      setReport(result.report);
      setRawText(result.rawText || null);
      setIsExpanded(true);

      // Cache the report for later use
      if (result.report) {
        setCachedReport(sessionId, result.report);
        setCacheTimestamp(new Date().toISOString());
      }
    } catch (err) {
      console.error("AI Report error:", err);
      setError(err instanceof Error ? err.message : "Fehler bei KI-Auswertung");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setIsExpanded(false);
    setReport(null);
    setRawText(null);
    setError(null);
    setIsCached(false);
    setCacheTimestamp(null);
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">KI-gestützte Auswertung</CardTitle>
          </div>
          {isExpanded && (
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Erstelle eine strukturierte Auswertung deiner Antworten mit Hilfe von KI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExpanded ? (
          <div className="space-y-3">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Erstelle Auswertung...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  KI-Auswertung erstellen
                </>
              )}
            </Button>
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cached Indicator */}
            {isCached && cacheTimestamp && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Clock className="h-3 w-3" />
                <span>
                  Gespeicherte Auswertung vom{" "}
                  {new Date(cacheTimestamp).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-1">Fehler bei der Auswertung</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Raw Text Fallback (if JSON parsing failed) */}
            {rawText && !report?.summary && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="font-medium text-sm text-yellow-800">
                    JSON-Parsing fehlgeschlagen. Rohtext:
                  </div>
                </div>
                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                  {rawText}
                </pre>
              </div>
            )}

            {/* Report Content */}
            {report && (
              <div className="space-y-6">
                {/* Summary */}
                {report.summary && (
                  <div>
                    <h3 className="font-semibold text-base mb-2">Zusammenfassung</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                )}

                {/* High Alignment */}
                {report.high_alignment && report.high_alignment.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-base mb-2">Hohe Übereinstimmung</h3>
                    <div className="flex flex-wrap gap-2">
                      {report.high_alignment.map((item, idx) => (
                        <Badge key={idx} variant="default">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Differences */}
                {report.differences && report.differences.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-base mb-2">Unterschiede</h3>
                    <div className="space-y-3">
                      {report.differences.map((diff, idx) => (
                        <Card key={idx} className="border-l-4 border-l-yellow-500">
                          <CardContent className="pt-4">
                            <div className="font-medium text-sm mb-2">{diff.topic}</div>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="font-medium text-muted-foreground mb-1">Person A:</div>
                                <div>{diff.personA}</div>
                              </div>
                              <div>
                                <div className="font-medium text-muted-foreground mb-1">Person B:</div>
                                <div>{diff.personB}</div>
                              </div>
                            </div>
                            {diff.note && (
                              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                {diff.note}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Starters */}
                {report.conversation_starters && report.conversation_starters.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-base mb-2">Gesprächsanlässe</h3>
                    <ul className="space-y-2">
                      {report.conversation_starters.map((starter, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{starter}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Boundaries and Safety */}
                {report.boundaries_and_safety && report.boundaries_and_safety.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Grenzen & Sicherheit
                    </h3>
                    <ul className="space-y-2">
                      {report.boundaries_and_safety.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-600 mt-1">⚠</span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Regenerate Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Erstelle neu...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Auswertung neu erstellen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

