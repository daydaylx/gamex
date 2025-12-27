/**
 * Session View - Mobile Optimized
 * Shows session details and actions
 */

import { useState, useEffect } from "preact/hooks";
import { Link, useRoute, useLocation } from "wouter-preact";
import { ArrowLeft, User, Users, MessageSquare, ChevronRight } from "lucide-preact";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { getSessionInfo } from "../services/api";
import type { SessionInfo } from "../types/session";

export function SessionView() {
  const [match, params] = useRoute<{ id: string }>("/sessions/:id");
  const [, setLocation] = useLocation();
  const sessionId = match && params ? params.id : "unknown";

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
      console.error("Failed to load session:", err);
      setError(
        err instanceof Error ? err.message : "Fehler beim Laden der Session"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-surface rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">Fehler</h1>
        </div>
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
          {error || "Session nicht gefunden"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-safe animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <button className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{session.name}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(session.created_at).toLocaleDateString("de-DE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Primary Action: Interview Mode */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Session beitreten
        </h2>
        <div className="space-y-2">
          <PersonActionCard
            person="A"
            completed={session.has_a}
            onClick={() => setLocation(`/sessions/${sessionId}/interview/A`)}
          />
          <PersonActionCard
            person="B"
            completed={session.has_b}
            onClick={() => setLocation(`/sessions/${sessionId}/interview/B`)}
          />
        </div>
      </section>

      {/* Secondary Actions */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Weitere Optionen
        </h2>

        {/* Comparison - only enabled when both are done */}
        <ActionCard
          icon={<MessageSquare className="w-5 h-5" />}
          title="Vergleich & Auswertung"
          description={
            session.has_a && session.has_b
              ? "Ergebnisse vergleichen und besprechen"
              : "Beide Personen müssen erst das Interview abschließen"
          }
          disabled={!session.has_a || !session.has_b}
          onClick={() => setLocation(`/sessions/${sessionId}/compare`)}
        />
      </section>

      {/* Privacy Note */}
      <div className="mt-8 p-4 rounded-xl bg-surface/50 border border-border/30">
        <p className="text-xs text-muted-foreground text-center">
          🔒 Alle Daten bleiben auf deinem Gerät
        </p>
      </div>
    </div>
  );
}

interface PersonActionCardProps {
  person: "A" | "B";
  completed: boolean;
  onClick: () => void;
}

function PersonActionCard({ person, completed, onClick }: PersonActionCardProps) {
  const Icon = person === "A" ? User : Users;

  return (
    <Card
      variant={completed ? "elevated" : "default"}
      padding="comfortable"
      onClick={onClick}
      className="flex items-center gap-4"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          completed ? "bg-primary/20" : "bg-accent"
        }`}
      >
        <Icon className={`w-6 h-6 ${completed ? "text-primary" : ""}`} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="font-medium truncate">Person {person}</p>
        <p className="text-sm text-muted-foreground">
          {completed ? "Abgeschlossen – Erneut bearbeiten" : "Interview starten"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {completed && (
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Card>
  );
}

interface ActionCardProps {
  icon: preact.ComponentChildren;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}

function ActionCard({ icon, title, description, disabled, onClick }: ActionCardProps) {
  return (
    <Card
      variant="outlined"
      padding="comfortable"
      onClick={disabled ? undefined : onClick}
      className={`flex items-center gap-4 text-left transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : ""
      }`}
    >
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>
      {!disabled && (
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
      )}
    </Card>
  );
}
