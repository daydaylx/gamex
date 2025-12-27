/**
 * Mobile-First Home Screen
 * Clear CTA, minimal navigation, recent sessions
 */

import { useState, useEffect } from "preact/hooks";
import { Plus, ChevronRight, Clock, Heart } from "lucide-preact";
import { Link, useLocation } from "wouter-preact";
import { Button } from "../components/ui/button";
import { CreateSessionDialog } from "../components/CreateSessionDialog";
import { listSessions } from "../services/api";
import type { SessionListItem } from "../types/session";

export function HomeScreen() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await listSessions();
      // Sort by most recent first
      data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSessions(data);
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
        <h1 className="text-display text-3xl mb-3 gradient-text">
          Intimacy. Structured.
        </h1>
        <p className="text-muted-foreground text-base max-w-xs mb-8 text-balance">
          Ein sicherer Raum für ehrliche Gespräche über Wünsche und Grenzen.
        </p>

        {/* Primary CTA */}
        <Button
          size="lg"
          className="w-full max-w-xs h-14 text-lg gap-3 animate-fade-in touch-feedback"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-6 h-6" />
          Neue Session starten
        </Button>

        {/* Quick access to recent session */}
        {hasRecentSession && (
          <div className="mt-6 w-full max-w-xs animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <button
              onClick={() => setLocation(`/sessions/${latestSession.id}`)}
              className="w-full p-4 rounded-xl bg-surface border border-border/50 flex items-center gap-3 card-interactive touch-feedback"
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
          <div className="space-y-2">
            {sessions.slice(1, 4).map((session, index) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <a
                  className="block p-3 rounded-lg bg-surface/50 border border-border/30 flex items-center gap-3 card-interactive touch-feedback animate-fade-in"
                  style={{ animationDelay: `${(index + 2) * 0.05}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <StatusDot complete={session.has_a} label="A" />
                    <StatusDot complete={session.has_b} label="B" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </a>
              </Link>
            ))}

            {sessions.length > 4 && (
              <p className="text-xs text-center text-muted-foreground py-2">
                +{sessions.length - 4} weitere Sessions
              </p>
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

      {/* Loading State */}
      {loading && (
        <div className="px-6 pb-8 text-center">
          <p className="text-sm text-muted-foreground animate-pulse">
            Lädt Sessions...
          </p>
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

function StatusDot({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
        complete
          ? "bg-primary text-primary-foreground"
          : "bg-muted/50 text-muted-foreground"
      }`}
      title={`Person ${label}: ${complete ? "Fertig" : "Ausstehend"}`}
    >
      {label}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;

  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

