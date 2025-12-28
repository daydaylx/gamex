/**
 * Mobile-Optimized Interview Screen - ENHANCED
 * Full-screen focus with swipe, undo, skip confirm, animations
 */

import { useState, useEffect } from "preact/hooks";
import {
  ChevronLeft,
  ChevronRight,
  SkipForward,
  MessageCircle,
  X,
  Undo2,
  FastForward,
} from "lucide-preact";
import { useLocation } from "wouter-preact";
import { Button } from "../components/ui/button";
import { InterviewMiniForm } from "../components/interview/InterviewMiniForm";
import { AskAIPopup } from "../components/interview/AskAIPopup";
import { ReportView } from "../components/interview/ReportView";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { InterviewQuestionSkeleton } from "../components/ui/skeleton";
import { useSwipe } from "../hooks/useSwipe";
import { useUndoStack } from "../hooks/useUndoStack";
import { haptics } from "../platform/capacitor";
import {
  loadInterviewScenarios,
  loadInterviewSession,
  createInterviewSession,
  saveInterviewAnswer,
  updateInterviewProgress,
  getInterviewAnswer,
  getCombinedSession,
  findFirstIncompleteIndex,
} from "../services/interview-storage";
import type { InterviewScenario, InterviewSession, InterviewAnswer } from "../types/interview";

interface InterviewScreenProps {
  sessionId: string;
  person: "A" | "B";
}

export function InterviewScreen({ sessionId, person }: InterviewScreenProps) {
  const [, setLocation] = useLocation();
  const [scenarios, setScenarios] = useState<InterviewScenario[]>([]);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAskAI, setShowAskAI] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<Partial<InterviewAnswer>>({});
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  // Undo functionality
  const undoStack = useUndoStack<{ index: number; answer: Partial<InterviewAnswer> }>(10);

  const currentScenario = scenarios[currentIndex];
  const progress = scenarios.length > 0 ? ((currentIndex + 1) / scenarios.length) * 100 : 0;

  // Swipe navigation
  useSwipe(
    {
      onSwipeLeft: () => {
        if (currentIndex < scenarios.length - 1) {
          handleNext();
        }
      },
      onSwipeRight: () => {
        if (currentIndex > 0) {
          handlePrevious();
        }
      },
    },
    { threshold: 80 }
  );

  useEffect(() => {
    loadData();
  }, [sessionId, person]);

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
      const loadedScenarios = await loadInterviewScenarios();
      setScenarios(loadedScenarios);

      let loadedSession = loadInterviewSession(sessionId, person);
      if (!loadedSession) {
        loadedSession = createInterviewSession(
          sessionId,
          loadedScenarios.map((s) => s.id)
        );
        const sessionToSave = {
          ...loadedSession,
          schema_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(
          `gamex_interview_v1_session_${sessionId}_${person}`,
          JSON.stringify(sessionToSave)
        );
      }
      setSession(loadedSession);
      setCurrentIndex(loadedSession.progress.current_index);
    } catch (err) {
      console.error("Failed to load interview data:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(partialAnswer: Partial<InterviewAnswer>) {
    setCurrentAnswer((prev) => ({ ...prev, ...partialAnswer }));
  }

  async function handleNext() {
    if (!currentScenario || !session) return;

    // Save to undo stack
    undoStack.push("answer", { index: currentIndex, answer: currentAnswer });

    if (currentAnswer.primary !== undefined && currentAnswer.primary !== null) {
      const answer: InterviewAnswer = {
        scenario_id: currentScenario.id,
        person,
        primary: currentAnswer.primary,
        emotion: currentAnswer.emotion,
        comfort: currentAnswer.comfort,
        continue_preference: currentAnswer.continue_preference,
        conditions: currentAnswer.conditions,
        notes: currentAnswer.notes,
        skipped: currentAnswer.skipped ?? false,
        timestamp: new Date().toISOString(),
      };
      saveInterviewAnswer(sessionId, person, answer);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < scenarios.length) {
      setSlideDirection("left");
      await haptics.light();
      setCurrentIndex(nextIndex);
      updateInterviewProgress(sessionId, person, nextIndex);
      setCurrentAnswer({});
      setTimeout(() => setSlideDirection(null), 300);
    } else {
      setShowReport(true);
    }
  }

  async function handlePrevious() {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setSlideDirection("right");
      await haptics.light();
      setCurrentIndex(prevIndex);
      updateInterviewProgress(sessionId, person, prevIndex);
      setCurrentAnswer({});
      setTimeout(() => setSlideDirection(null), 300);
    }
  }

  async function handleSkip() {
    setShowSkipConfirm(true);
  }

  async function confirmSkip() {
    if (!currentScenario || !session) return;

    await haptics.medium();

    const answer: InterviewAnswer = {
      scenario_id: currentScenario.id,
      person,
      primary: currentScenario.primary_answer_type === "likert5" ? 3 : "vielleicht",
      skipped: true,
      timestamp: new Date().toISOString(),
    };
    saveInterviewAnswer(sessionId, person, answer);

    const nextIndex = currentIndex + 1;
    if (nextIndex < scenarios.length) {
      setSlideDirection("left");
      setCurrentIndex(nextIndex);
      updateInterviewProgress(sessionId, person, nextIndex);
      setCurrentAnswer({});
      setTimeout(() => setSlideDirection(null), 300);
    } else {
      setShowReport(true);
    }
  }

  async function handleUndo() {
    const previous = undoStack.undo();
    if (previous) {
      await haptics.light();
      setCurrentIndex(previous.data.index);
      setCurrentAnswer(previous.data.answer);
      updateInterviewProgress(sessionId, person, previous.data.index);
    }
  }

  async function handleJumpToIncomplete() {
    if (!session) return;

    const incompleteIndex = findFirstIncompleteIndex(
      sessionId,
      person,
      scenarios.map((s) => s.id)
    );

    if (incompleteIndex >= 0) {
      await haptics.medium();
      setCurrentIndex(incompleteIndex);
      updateInterviewProgress(sessionId, person, incompleteIndex);
    }
  }

  function handleClose() {
    setLocation(`/sessions/${sessionId}`);
  }

  // Loading state
  if (loading) {
    return <InterviewQuestionSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
        <Button variant="outline" className="mt-4" onClick={handleClose}>
          Zurück
        </Button>
      </div>
    );
  }

  // No scenarios
  if (!session || scenarios.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Keine Szenarien verfügbar</p>
        <Button variant="outline" className="mt-4" onClick={handleClose}>
          Zurück
        </Button>
      </div>
    );
  }

  // Report view
  if (showReport) {
    const combinedSession = getCombinedSession(sessionId);
    if (combinedSession) {
      return (
        <div className="animate-fade-in">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
            <h2 className="text-lg font-semibold">Auswertung</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Schließen
            </Button>
          </div>
          <div className="p-4">
            <ReportView session={combinedSession} onClose={handleClose} />
          </div>
        </div>
      );
    }
  }

  if (!currentScenario) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Szenario nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      {/* Header with Progress */}
      <header className="px-4 py-3 pt-safe landscape-compact-header border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent transition-colors touch-target"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">Person {person}</span>
          </div>
          <div className="flex items-center gap-2">
            {undoStack.canUndo && (
              <button
                onClick={handleUndo}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors touch-target"
                aria-label="Rückgängig"
              >
                <Undo2 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={handleJumpToIncomplete}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors touch-target"
              aria-label="Zur ersten unvollständigen Frage"
            >
              <FastForward className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{scenarios.length}
            </span>
          </div>
        </div>

        {/* Progress Bar with Milestones */}
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1 px-0.5">
          {[25, 50, 75, 100].map((milestone) => {
            const reached = progress >= milestone;
            return (
              <span
                key={milestone}
                className={`text-[10px] transition-colors ${
                  reached ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {milestone}%
              </span>
            );
          })}
        </div>
      </header>

      {/* Question Content - Full Screen Focus */}
      <div
        className={`flex-1 overflow-auto px-4 py-6 pb-32 landscape-compact-spacing ${
          slideDirection === "left"
            ? "animate-slide-in-left"
            : slideDirection === "right"
              ? "animate-slide-in-right"
              : ""
        }`}
      >
        {/* Section Tag */}
        <div className="mb-4">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {currentScenario.section}
          </span>
        </div>

        {/* Scenario Text - Chat Bubble Style */}
        <div className="mb-6 animate-fade-in">
          <div className="bg-surface rounded-2xl rounded-tl-sm p-4 sm:p-5 border border-border/50 max-w-prose mx-auto">
            <p className="text-base sm:text-lg leading-relaxed landscape-compact-text">
              {currentScenario.scenario_text}
            </p>
          </div>
        </div>

        {/* Question Title */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-1">{currentScenario.title}</h2>
          {currentScenario.help_text && (
            <p className="text-sm text-muted-foreground">{currentScenario.help_text}</p>
          )}
        </div>

        {/* Answer Form */}
        <div className="bg-surface/50 rounded-xl p-4 border border-border/30 animate-fade-in">
          <InterviewMiniForm
            scenario={currentScenario}
            answer={getInterviewAnswer(sessionId, person, currentScenario.id) || undefined}
            person={person}
            onChange={handleAnswerChange}
          />
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border/40 p-4 pb-safe">
        <div className="flex items-center gap-3">
          {/* Left: Back + Skip */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="h-12 w-12"
              aria-label="Zurück"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-12 w-12"
              aria-label="Überspringen"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Center: AI Help */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowAskAI(true)}
            className="h-12 w-12"
            aria-label="KI-Hilfe"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>

          {/* Right: Next */}
          <Button onClick={handleNext} className="flex-1 h-12 gap-2 text-base">
            {currentIndex === scenarios.length - 1 ? "Auswerten" : "Weiter"}
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* AI Popup */}
      <AskAIPopup
        scenario={currentScenario}
        currentAnswer={currentAnswer}
        open={showAskAI}
        onClose={() => setShowAskAI(false)}
      />

      {/* Skip Confirmation Dialog */}
      <ConfirmDialog
        open={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        onConfirm={confirmSkip}
        title="Frage überspringen?"
        description="Diese Frage wird als neutral (Vielleicht/3) markiert."
        confirmText="Überspringen"
        cancelText="Abbrechen"
      />
    </div>
  );
}
