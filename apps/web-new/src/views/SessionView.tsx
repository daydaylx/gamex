import { useState, useEffect } from "preact/hooks";
import { Link, useRoute } from "wouter-preact";
import { ArrowLeft, User, Users, BarChart3, Layers } from "lucide-preact";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { getSessionInfo } from "../services/api";
import type { SessionInfo } from "../types/session";

export function SessionView() {
  const [match, params] = useRoute("/sessions/:id");
  const sessionId = match ? params!.id : "unknown";
  
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && sessionId !== "unknown") {
      loadSession();
    }
  }, [sessionId]);

  async function loadSession() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessionInfo(sessionId);
      setSession(data);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Session');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Lädt...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Fehler</h1>
          </div>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error || 'Session nicht gefunden'}
        </div>
      </div>
    );
  }

  const canCompare = session.has_a && session.has_b;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{session.name}</h1>
          <p className="text-sm text-muted-foreground">
            Erstellt am {new Date(session.created_at).toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>

      {/* Session Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Session-Übersicht</CardTitle>
          <CardDescription>Template: {session.template.name || session.template.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Person A Status */}
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="font-medium">Person A</h3>
                <Badge variant={session.has_a ? "default" : "secondary"} className="mt-2">
                  {session.has_a ? 'Abgeschlossen' : 'Ausstehend'}
                </Badge>
              </div>
            </div>

            {/* Person B Status */}
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="font-medium">Person B</h3>
                <Badge variant={session.has_b ? "default" : "secondary"} className="mt-2">
                  {session.has_b ? 'Abgeschlossen' : 'Ausstehend'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Questionnaire for Person A */}
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle className="text-lg">Fragebogen Person A</CardTitle>
            </div>
            <CardDescription>
              {session.has_a ? 'Antworten ansehen oder bearbeiten' : 'Fragebogen ausfüllen'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant={session.has_a ? "outline" : "default"}>
              {session.has_a ? 'Antworten bearbeiten' : 'Jetzt ausfüllen'}
            </Button>
          </CardContent>
        </Card>

        {/* Questionnaire for Person B */}
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle className="text-lg">Fragebogen Person B</CardTitle>
            </div>
            <CardDescription>
              {session.has_b ? 'Antworten ansehen oder bearbeiten' : 'Fragebogen ausfüllen'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant={session.has_b ? "outline" : "default"}>
              {session.has_b ? 'Antworten bearbeiten' : 'Jetzt ausfüllen'}
            </Button>
          </CardContent>
        </Card>

        {/* Comparison View */}
        <Card className={`${canCompare ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60'} transition-colors`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle className="text-lg">Vergleich</CardTitle>
            </div>
            <CardDescription>
              {canCompare ? 'Ergebnisse vergleichen und analysieren' : 'Beide Personen müssen den Fragebogen ausfüllen'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled={!canCompare}>
              Vergleich anzeigen
            </Button>
          </CardContent>
        </Card>

        {/* Scenarios Mode */}
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <CardTitle className="text-lg">Szenarien-Modus</CardTitle>
            </div>
            <CardDescription>
              Karten-basierte Fragen erkunden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Szenarien öffnen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Alle Daten werden nur lokal auf deinem Gerät gespeichert und verlassen es nie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}