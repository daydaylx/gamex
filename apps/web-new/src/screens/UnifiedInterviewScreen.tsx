import { useState, useEffect } from "preact/hooks";
import { useLocation } from "wouter-preact";
import { Layers, MessageCircle, ChevronLeft } from "lucide-preact";
import { Button } from "../components/ui/button";
import { InterviewMiniForm } from "../components/interview/InterviewMiniForm";
import { ScenariosView } from "../components/ScenariosView";
import { QuestionnaireForm } from "../components/form/QuestionnaireForm";
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
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("dashboard"); // Default to dashboard for now
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [checkinQuestions, setCheckinQuestions] = useState<InterviewScenario[]>([]);
  const [scenariosData, setScenariosData] = useState<any>(null); // Full scenarios.json data
  const [template, setTemplate] = useState<Template | null>(null);
  
  // Selection State
  const [selectedDeckIndex, setSelectedDeckIndex] = useState<number>(0);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

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
        loadTemplate("default_template.json") // Default for now
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
    <div className="space-y-6 animate-fade-in p-4 pb-24">
      {/* Check-in Recommendation */}
      <div 
        onClick={() => setStage("checkin")}
        className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
           <div className="p-2 bg-primary/20 rounded-full text-primary">
             <MessageCircle className="h-5 w-5" />
           </div>
           <div>
             <h3 className="font-semibold">Check-in starten</h3>
             <p className="text-xs text-muted-foreground">Kurzes Warm-up (12 Fragen)</p>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 mt-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Themen-Wahl</h1>
          <p className="text-sm text-muted-foreground">Wähle dein nächstes Thema</p>
        </div>
      </div>

      {/* Section 1: Scenarios / Decks */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Szenarien Decks
        </h2>
        <div className="grid gap-3">
          {scenariosData?.decks?.map((deck: any, index: number) => (
            <div 
              key={deck.id}
              onClick={() => {
                setSelectedDeckIndex(index);
                setStage("deck");
              }}
              className="bg-surface border border-border/40 rounded-xl p-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-primary/30"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{deck.name}</h3>
                <span className="text-xs bg-accent px-2 py-1 rounded-full">
                  {deck.scenarios.length} Karten
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {deck.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Questionnaire Modules */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Vertiefungs-Module
        </h2>
        <div className="grid gap-3">
          {template?.modules?.map((module: any) => (
            <div 
              key={module.id}
              onClick={() => {
                setSelectedModuleId(module.id);
                setStage("module");
              }}
              className="bg-surface border border-border/40 rounded-xl p-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-primary/30"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{module.name}</h3>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {module.description}
              </p>
            </div>
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
        <div className="h-screen flex flex-col px-4 pt-4">
           <div className="flex items-center mb-4">
             <Button variant="ghost" onClick={() => setStage("dashboard")}>
               <ChevronLeft className="mr-2 h-4 w-4" /> Zurück
             </Button>
           </div>
           {/* 
              QuestionnaireForm loads full form but jumps to selected module
           */}
           <QuestionnaireForm 
             sessionId={sessionId} 
             person={person} 
             template={template}
             onComplete={() => setStage("dashboard")}
             initialModuleId={selectedModuleId}
           />
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
  person 
}: { 
  questions: InterviewScenario[], 
  onComplete: () => void,
  onExit: () => void,
  sessionId: string,
  person: "A" | "B"
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
         timestamp: new Date().toISOString()
       });
    }
    handleNext();
  }

  return (
    <div className="h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={onExit}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <span className="text-xs text-muted-foreground">Check-in {index + 1}/{questions.length}</span>
      </div>
      
      {/* Progress */}
      <div className="w-full h-1 bg-muted rounded-full mb-6">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <h2 className="text-xl font-bold mb-2">{currentQ.title}</h2>
        <p className="text-muted-foreground mb-6">{currentQ.scenario_text}</p>
        
        <InterviewMiniForm 
          scenario={currentQ}
          person={person}
          answer={answer}
          onChange={onAnswerChange}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50">
        <Button className="w-full h-12" onClick={saveAndNext}>
          {index === questions.length - 1 ? "Abschließen" : "Weiter"}
        </Button>
      </div>
    </div>
  );
}
