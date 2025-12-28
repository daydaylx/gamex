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
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Logo/Icon */}
        <div className="mb-6 animate-pulse-glow">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Heart className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-display text-3xl mb-3 gradient-text">Intimacy. Structured.</h1>
        <p className="text-muted-foreground text-base max-w-xs mb-8 text-balance">
          Ein sicherer Raum für ehrliche Gespräche über Wünsche und Grenzen.
        </p>

        {/* Primary CTA */}
        <Button
          size="lg"
          className="w-full max-w-sm sm:max-w-md h-14 text-lg gap-3 animate-fade-in"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-6 h-6" />
          Neue Session starten
        </Button>

        {/* Quick access to recent session */}
        {hasRecentSession && (
          <div
            className="mt-6 w-full max-w-sm sm:max-w-md animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <button
              onClick={() => setLocation(`/sessions/${latestSession.id}`)}
              className="w-full p-4 rounded-xl bg-surface border border-border/50 flex items-center gap-3 card-interactive"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm text-muted-foreground">Zuletzt geöffnet</p>
                <p className="font-medium truncate">{latestSession.name}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}
      </section>

      {/* Sessions List (if more than one) */}
      {sessions.length > 1 && (
        <section className="px-4 pb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-2">
            Alle Sessions ({sessions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.slice(1, 7).map((session, index) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <a
                  className="block p-4 rounded-xl bg-surface/50 border border-border/30 flex items-center gap-3 card-interactive animate-fade-in"
                  style={{ animationDelay: `${(index + 2) * 0.05}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(session.created_at)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <StatusDot complete={session.has_a} label="A" sessionId={session.id} />
                      <StatusDot complete={session.has_b} label="B" sessionId={session.id} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
              </Link>
            ))}

            {sessions.length > 7 && (
              <div className="col-span-full">
                <p className="text-xs text-center text-muted-foreground py-2">
                  +{sessions.length - 7} weitere Sessions
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <section className="px-6 pb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Noch keine Sessions. Erstelle deine erste, um loszulegen.
          </p>
        </section>
      )}

      {/* Archived Sessions Toggle */}
      {archivedSessions.length > 0 && !loading && (
        <section className="px-4 pb-6">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showArchived ? "Archiv ausblenden" : `Archiv anzeigen (${archivedSessions.length})`}
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {archivedSessions.map((session) => (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <a className="block p-4 rounded-xl bg-surface/30 border border-border/20 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{session.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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

      {/* Loading State */}
      {loading && (
        <div className="px-4 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <SessionCardSkeleton />
          <SessionCardSkeleton />
          <SessionCardSkeleton />
        </div>
      )}

      {/* Create Session Dialog */}
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
