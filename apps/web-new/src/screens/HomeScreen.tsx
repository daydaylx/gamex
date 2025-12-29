/**
 * Mobile-First Home Screen
 * Clear CTA, minimal navigation, recent sessions
 */

import { useState, useEffect } from "preact/hooks";
import { Plus, ChevronRight, Clock, Heart } from "lucide-preact";
import { Link, useLocation } from "wouter-preact";
import { Button } from "../components/ui/button";
import { CreateSessionDialog } from "../components/CreateSessionDialog";
import { getActiveSessions, getArchivedSessions } from "../services/api";
import { getAnsweredCount } from "../services/interview-storage";
import type { SessionListItem } from "../types/session";
import { SessionCardSkeleton } from "../components/ui/skeleton";

export function HomeScreen() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<SessionListItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const [active, archived] = await Promise.all([getActiveSessions(), getArchivedSessions()]);

      // Sort by most recent first
      active.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      archived.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSessions(active);
      setArchivedSessions(archived);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  // Get the most recent session
  const latestSession = sessions[0];
  const hasRecentSession = !!latestSession;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-icon animate-pulse-glow">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="hero-title">Intimacy Tool</h1>
          <p className="hero-subtitle">
            Ein klarer, sicherer Raum für ehrliche Gespräche über Wünsche und Grenzen.
          </p>
        </div>
      </header>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Neue Session</h2>
            <p className="section-subtitle">Starte eine neue Runde oder lade eine Person ein.</p>
          </div>
        </div>
        <Button size="lg" className="w-full gap-3" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-6 h-6" />
          Neue Session starten
        </Button>
      </section>

      {hasRecentSession && (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Zuletzt geöffnet</h2>
              <p className="section-subtitle">Schnell weitermachen, wo ihr aufgehört habt.</p>
            </div>
          </div>
          <button
            onClick={() => setLocation(`/sessions/${latestSession.id}`)}
            className="list-card w-full text-left card-interactive"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="list-card-title truncate">{latestSession.name}</p>
              <p className="list-card-meta">{formatDate(latestSession.created_at)}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        </section>
      )}

      {loading && (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Sessions</h2>
              <p className="section-subtitle">Lade deine aktuellen Sessions.</p>
            </div>
          </div>
          <div className="section-body">
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </div>
        </section>
      )}

      {!loading && sessions.length === 0 && (
        <section className="section-card">
          <div className="section-body text-center">
            <p className="section-subtitle">
              Noch keine Sessions vorhanden. Erstelle deine erste, um loszulegen.
            </p>
          </div>
        </section>
      )}

      {sessions.length > 1 && (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Alle Sessions</h2>
              <p className="section-subtitle">{sessions.length} Sessions verfügbar</p>
            </div>
          </div>
          <div className="section-body">
            {sessions.slice(1, 7).map((session) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <a className="list-card card-interactive">
                  <div className="flex-1 min-w-0">
                    <p className="list-card-title truncate">{session.name}</p>
                    <p className="list-card-meta">{formatDate(session.created_at)}</p>
                    <div className="flex gap-2 mt-3">
                      <StatusDot complete={session.has_a} label="A" sessionId={session.id} />
                      <StatusDot complete={session.has_b} label="B" sessionId={session.id} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
              </Link>
            ))}

            {sessions.length > 7 && (
              <div className="text-sm text-center text-muted-foreground">
                +{sessions.length - 7} weitere Sessions
              </div>
            )}
          </div>
        </section>
      )}

      {archivedSessions.length > 0 && !loading && (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Archiv</h2>
              <p className="section-subtitle">
                Ältere Sessions kannst du hier jederzeit wieder öffnen.
              </p>
            </div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showArchived ? "Ausblenden" : `Anzeigen (${archivedSessions.length})`}
            </button>
          </div>

          {showArchived && (
            <div className="section-body">
              {archivedSessions.map((session) => (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <a className="list-card card-interactive">
                    <div className="flex-1 min-w-0">
                      <p className="list-card-title truncate">{session.name}</p>
                      <p className="list-card-meta">
                        {formatDate(session.created_at)} • Archiviert
                      </p>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <CreateSessionDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          loadSessions();
        }}
      />
    </div>
  );
}

function StatusDot({
  complete,
  label,
  sessionId,
}: {
  complete: boolean;
  label: string;
  sessionId: string;
}) {
  const answeredCount = getAnsweredCount(sessionId, label as "A" | "B");

  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
        complete ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
      }`}
      title={`Person ${label}: ${complete ? `${answeredCount} Antworten` : "Ausstehend"}`}
    >
      {label}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;

  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}
