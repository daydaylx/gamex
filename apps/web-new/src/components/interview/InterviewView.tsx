/**
 * Interview View Component
 * Main interview interface with chat-style UI and structured forms
 * Mobile-optimized with swipe gestures and haptic feedback
 */

import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { ChevronLeft, ChevronRight, MessageCircle, SkipForward } from "lucide-preact";
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
} from "../../services/interview-storage";
import { haptics, useInterviewBackButton } from "../../platform/capacitor";
import type {
  InterviewScenario,
  InterviewSession,
  InterviewAnswer,
} from "../../types/interview";

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 80;

interface InterviewViewProps {
  sessionId: string;
  person: "A" | "B";
  onComplete?: () => void;
  onClose?: () => void;
}

export function InterviewView({
  sessionId,
  person,
  onComplete,
  onClose,
}: InterviewViewProps) {
  const [scenarios, setScenarios] = useState<InterviewScenario[]>([]);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAskAI, setShowAskAI] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<Partial<InterviewAnswer>>({});
  
  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentScenario = scenarios[currentIndex];
  const progress = scenarios.length > 0 ? Math.round(((currentIndex + 1) / scenarios.length) * 100) : 0;
  const isComplete = currentIndex >= scenarios.length;

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
    // Light haptic on answer change
    haptics.light();
  }

  async function handleNext() {
    if (!currentScenario || !session) return;

    // Haptic feedback
    await haptics.medium();

    // Save current answer if we have a primary value
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

  // Swipe handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Only consider horizontal swipes (prevent vertical scroll interference)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      // Limit swipe offset
      const maxOffset = 120;
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
      setSwipeOffset(clampedOffset);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!touchStartRef.current || !isSwiping) {
      touchStartRef.current = null;
      setSwipeOffset(0);
      return;
    }

    // Determine action based on swipe direction and distance
    if (swipeOffset < -SWIPE_THRESHOLD && currentIndex < scenarios.length - 1) {
      // Swipe left → next question
      await handleNext();
    } else if (swipeOffset > SWIPE_THRESHOLD && currentIndex > 0) {
      // Swipe right → previous question
      await handlePrevious();
    }

    // Reset swipe state
    touchStartRef.current = null;
    setSwipeOffset(0);
    setIsSwiping(false);
  }, [swipeOffset, currentIndex, scenarios.length, isSwiping]);

  // Android back button handler
  useInterviewBackButton(
    handlePrevious,
    currentIndex > 0,
    () => {
      if (onClose) onClose();
    }
  );

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
  const isAnswered = !!existingAnswer && !existingAnswer.skipped;

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] relative">
      {/* Sticky Progress Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pb-3 pt-1 -mx-4 px-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Person {person}</span>
            <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground truncate max-w-[120px]">{currentScenario.section}</span>
          </div>
            <span className="text-muted-foreground whitespace-nowrap">
              {currentIndex + 1}/{scenarios.length} • {progress}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
              className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          </div>
        </div>
      </div>

      {/* Swipeable Content Area */}
      <div 
        ref={contentRef}
        className="flex-1 pb-28 pt-4 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator */}
        {isSwiping && Math.abs(swipeOffset) > 20 && (
          <div 
            className={`fixed top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/90 backdrop-blur-sm shadow-lg transition-opacity duration-150
              ${swipeOffset < 0 ? 'right-4' : 'left-4'}
              ${Math.abs(swipeOffset) > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-60'}
            `}
          >
            {swipeOffset < 0 ? (
              <>
                <span className="text-sm font-medium">Weiter</span>
                <ChevronRight className="h-5 w-5" />
              </>
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Zurück</span>
              </>
            )}
          </div>
        )}

        {/* Content with swipe transform */}
        <div 
          className="space-y-4 transition-transform duration-75"
          style={{ 
            transform: isSwiping ? `translateX(${swipeOffset * 0.3}px)` : 'translateX(0)',
            opacity: isSwiping ? 1 - Math.abs(swipeOffset) / 400 : 1
          }}
        >
      {/* Chat Bubble with Scenario */}
      <ChatBubble text={currentScenario.scenario_text} title="Guide" />

      {/* Mini Form */}
          <Card className="animate-fade-in">
            <CardContent className="pt-5 space-y-5">
          {/* Header with Info and Ask AI */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
                  <h3 className="text-lg font-semibold leading-tight">{currentScenario.title}</h3>
              {currentScenario.help_text && (
                <p className="text-sm text-muted-foreground mt-1">{currentScenario.help_text}</p>
              )}
            </div>
            <div className="flex gap-2">
              {currentScenario.help_text && (
                <InfoPopover
                  title={currentScenario.title}
                  content={currentScenario.help_text}
                />
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAskAI(true)}
                title="Frage an KI stellen"
                    className="min-w-[44px] min-h-[44px]"
              >
                    <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Form */}
          <InterviewMiniForm
            scenario={currentScenario}
            answer={existingAnswer || undefined}
            person={person}
            onChange={handleAnswerChange}
          />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 pb-safe">
          <div className="flex justify-between items-center gap-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="gap-1.5 min-h-[48px] px-4 touch-feedback"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Zurück</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="gap-1.5 min-h-[48px] px-3 text-muted-foreground touch-feedback"
              >
                <SkipForward className="h-5 w-5" />
                <span className="hidden sm:inline">Skip</span>
              </Button>
            </div>

            <Button
              onClick={handleNext}
              className="gap-1.5 min-h-[48px] px-5 font-semibold touch-feedback shadow-lg shadow-primary/20"
            >
              {currentIndex === scenarios.length - 1 ? "Fertig" : "Weiter"}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Ask AI Popup */}
      <AskAIPopup
        scenario={currentScenario}
        currentAnswer={currentAnswer}
        open={showAskAI}
        onClose={() => setShowAskAI(false)}
      />
    </div>
  );
}

