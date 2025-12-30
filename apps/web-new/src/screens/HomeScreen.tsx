/**
 * Mobile-First Home Screen
 * Clear CTA, minimal navigation, recent sessions
 */

import { useState, useEffect } from "preact/hooks";
import { Plus, ChevronRight, Clock, Heart, ShieldCheck, Sparkles } from "lucide-preact";
import { Link, useLocation } from "wouter-preact";
import { Button } from "../components/ui/button";
import { CreateSessionDialog } from "../components/CreateSessionDialog";
import {
  getActiveSessions,
  getArchivedSessions,
  getTemplateById,
  getTemplateQuestionCount,
  loadResponses,
} from "../services/api";
import { getAnsweredCount, loadInterviewScenarios } from "../services/interview-storage";
import { getAnsweredQuestionCount } from "../lib/questionnaire";
import type { SessionListItem } from "../types/session";
import { SessionCardSkeleton } from "../components/ui/skeleton";

interface SessionProgress {
  questionnaireTotal: number;
  questionnaireA: number;
  questionnaireB: number;
  checkinTotal: number;
  checkinA: number;
  checkinB: number;
}

export function HomeScreen() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<SessionListItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, SessionProgress>>({});
  const [checkinTotal, setCheckinTotal] = useState(0);
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
      await loadProgressData([...active, ...archived]);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProgressData(allSessions: SessionListItem[]) {
    if (allSessions.length === 0) return;

    let totalCheckin = checkinTotal;
    if (!totalCheckin) {
      try {
        const scenarios = await loadInterviewScenarios();
        totalCheckin = scenarios.length;
        setCheckinTotal(totalCheckin);
      } catch (err) {
        console.warn("Could not load check-in scenarios:", err);
      }
    }

    const templateCache = new Map<string, number>();
    const templateInfoCache = new Map<string, Awaited<ReturnType<typeof getTemplateById>>>();
    const entries = await Promise.all(
      allSessions.map(async (session) => {
        let template = templateInfoCache.get(session.template_id);
        if (template === undefined) {
          template = await getTemplateById(session.template_id);
          templateInfoCache.set(session.template_id, template);
        }

        let questionnaireTotal = templateCache.get(session.template_id);
        if (questionnaireTotal === undefined) {
          questionnaireTotal = getTemplateQuestionCount(template);
          templateCache.set(session.template_id, questionnaireTotal);
        }

        const [responsesA, responsesB] = await Promise.all([
          loadResponses(session.id, "A"),
          loadResponses(session.id, "B"),
        ]);

        return [
          session.id,
          {
            questionnaireTotal,
            questionnaireA: getAnsweredQuestionCount(template, responsesA),
            questionnaireB: getAnsweredQuestionCount(template, responsesB),
            checkinTotal: totalCheckin,
            checkinA: getAnsweredCount(session.id, "A"),
            checkinB: getAnsweredCount(session.id, "B"),
          },
        ] as const;
      })
    );

    setProgressMap(Object.fromEntries(entries));
  }

  // Get the most recent session
  const latestSession = sessions[0];
  const hasRecentSession = !!latestSession;
  const latestProgress = latestSession ? progressMap[latestSession.id] : undefined;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-panel space-y-6">
          <div className="hero-icon animate-pulse-glow">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="hero-title">Intimacy Tool</h1>
            <p className="hero-subtitle">
              Ein klarer, sicherer Raum für ehrliche Gespräche über Wünsche und Grenzen.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="w-full sm:w-auto gap-3" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-6 h-6" />
              Neue Session starten
            </Button>
            {hasRecentSession && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-2"
                onClick={() => setLocation(`/sessions/${latestSession.id}`)}
              >
                <Clock className="w-5 h-5" />
                Weiter mit {latestSession.name}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="stat-chip">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              100% lokal gespeichert
            </span>
            <span className="stat-chip">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Strukturierte Gespräche
            </span>
            <span className="stat-chip">{sessions.length} aktive Sessions</span>
          </div>
        </div>
      </header>

      {hasRecentSession && (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Zuletzt geöffnet</h2>
              <p className="section-subtitle">Schnell weitermachen, wo ihr aufgehört habt.</p>
            </div>
          </div>
          <div className="space-y-4">
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

            {latestProgress && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="progress-label">Fragebogen</p>
                  <ProgressRow
                    label="A"
                    value={latestProgress.questionnaireA}
                    total={latestProgress.questionnaireTotal}
                  />
                  <ProgressRow
                    label="B"
                    value={latestProgress.questionnaireB}
                    total={latestProgress.questionnaireTotal}
                  />
                </div>
                <div className="space-y-2">
                  <p className="progress-label">Check-in</p>
                  <ProgressRow
                    label="A"
                    value={latestProgress.checkinA}
                    total={latestProgress.checkinTotal}
                  />
                  <ProgressRow
                    label="B"
                    value={latestProgress.checkinB}
                    total={latestProgress.checkinTotal}
                  />
                </div>
              </div>
            )}
          </div>
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
                      <StatusDot
                        complete={session.has_a}
                        label="A"
                        progress={progressMap[session.id]}
                      />
                      <StatusDot
                        complete={session.has_b}
                        label="B"
                        progress={progressMap[session.id]}
                      />
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
  progress,
}: {
  complete: boolean;
  label: string;
  progress?: SessionProgress;
}) {
  const isPersonA = label === "A";
  const answeredCount = progress
    ? isPersonA
      ? progress.questionnaireA
      : progress.questionnaireB
    : 0;
  const totalCount = progress?.questionnaireTotal || 0;
  const progressText =
    totalCount > 0 ? `${answeredCount}/${totalCount} Antworten` : complete ? "Gestartet" : "Offen";

  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
        complete ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
      }`}
      title={`Person ${label}: ${progressText}`}
    >
      {label}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="w-6 text-foreground font-semibold">{label}</span>
      <div className="progress-rail flex-1">
        <div className="progress-rail-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="tabular-nums">
        {total > 0 ? `${value}/${total}` : "--"}
      </span>
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
