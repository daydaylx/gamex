import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { Link } from "wouter-preact";
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
import { Clock, MessageCircle, Plus, Sparkles } from "lucide-preact";

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

  const loadProgressData = useCallback(
    async (allSessions: SessionListItem[]) => {
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
    },
    [checkinTotal]
  );

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const [active, archived] = await Promise.all([getActiveSessions(), getArchivedSessions()]);

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
  }, [loadProgressData]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const lobbySessions = useMemo(
    () =>
      sessions.map((session) => ({
        ...session,
        progress: progressMap[session.id],
      })),
    [sessions, progressMap]
  );

  return (
    <div className="page chat-lobby">
      <div className="lobby-topbar">
        <div className="space-y-1">
          <p className="eyebrow">Chat-Lobby</p>
          <h1 className="page-title">Eure Sessions als Chats</h1>
          <p className="page-subtitle">
            Springt direkt in eure Threads, seht den letzten Stand und wo noch Antworten fehlen.
          </p>
        </div>
        <div className="topbar-actions">
          <Button
            size="lg"
            className="cta-primary"
            onClick={() => setShowCreateDialog(true)}
            aria-label="Neue Session starten"
          >
            <Plus className="w-5 h-5" />
            Neuen Chat starten
          </Button>
        </div>
      </div>

      <section className="thread-list-card">
        <div className="thread-list-header">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {sessions.length > 0 ? `${sessions.length} aktive Threads` : "Keine aktiven Threads"}
          </div>
          <div className="text-xs text-muted-foreground">Letzte Aktivität · Fragebogen & Check-ins</div>
        </div>

        {loading && (
          <div className="space-y-4">
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <MessageCircle className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              Noch keine Sessions – starte einen neuen Chat und lade deine Partnerin / deinen Partner ein.
            </p>
            <Button variant="secondary" onClick={() => setShowCreateDialog(true)}>
              Neue Session
            </Button>
          </div>
        )}

        <div className="thread-stack">
          {lobbySessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <a className="thread-row card-interactive" aria-label={`Chat ${session.name}`}>
                {(() => {
                  const unreadCount = getUnreadCount(session.progress);

                  return (
                    <>
                      <div className="thread-avatar">
                        <span className="thread-initials">{session.name.slice(0, 2).toUpperCase()}</span>
                        <span className={`presence-dot ${unreadCount > 0 ? "presence-active" : ""}`} aria-hidden />
                      </div>
                      <div className="thread-body">
                        <div className="thread-title-row">
                          <p className="thread-title">{session.name}</p>
                          <span className="thread-time">{formatShortDate(session.created_at)}</span>
                        </div>
                        <div className="thread-preview">{getPreviewText(session, session.progress)}</div>
                        <div className="thread-meta-row">
                          <ProgressBadge
                            label="A"
                            progress={session.progress?.questionnaireA}
                            total={session.progress?.questionnaireTotal}
                          />
                          <ProgressBadge
                            label="B"
                            progress={session.progress?.questionnaireB}
                            total={session.progress?.questionnaireTotal}
                          />
                          <ProgressBadge
                            label="Check-ins"
                            progress={session.progress?.checkinA + session.progress?.checkinB}
                            total={(session.progress?.checkinTotal || 0) * 2}
                            compact
                          />
                          {unreadCount > 0 ? (
                            <span className="unread-pill">{unreadCount} offen</span>
                          ) : (
                            <span className="resolved-pill">Alles synchron</span>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </a>
            </Link>
          ))}
        </div>
      </section>

      {archivedSessions.length > 0 && (
        <section className="thread-list-card">
          <div className="thread-list-header">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Archiv
            </div>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? "Ausblenden" : `Anzeigen (${archivedSessions.length})`}
            </button>
          </div>

          {showArchived && (
            <div className="thread-stack">
              {archivedSessions.map((session) => (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <a className="thread-row thread-row-archived card-interactive" aria-label={`Archivierter Chat ${session.name}`}>
                    <div className="thread-avatar muted">
                      <span className="thread-initials">{session.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="thread-body">
                      <div className="thread-title-row">
                        <p className="thread-title">{session.name}</p>
                        <span className="thread-time">{formatShortDate(session.created_at)}</span>
                      </div>
                      <div className="thread-preview">Archiviert · Erinnerungen jederzeit abrufbar</div>
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

function ProgressBadge({
  label,
  progress = 0,
  total = 0,
  compact = false,
}: {
  label: string;
  progress?: number;
  total?: number;
  compact?: boolean;
}) {
  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
  const content = compact ? `${progress}/${total}` : `${label}: ${progress}/${total}`;

  return (
    <span className="progress-pill" aria-label={`${label} Fortschritt ${percent}%`}>
      {content}
    </span>
  );
}

function getUnreadCount(progress?: SessionProgress) {
  if (!progress) return 1;
  const outstanding = [
    progress.questionnaireTotal - progress.questionnaireA,
    progress.questionnaireTotal - progress.questionnaireB,
    progress.checkinTotal - progress.checkinA,
    progress.checkinTotal - progress.checkinB,
  ].filter((value) => value > 0);

  return outstanding.length;
}

function getPreviewText(session: SessionListItem, progress?: SessionProgress) {
  if (!progress) {
    return `Noch keine Antworten · ${formatShortDate(session.created_at)}`;
  }

  const parts = [] as string[];
  if (progress.questionnaireA || progress.questionnaireB) {
    parts.push(
      `Fragebogen A ${progress.questionnaireA}/${progress.questionnaireTotal}, B ${progress.questionnaireB}/${progress.questionnaireTotal}`
    );
  }

  if (progress.checkinA || progress.checkinB) {
    parts.push(`Check-ins ${progress.checkinA + progress.checkinB}/${progress.checkinTotal * 2}`);
  }

  if (parts.length === 0) {
    parts.push("Noch nichts beantwortet");
  }

  return parts.join(" · ");
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffHours < 24) return `${diffHours} h`;
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;

  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}
