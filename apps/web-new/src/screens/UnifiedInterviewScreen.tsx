import { useState, useEffect } from "preact/hooks";
import { useLocation } from "wouter-preact";
import { Layers, MessageCircle, ChevronLeft, ChevronRight } from "lucide-preact";
import { Button } from "../components/ui/button";
import { InterviewMiniForm } from "../components/interview/InterviewMiniForm";
import { ScenariosView } from "../components/ScenariosView";
import { QuestionnaireForm } from "../components/form/QuestionnaireForm";
import { ChatQuestionnaire } from "../components/form/ChatQuestionnaire";
import { loadInterviewScenarios } from "../services/interview-storage";
import { loadScenarios, loadTemplate } from "../services/api";
import type { InterviewScenario } from "../types/interview";
import type { Template } from "../types";

// Import directly to avoid circular dependency issues if refactoring later
// Assuming ScenariosView and QuestionnaireForm export props interfaces or are flexible

type Stage = "intro" | "dashboard" | "checkin" | "deck" | "module" | "summary";

interface UnifiedInterviewScreenProps {
  sessionId: string;
  person: "A" | "B";
}

export function UnifiedInterviewScreen({ sessionId, person }: UnifiedInterviewScreenProps) {
  const [location, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("dashboard"); // Default to dashboard for now
  const [loading, setLoading] = useState(true);

  // Data State
  const [checkinQuestions, setCheckinQuestions] = useState<InterviewScenario[]>([]);
  const [scenariosData, setScenariosData] = useState<any>(null); // Full scenarios.json data
  const [template, setTemplate] = useState<Template | null>(null);

  // Selection State
  const [selectedDeckIndex, setSelectedDeckIndex] = useState<number>(0);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const forceChatMode = searchParams.get("mode") === "chat";

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      // Load all necessary data in parallel
      const [checkin, scenarios, tmpl] = await Promise.all([
        loadInterviewScenarios(),
        loadScenarios(),
        loadTemplate("unified_v3_pure.json"),
      ]);

      setCheckinQuestions(checkin);
      setScenariosData(scenarios);
      setTemplate(tmpl);
    } catch (err) {
      console.error("Failed to load interview data:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (stage === "dashboard") {
      setLocation(`/sessions/${sessionId}`);
    } else {
      setStage("dashboard");
    }
  }

  // --- Sub-Components for this screen ---

  const Dashboard = () => (
    <div className="page animate-fade-in">
      <div className="page-header">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="page-title">Themenwahl</h1>
          <p className="page-subtitle">Wähle dein nächstes Thema für die Session.</p>
        </div>
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Schneller Einstieg</h2>
            <p className="section-subtitle">Kurz starten und warm werden.</p>
          </div>
        </div>
        <button
          onClick={() => setStage("checkin")}
          className="list-card card-interactive w-full text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="list-card-title">Check-in starten</p>
            <p className="list-card-meta">Kurzes Warm-up mit 12 Fragen.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Szenario-Decks</h2>
            <p className="section-subtitle">Stöbere in thematischen Karten-Sets.</p>
          </div>
        </div>
        <div className="section-body">
          {scenariosData?.decks?.map((deck: any, index: number) => (
            <button
              key={deck.id}
              onClick={() => {
                setSelectedDeckIndex(index);
                setStage("deck");
              }}
              className="list-card card-interactive w-full text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="list-card-title">{deck.name}</p>
                <p className="list-card-meta line-clamp-2">{deck.description}</p>
              </div>
              <span className="pill">{deck.scenarios.length} Karten</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Vertiefungs-Module</h2>
            <p className="section-subtitle">Geführte Module für mehr Tiefe.</p>
          </div>
        </div>
        <div className="section-body">
          {template?.modules?.map((module: any) => (
            <button
              key={module.id}
              onClick={() => {
                setSelectedModuleId(module.id);
                setStage("module");
              }}
              className="list-card card-interactive w-full text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="list-card-title">{module.name}</p>
                <p className="list-card-meta line-clamp-2">{module.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Stage: Dashboard */}
      {stage === "dashboard" && <Dashboard />}

      {/* Stage: Deck (Scenarios) */}
      {stage === "deck" && (
        <div className="h-screen flex flex-col">
          {/* Adapted ScenariosView to accept initial deck */}
          <ScenariosView
            onClose={() => setStage("dashboard")}
            initialDeckIndex={selectedDeckIndex}
          />
        </div>
      )}

      {/* Stage: Module (Questionnaire) */}
      {stage === "module" && template && (
        <div className="h-screen flex flex-col">
          {/* QuestionnaireForm loads full form but jumps to selected module */}
          {forceChatMode || template.id === "unified_v3_pure" ? (
            <ChatQuestionnaire
              sessionId={sessionId}
              person={person}
              template={template}
              onComplete={() => setStage("dashboard")}
              onExit={() => setStage("dashboard")}
              initialModuleId={selectedModuleId}
            />
          ) : (
            <QuestionnaireForm
              sessionId={sessionId}
              person={person}
              template={template}
              onComplete={() => setStage("dashboard")}
              onExit={() => setStage("dashboard")}
              initialModuleId={selectedModuleId}
            />
          )}
        </div>
      )}

      {/* Stage: Check-in */}
      {stage === "checkin" && checkinQuestions.length > 0 && (
        <CheckinFlow
          questions={checkinQuestions}
          onComplete={() => setStage("dashboard")}
          onExit={() => setStage("dashboard")}
          sessionId={sessionId}
          person={person}
        />
      )}
    </div>
  );
}

import { saveInterviewAnswer, getInterviewAnswer } from "../services/interview-storage";

// ... (previous imports)

// Internal component for Check-in logic
function CheckinFlow({
  questions,
  onComplete,
  onExit,
  sessionId,
  person,
}: {
  questions: InterviewScenario[];
  onComplete: () => void;
  onExit: () => void;
  sessionId: string;
  person: "A" | "B";
}) {
  const [index, setIndex] = useState(0);
  const currentQ = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  function handleNext() {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete();
    }
  }

  // Reuse InterviewMiniForm but adapted for this context
  const [answer, setAnswer] = useState<any>({});

  useEffect(() => {
    // Load existing answer
    const existing = getInterviewAnswer(sessionId, person, currentQ.id);
    setAnswer(existing || {});
  }, [currentQ.id]);

  function onAnswerChange(partial: any) {
    setAnswer((prev: any) => ({ ...prev, ...partial }));
  }

  function saveAndNext() {
    // Save
    if (answer.primary) {
      saveInterviewAnswer(sessionId, person, {
        scenario_id: currentQ.id,
        person,
        ...answer,
        timestamp: new Date().toISOString(),
      });
    }
    handleNext();
  }

  return (
    <div className="page">
      <div className="page-header">
        <Button variant="ghost" size="icon" onClick={onExit}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="page-title">Check-in</h2>
          <p className="page-subtitle">
            Person {person} • Frage {index + 1}/{questions.length}
          </p>
        </div>
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="section-title">Fortschritt</p>
            <p className="section-subtitle">Kurzstart mit {questions.length} Fragen.</p>
          </div>
        </div>
        <div className="section-body">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}% erledigt</span>
            <span>Check-in {index + 1}/{questions.length}</span>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="section-title">Aktuelle Frage</p>
            <p className="section-subtitle">Kurzer Warm-up-Check.</p>
          </div>
        </div>
        <div className="section-body">
          <div className="space-y-2">
            <h3 className="text-display text-xl">{currentQ.title}</h3>
            <p className="section-subtitle">{currentQ.scenario_text}</p>
          </div>
          <InterviewMiniForm
            scenario={currentQ}
            person={person}
            answer={answer}
            onChange={onAnswerChange}
          />
        </div>
      </section>

      <section className="section-card">
        <div className="section-body">
          <Button className="w-full" onClick={saveAndNext}>
            {index === questions.length - 1 ? "Abschließen" : "Weiter"}
          </Button>
        </div>
      </section>
    </div>
  );
}
