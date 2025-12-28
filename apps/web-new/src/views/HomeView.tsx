import { useState, useEffect } from "preact/hooks";
import { Plus, ChevronRight, Calendar, RefreshCw } from "lucide-preact";
import { Link } from "wouter-preact";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { CreateSessionDialog } from "../components/CreateSessionDialog";
import { listSessions } from "../services/api";
import type { SessionListItem } from "../types/session";

export function HomeView() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadSessionsData();
  }, []);

  async function loadSessionsData() {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Sessions");
    } finally {
      setLoading(false);
    }
  }

  function calculateProgress(session: SessionListItem): { a: number; b: number } {
    // Simplification: has_a/has_b means 100% or 0%
    return {
      a: session.has_a ? 100 : 0,
      b: session.has_b ? 100 : 0,
    };
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="space-y-4 py-4 md:py-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Intimacy. <span className="text-primary">Structured.</span>
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          Ein sicherer Raum für ehrliche Gespräche. Vergleiche Grenzen und Wünsche, ohne Druck.
          Deine Daten verlassen nie dein Gerät.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
          <Button size="lg" className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-5 w-5" /> Neue Session
          </Button>
          <Button size="lg" variant="outline">
            Mehr erfahren
          </Button>
        </div>
      </section>

      {/* Session List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Deine Sessions</h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={loadSessionsData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Lädt Sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Noch keine Sessions vorhanden</p>
            <p className="text-sm">Erstelle deine erste Session, um loszulegen.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sessions.map((session) => {
              const progress = calculateProgress(session);
              return (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <a className="block group">
                    <Card
                      variant="default"
                      className="transition-all hover:border-primary/50 hover:shadow-md card-interactive"
                    >
                      <CardHeader padding="comfortable" className="pb-2">
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                              {session.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs">
                                {new Date(session.created_at).toLocaleDateString("de-DE")}
                              </span>
                            </CardDescription>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent padding="comfortable">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={progress.a === 100 ? "default" : "secondary"}>
                            Person A: {progress.a}%
                          </Badge>
                          <Badge variant={progress.b === 100 ? "default" : "secondary"}>
                            Person B: {progress.b}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              );
            })}

            {/* New Session Card */}
            <Card
              variant="outlined"
              padding="none"
              onClick={() => setShowCreateDialog(true)}
              className="flex h-full min-h-[140px] w-full flex-col items-center justify-center border-dashed gap-3 text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <Plus className="h-8 w-8 opacity-50" />
              <span className="font-medium text-sm">Neue Session erstellen</span>
            </Card>
          </div>
        )}
      </section>

      {/* Create Session Dialog - Placeholder for now */}
      <CreateSessionDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={loadSessionsData}
      />
    </div>
  );
}
