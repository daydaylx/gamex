/**
 * Interview View Component
 * Main interview interface with chat-style UI and structured forms
 * Optimized for mobile chat with auto-progress answers and inline quick replies
 */

import { useState, useEffect, useRef } from "preact/hooks";
import { ArrowLeft, MessageCircle, SkipForward, X } from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { InfoPopover } from "../InfoPopover";
import { ChatBubble } from "./ChatBubble";
import { InterviewMiniForm } from "./InterviewMiniForm";
import { AskAIPopup } from "./AskAIPopup";
import { ReportView } from "./ReportView";
import {
  loadInterviewScenarios,
  loadInterviewSession,
  createInterviewSession,
  saveInterviewAnswer,
  updateInterviewProgress,
  getInterviewAnswer,
  getCombinedSession,
  findFirstIncompleteIndex,
} from "../../services/interview-storage";
import { haptics, useInterviewBackButton } from "../../platform/capacitor";
import type { InterviewScenario, InterviewSession, InterviewAnswer } from "../../types/interview";

interface SystemMessage {
  id: string;
  text: string;
}

interface InterviewViewProps {
  sessionId: string;
  person: "A" | "B";
  onComplete?: () => void;
  onClose?: () => void;
}

export function InterviewView({ sessionId, person, onComplete, onClose }: InterviewViewProps) {
  const [scenarios, setScenarios] = useState<InterviewScenario[]>([]);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAskAI, setShowAskAI] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<Partial<InterviewAnswer>>({});
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentScenario = scenarios[currentIndex];
  const progress =
    scenarios.length > 0 ? Math.round(((currentIndex + 1) / scenarios.length) * 100) : 0;
  const _isComplete = currentIndex >= scenarios.length;
  void _isComplete; // Reserved for completion state handling

  // Load scenarios and session on mount
  useEffect(() => {
    loadData();
  }, [sessionId, person]);

  // Load current answer when scenario changes
  useEffect(() => {
    if (session && currentScenario) {
      const existing = getInterviewAnswer(sessionId, person, currentScenario.id);
      setCurrentAnswer(existing || {});
    }
  }, [sessionId, person, currentScenario, session]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load scenarios
      const loadedScenarios = await loadInterviewScenarios();
      setScenarios(loadedScenarios);

      // Load or create session
      let loadedSession = loadInterviewSession(sessionId, person);
      if (!loadedSession) {
        loadedSession = createInterviewSession(
          sessionId,
          loadedScenarios.map((s) => s.id)
        );
        // Save initial session
        const sessionToSave = { ...loadedSession };
        sessionToSave.schema_version = 1;
        sessionToSave.created_at = new Date().toISOString();
        sessionToSave.updated_at = new Date().toISOString();
        localStorage.setItem(
          `gamex_interview_v1_session_${sessionId}_${person}`,
          JSON.stringify(sessionToSave)
        );
      }
      setSession(loadedSession);
      const resumeIndex = findFirstIncompleteIndex(
        sessionId,
        person,
        loadedScenarios.map((s) => s.id)
      );
      setCurrentIndex(resumeIndex >= 0 ? resumeIndex : loadedSession.progress.current_index);
    } catch (err) {
      console.error("Failed to load interview data:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(partialAnswer: Partial<InterviewAnswer>) {
    setCurrentAnswer((prev) => ({ ...prev, ...partialAnswer }));
    // Light haptic on answer change
    haptics.light();
  }

  async function handleNextWithOverride(override?: Partial<InterviewAnswer>) {
    if (!currentScenario || !session) return;
    const mergedAnswer = { ...currentAnswer, ...override };

    if (mergedAnswer.primary === undefined || mergedAnswer.primary === null) {
      // User tried to continue without answering - haptic feedback
      await haptics.light();
      return;
    }

    // Haptic feedback
    await haptics.medium();

    // Save current answer if we have a primary value
    if (mergedAnswer.primary !== undefined && mergedAnswer.primary !== null) {
      const answer: InterviewAnswer = {
        scenario_id: currentScenario.id,
        person,
        primary: mergedAnswer.primary,
        emotion: mergedAnswer.emotion,
        comfort: mergedAnswer.comfort,
        continue_preference: mergedAnswer.continue_preference,
        conditions: mergedAnswer.conditions,
        notes: mergedAnswer.notes,
        skipped: mergedAnswer.skipped ?? false,
        timestamp: new Date().toISOString(),
      };

      saveInterviewAnswer(sessionId, person, answer);
    }

    // Move to next scenario
    const nextIndex = currentIndex + 1;
    if (nextIndex < scenarios.length) {
      setCurrentIndex(nextIndex);
      updateInterviewProgress(sessionId, person, nextIndex);
      setCurrentAnswer({});
    } else {
      // Interview complete - show report
      await haptics.success();
      setShowReport(true);
      if (onComplete) {
        onComplete();
      }
    }
  }

  async function handlePrevious() {
    if (currentIndex > 0) {
      await haptics.light();
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      updateInterviewProgress(sessionId, person, prevIndex);
      setCurrentAnswer({});
      setSystemMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          text: `Zurück zu Frage ${prevIndex + 1}`,
        },
      ]);
    }
  }

  async function handleSkip() {
    if (!currentScenario || !session) return;

    await haptics.light();

    const answer: InterviewAnswer = {
      scenario_id: currentScenario.id,
      person,
      primary: currentScenario.primary_answer_type === "likert5" ? 3 : "vielleicht",
      skipped: true,
      timestamp: new Date().toISOString(),
    };

    saveInterviewAnswer(sessionId, person, answer);

    // Move to next scenario (without calling handleNext to avoid double-saving)
    const nextIndex = currentIndex + 1;
    if (nextIndex < scenarios.length) {
      setCurrentIndex(nextIndex);
      updateInterviewProgress(sessionId, person, nextIndex);
      setCurrentAnswer({});
    } else {
      // Interview complete - show report
      await haptics.success();
      setShowReport(true);
      if (onComplete) {
        onComplete();
      }
    }
  }

  // Android back button handler
  useInterviewBackButton(handlePrevious, currentIndex > 0, () => {
    if (onClose) onClose();
  });

  // Auto-scroll to the latest message when the index or system messages change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [currentIndex, systemMessages.length]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Lädt Interview...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session || scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Keine Szenarien verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  // Show report view if interview is complete
  if (showReport) {
    const combinedSession = getCombinedSession(sessionId);
    if (combinedSession) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Interview abgeschlossen</h2>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Zurück zur Session
              </Button>
            )}
          </div>
          <ReportView
            session={combinedSession}
            onClose={() => {
              setShowReport(false);
              if (onClose) onClose();
            }}
          />
        </div>
      );
    }
  }

  if (!currentScenario) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Szenario nicht gefunden</p>
        </CardContent>
      </Card>
    );
  }

  const existingAnswer = getInterviewAnswer(sessionId, person, currentScenario.id);
  const _isAnswered = !!existingAnswer && !existingAnswer.skipped;
  void _isAnswered; // Reserved for answer state visualization
  const remainingQuestions = Math.max(0, scenarios.length - (currentIndex + 1));
  const mergedAnswer = existingAnswer ? { ...existingAnswer, ...currentAnswer } : currentAnswer;

  const answeredHistory = scenarios
    .slice(0, currentIndex)
    .map((scenario) => ({
      scenario,
      answer: getInterviewAnswer(sessionId, person, scenario.id),
    }))
    .filter((entry) => entry.answer);

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] relative">
      {/* Chat Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pb-3 pt-1 -mx-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="min-w-[44px] min-h-[44px]"
              title="Zurück zur vorherigen Frage"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Interview Person {person}</p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="truncate max-w-[140px]">{currentScenario.section}</span>
                <span className="text-muted-foreground">•</span>
                <span>{currentScenario.title}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {currentIndex + 1}/{scenarios.length} • {progress}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px]"
              title="Interview schließen"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <div className="rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold">
            Chat-Modus aktiv
          </div>
          <div>• Noch {remainingQuestions} offen</div>
        </div>
      </div>

      {/* Chat Stream */}
      <div ref={contentRef} className="flex-1 overflow-y-auto space-y-5 pt-4 pb-28">
        {systemMessages.map((msg) => (
          <SystemBubble key={msg.id} text={msg.text} />
        ))}

        {answeredHistory.map(({ scenario, answer }) => (
          <div key={scenario.id} className="space-y-3 px-1">
            <ChatBubble text={scenario.scenario_text} title="Guide" />
            {answer && <AnswerBubble answer={answer} scenario={scenario} />}
          </div>
        ))}

        <div className="space-y-3 px-1">
          <ChatBubble text={currentScenario.scenario_text} title="Guide" />

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pl-12 pr-2">
            <div className="flex items-center gap-2">
              {currentScenario.help_text && (
                <InfoPopover title={currentScenario.title} content={currentScenario.help_text} />
              )}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowAskAI(true)}
              >
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  KI um Hilfe bitten
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-4 w-4" /> Skip
            </button>
          </div>

          <InterviewMiniForm
            scenario={currentScenario}
            answer={mergedAnswer}
            person={person}
            onChange={handleAnswerChange}
            autoAdvance
            onSubmit={(override) => handleNextWithOverride(override)}
            onSkip={handleSkip}
          />
        </div>
      </div>

      <AskAIPopup
        scenario={currentScenario}
        currentAnswer={currentAnswer}
        open={showAskAI}
        onClose={() => setShowAskAI(false)}
      />
    </div>
  );
}

function AnswerBubble({
  answer,
  scenario,
}: {
  answer: InterviewAnswer;
  scenario: InterviewScenario;
}) {
  const primaryLabel =
    scenario.primary_answer_type === "likert5"
      ? `${answer.primary}/5`
      : typeof answer.primary === "string"
        ? answer.primary
        : String(answer.primary ?? "");

  return (
    <div className="flex justify-end gap-3 items-start">
      <div className="flex-1 flex flex-col items-end min-w-0">
        <div className="text-xs text-muted-foreground mb-1">Du</div>
        <div className="rounded-2xl rounded-br-none bg-primary text-primary-foreground px-4 py-3 shadow-sm max-w-[80%] space-y-2">
          <div className="font-semibold leading-tight break-words">{primaryLabel}</div>

          {(answer.emotion?.length || answer.comfort || answer.notes) && (
            <div className="flex flex-wrap gap-2 text-[11px] text-primary-foreground/90">
              {answer.emotion?.map((emotion) => (
                <span key={emotion} className="rounded-full bg-primary-foreground/15 px-2 py-1">
                  {emotion}
                </span>
              ))}
              {answer.comfort && <span className="rounded-full bg-primary-foreground/15 px-2 py-1">Komfort {answer.comfort}/5</span>}
              {answer.notes && (
                <span className="rounded-full bg-primary-foreground/15 px-2 py-1 max-w-full truncate">
                  {answer.notes}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
        Du
      </div>
    </div>
  );
}

function SystemBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <div className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">{text}</div>
    </div>
  );
}
