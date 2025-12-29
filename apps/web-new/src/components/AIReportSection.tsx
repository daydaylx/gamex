import { useState, useEffect } from "preact/hooks";
import { Sparkles, Loader2, X, AlertCircle, Clock } from "lucide-preact";
import { Button } from "./ui/button";
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
    <section className="section-card">
      <div className="section-header">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="section-title">KI-Auswertung</p>
          </div>
          <p className="section-subtitle">
            Erstelle eine strukturierte Auswertung deiner Antworten mit Hilfe von KI.
          </p>
        </div>
        {isExpanded && (
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="section-body">
        {!isExpanded ? (
          <div className="space-y-3">
            <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
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
              <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isCached && cacheTimestamp && (
              <div className="list-card">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="list-card-meta">
                  Gespeicherte Auswertung vom{" "}
                  {new Date(cacheTimestamp).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-1">Fehler bei der Auswertung</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {rawText && !report?.summary && (
              <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4">
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

            {report && (
              <div className="space-y-4">
                {report.summary && (
                  <div className="list-card flex-col items-start">
                    <p className="list-card-title">Zusammenfassung</p>
                    <p className="list-card-meta whitespace-pre-wrap leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                )}

                {report.high_alignment && report.high_alignment.length > 0 && (
                  <div className="list-card flex-col items-start">
                    <p className="list-card-title">Hohe Übereinstimmung</p>
                    <div className="flex flex-wrap gap-2">
                      {report.high_alignment.map((item, idx) => (
                        <Badge key={idx} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {report.differences && report.differences.length > 0 && (
                  <div className="list-card flex-col items-start">
                    <p className="list-card-title">Unterschiede</p>
                    <div className="space-y-3 w-full">
                      {report.differences.map((diff, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-2"
                        >
                          <div className="font-medium text-sm">{diff.topic}</div>
                          <div className="grid gap-3 text-sm md:grid-cols-2">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                Person A
                              </div>
                              <div>{diff.personA}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                Person B
                              </div>
                              <div>{diff.personB}</div>
                            </div>
                          </div>
                          {diff.note && (
                            <div className="pt-2 border-t text-xs text-muted-foreground">
                              {diff.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.conversation_starters && report.conversation_starters.length > 0 && (
                  <div className="list-card flex-col items-start">
                    <p className="list-card-title">Gesprächsanlässe</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {report.conversation_starters.map((starter, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{starter}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.boundaries_and_safety && report.boundaries_and_safety.length > 0 && (
                  <div className="list-card flex-col items-start">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="list-card-title">Grenzen & Sicherheit</p>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {report.boundaries_and_safety.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-600 mt-1">⚠</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
            )}
          </div>
        )}
      </div>
    </section>
  );
}
