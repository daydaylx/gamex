/**
 * Session View - Mobile Optimized
 * Shows session details and actions
 */

import { useState, useEffect } from "preact/hooks";
import { Link, useRoute, useLocation } from "wouter-preact";
import { ArrowLeft, User, Users, MessageSquare, ChevronRight } from "lucide-preact";
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
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Session");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="space-y-2">
            <div className="h-6 w-40 bg-surface rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-surface rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="section-card">
          <div className="section-body">
            <div className="h-16 rounded-xl bg-surface-elevated animate-pulse" />
            <div className="h-16 rounded-xl bg-surface-elevated animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="page">
        <div className="page-header">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="page-title">Fehler</h1>
            <p className="page-subtitle">Die Session konnte nicht geladen werden.</p>
          </div>
        </div>
        <div className="section-card">
          <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
            {error || "Session nicht gefunden"}
          </div>
        </div>
      </div>
    );
  }

  const isChatDefault =
    session.template?.id === "unified_v3_pure" || session.template_id === "unified_v3_pure";
  const interviewPath = (person: "A" | "B") =>
    `/sessions/${sessionId}/interview/${person}${isChatDefault ? "?mode=chat" : ""}`;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <Link href="/">
          <button className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{session.name}</h1>
          <p className="page-subtitle">
            {new Date(session.created_at).toLocaleDateString("de-DE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Session beitreten</h2>
            <p className="section-subtitle">Wähle deine Rolle für diese Session.</p>
          </div>
        </div>
        <div className="section-body">
          <PersonActionCard
            person="A"
            completed={session.has_a}
            onClick={() => setLocation(interviewPath("A"))}
          />
          <PersonActionCard
            person="B"
            completed={session.has_b}
            onClick={() => setLocation(interviewPath("B"))}
          />
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Weitere Optionen</h2>
            <p className="section-subtitle">Ergebnisse anzeigen oder vergleichen.</p>
          </div>
        </div>
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

      <div className="section-card text-center">
        <p className="section-subtitle">🔒 Alle Daten bleiben auf deinem Gerät.</p>
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
    <button type="button" onClick={onClick} className="list-card card-interactive w-full">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          completed ? "bg-primary/20" : "bg-accent"
        }`}
      >
        <Icon className={`w-6 h-6 ${completed ? "text-primary" : ""}`} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="list-card-title truncate">Person {person}</p>
        <p className="list-card-meta">
          {completed ? "Abgeschlossen – Erneut bearbeiten" : "Interview starten"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {completed && <span className="pill">Fertig</span>}
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
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
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`list-card w-full text-left ${disabled ? "opacity-50 cursor-not-allowed" : "card-interactive"}`}
      disabled={disabled}
    >
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="list-card-title truncate">{title}</p>
        <p className="list-card-meta line-clamp-2">{description}</p>
      </div>
      {!disabled && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </button>
  );
}
