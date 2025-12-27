import { useState, useEffect, useRef } from "preact/hooks";
import { ChevronLeft, ChevronRight, Save, Check } from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ConsentRatingInput } from "./ConsentRatingInput";
import { ScaleInput } from "./ScaleInput";
import { EnumInput } from "./EnumInput";
import { MultiInput } from "./MultiInput";
import { InfoPopover } from "../InfoPopover";
import { loadResponses, saveResponses } from "../../services/api";
import type { Template, Question } from "../../types";
import type { ResponseMap, ResponseValue } from "../../types/form";

interface QuestionnaireFormProps {
  sessionId: string;
  person: "A" | "B";
  template: Template;
  onComplete?: () => void;
}

export function QuestionnaireForm({ sessionId, person, template, onComplete }: QuestionnaireFormProps) {
  const [responses, setResponses] = useState<ResponseMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Helper to normalize options to { value, label } format
  function normalizeOptions(options: string[] | Array<{ value: string; label: string }>): Array<{ value: string; label: string }> {
    if (options.length === 0) return [];
    
    if (typeof options[0] === 'string') {
      return (options as string[]).map(opt => ({ value: opt, label: opt }));
    }
    
    return options as Array<{ value: string; label: string }>;
  }

  // Flatten all questions from modules
  const allQuestions: (Question & { moduleId?: string })[] = [];
  if (template.modules) {
    for (const module of template.modules) {
      if (module.questions) {
        for (const q of module.questions) {
          allQuestions.push({ ...q, moduleId: module.id });
        }
      }
    }
  }

  const currentQuestion = allQuestions[currentIndex];
  const progress = allQuestions.length > 0 ? Math.round(((currentIndex + 1) / allQuestions.length) * 100) : 0;

  // Calculate module progress for enhanced visualization
  const currentModuleId = currentQuestion?.moduleId;
  const currentModule = template.modules?.find(m => m.id === currentModuleId);
  const moduleIndex = template.modules?.findIndex(m => m.id === currentModuleId) ?? 0;
  const totalModules = template.modules?.length ?? 0;

  // Get module phases for color coding
  const getModulePhase = (moduleId: string | undefined): string => {
    if (!moduleId) return "foundation";
    if (moduleId.includes("soft") || moduleId.includes("emotional") || moduleId.includes("logistics")) {
      return "foundation";
    } else if (moduleId.includes("touch") || moduleId.includes("sex") || moduleId.includes("sensory")) {
      return "exploration";
    } else if (moduleId.includes("power") || moduleId.includes("impact") || moduleId.includes("bondage")) {
      return "advanced";
    } else if (moduleId.includes("risk") || moduleId.includes("extreme")) {
      return "expert";
    } else if (moduleId.includes("future") || moduleId.includes("digital")) {
      return "lifestyle";
    }
    return "exploration";
  };

  const currentPhase = getModulePhase(currentModuleId);
  
  const phaseColors = {
    foundation: "bg-blue-500",
    exploration: "bg-green-500",
    advanced: "bg-yellow-500",
    expert: "bg-red-500",
    lifestyle: "bg-purple-500"
  };

  const phaseLabels = {
    foundation: "Fundament",
    exploration: "Erkundung",
    advanced: "Vertiefung",
    expert: "Expert:in",
    lifestyle: "Lebensstil"
  };

  useEffect(() => {
    loadExistingResponses();
  }, [sessionId, person]);

  async function loadExistingResponses() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadResponses(sessionId, person);
      setResponses(data.responses || {});
    } catch (err) {
      console.error('Failed to load responses:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  function scheduleAutoSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveResponses(sessionId, person, { responses });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  function handleAnswerChange(questionId: string, value: ResponseValue) {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
    scheduleAutoSave();
  }

  function goToNext() {
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  }

  function goToPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Lädt Fragebogen...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Keine Fragen im Template gefunden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar with Module Info */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Person {person}</span>
            {currentModule && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{currentModule.name}</span>
              </>
            )}
          </div>
          <span className="text-muted-foreground">
            Frage {currentIndex + 1} von {allQuestions.length} ({progress}%)
          </span>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative">
          {/* Main progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${phaseColors[currentPhase as keyof typeof phaseColors] || "bg-primary"}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Module phase indicator */}
          {totalModules > 1 && (
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${phaseColors[currentPhase as keyof typeof phaseColors] || "bg-primary"}`} />
                <span className="text-xs text-muted-foreground">
                  Phase: {phaseLabels[currentPhase as keyof typeof phaseLabels] || "Exploration"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Modul {moduleIndex + 1} von {totalModules}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl flex-1">
              {currentQuestion.text || currentQuestion.label}
            </CardTitle>
            {currentQuestion.info_details && (
              <InfoPopover
                title="Hintergrund & Psychologie"
                content={currentQuestion.info_details}
                className="flex-shrink-0"
              />
            )}
          </div>
          {currentQuestion.help && (
            <CardDescription className="text-base">
              {currentQuestion.help}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Render appropriate input based on schema */}
          {currentQuestion.schema === "consent_rating" && (
            <ConsentRatingInput
              value={responses[currentQuestion.id] as any}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            />
          )}

          {(currentQuestion.schema === "scale" || currentQuestion.schema === "slider") && (
            <ScaleInput
              value={responses[currentQuestion.id] as number}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              min={currentQuestion.min}
              max={currentQuestion.max}
              labels={currentQuestion.labels}
            />
          )}

          {currentQuestion.schema === "enum" && currentQuestion.options && (
            <EnumInput
              value={responses[currentQuestion.id] as string}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              options={normalizeOptions(currentQuestion.options)}
            />
          )}

          {currentQuestion.schema === "multi" && currentQuestion.options && (
            <MultiInput
              value={responses[currentQuestion.id] as string[]}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              options={normalizeOptions(currentQuestion.options)}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </Button>

            <Button
              onClick={goToNext}
              className="gap-2"
            >
              {currentIndex === allQuestions.length - 1 ? 'Fertig' : 'Weiter'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      <div className="flex items-center justify-between text-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Speichert...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Gespeichert
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Manuell speichern
            </>
          )}
        </Button>

        <span className="text-muted-foreground text-xs">
          Auto-Save aktiv
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

