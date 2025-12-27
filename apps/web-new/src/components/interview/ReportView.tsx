/**
 * Report View Component
 * Displays AI-generated report with JSON parsing fallback
 */

import { useState } from "preact/hooks";
import { FileText, Loader2, AlertCircle } from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { generateReport } from "../../services/openrouter";
import type { InterviewSession, ReportData } from "../../types/interview";

interface ReportViewProps {
  session: InterviewSession;
  onClose?: () => void;
}

export function ReportView({ session, onClose }: ReportViewProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateReport() {
    setLoading(true);
    setError(null);
    setReport(null);
    setRawText(null);

    try {
      const result = await generateReport(session);

      if (result.success && result.data) {
        setReport(result.data);
      } else {
        // Fallback: Show raw text
        setRawText(result.rawText || "Keine Antwort erhalten");
        setError(result.error || "Report konnte nicht geparst werden");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Generieren des Reports");
    } finally {
      setLoading(false);
    }
  }

  if (report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">KI-Auswertung</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Schließen
            </Button>
          )}
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{report.summary}</p>
          </CardContent>
        </Card>

        {/* High Alignment */}
        {report.high_alignment && report.high_alignment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hohe Übereinstimmung</CardTitle>
              <CardDescription>Bereiche, in denen ihr euch einig seid</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.high_alignment.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Differences */}
        {report.differences && report.differences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Unterschiede</CardTitle>
              <CardDescription>Bereiche, die besprochen werden sollten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.differences.map((diff, idx) => (
                <div key={idx} className="border-l-2 border-primary/30 pl-4 space-y-2">
                  <div className="font-medium text-foreground">{diff.topic}</div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground font-medium">Person A:</div>
                      <div className="text-foreground">{diff.personA}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Person B:</div>
                      <div className="text-foreground">{diff.personB}</div>
                    </div>
                  </div>
                  {diff.note && (
                    <div className="text-sm text-muted-foreground italic">{diff.note}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Conversation Starters */}
        {report.conversation_starters && report.conversation_starters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gesprächsanregungen</CardTitle>
              <CardDescription>Ideen für eure Gespräche</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.conversation_starters.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">💬</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Boundaries and Safety */}
        {report.boundaries_and_safety && report.boundaries_and_safety.length > 0 && (
          <Card className="border-yellow-500/50">
            <CardHeader>
              <CardTitle>Grenzen & Sicherheit</CardTitle>
              <CardDescription>Wichtige Punkte zu beachten</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.boundaries_and_safety.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">⚠️</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Low Risk Experiments */}
        {report.low_risk_experiments && report.low_risk_experiments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sichere Experimente</CardTitle>
              <CardDescription>Vorschläge zum Ausprobieren</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.low_risk_experiments.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (rawText) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">KI-Auswertung</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Schließen
            </Button>
          )}
        </div>

        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Report konnte nicht geparst werden
            </CardTitle>
            <CardDescription>
              Die KI-Antwort wurde erhalten, konnte aber nicht als strukturiertes JSON interpretiert werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap font-mono">
              {rawText}
            </div>
            {error && (
              <div className="mt-4 text-sm text-muted-foreground">
                Fehler: {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleGenerateReport} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generiert...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Erneut versuchen
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">KI-Auswertung</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Schließen
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auswertung generieren</CardTitle>
          <CardDescription>
            Eine KI analysiert eure Antworten und erstellt eine strukturierte Auswertung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generiert Auswertung...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                KI-Auswertung erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

