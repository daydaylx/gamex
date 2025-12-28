import { useState, useEffect, useRef } from "preact/hooks";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle,
} from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ConsentRatingInput } from "./ConsentRatingInput";
import { ScaleInput } from "./ScaleInput";
import { EnumInput } from "./EnumInput";
import { MultiInput } from "./MultiInput";
import { TouchTextInput, QUICK_REPLIES } from "./TouchTextInput";
import { InfoPopover } from "../InfoPopover";
import { AIHelpDialog } from "../AIHelpDialog";
import { loadResponses, saveResponses } from "../../services/api";
import type { Template, Question, Module } from "../../types";
import type { ResponseMap, ResponseValue, ConsentRatingValue } from "../../types/form";

interface QuestionnaireFormProps {
  sessionId: string;
  person: "A" | "B";
  template: Template;
  onComplete?: () => void;
  initialModuleId?: string;
}

export function QuestionnaireForm({
  sessionId,
  person,
  template,
  onComplete,
  initialModuleId,
}: QuestionnaireFormProps) {
  const [responses, setResponses] = useState<ResponseMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [showModuleOverview, setShowModuleOverview] = useState(false);

  // Swipe handling refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Helper to normalize options to { value, label } format
  function normalizeOptions(
    options: string[] | Array<{ value: string; label: string }>
  ): Array<{ value: string; label: string }> {
    if (options.length === 0) return [];

    if (typeof options[0] === "string") {
      return (options as string[]).map((opt) => ({ value: opt, label: opt }));
    }

    return options as Array<{ value: string; label: string }>;
  }

  // Get context-specific quick replies based on question tags
  function getQuickRepliesForQuestion(question: Question): string[] {
    const tags = question.tags || [];
    const label = (question.label || question.text || "").toLowerCase();

    // Check by tags first
    if (tags.includes("hard_limits") || label.includes("hard limit") || label.includes("tabu")) {
      return QUICK_REPLIES.hardLimits;
    }
    if (tags.includes("soft_limits") || label.includes("soft limit")) {
      return QUICK_REPLIES.softLimits;
    }
    if (tags.includes("aftercare")) {
      return QUICK_REPLIES.aftercare;
    }
    if (tags.includes("fantasy") || tags.includes("fantasies") || label.includes("fantasi")) {
      return QUICK_REPLIES.fantasies;
    }
    if (
      tags.includes("safewords") ||
      tags.includes("triggers") ||
      label.includes("safeword") ||
      label.includes("stop")
    ) {
      return QUICK_REPLIES.safewords;
    }
    if (
      tags.includes("allergies") ||
      tags.includes("health") ||
      label.includes("allergi") ||
      label.includes("gesundheit")
    ) {
      return QUICK_REPLIES.allergies;
    }
    if (tags.includes("highlight") || label.includes("schön") || label.includes("öfter")) {
      return QUICK_REPLIES.highlights;
    }
    if (tags.includes("less") || label.includes("weniger") || label.includes("pausieren")) {
      return QUICK_REPLIES.pauseList;
    }

    // Default quick replies
    return QUICK_REPLIES.notes;
  }

  // Flatten all questions from modules with module tracking
  const allQuestions: (Question & { moduleId?: string; moduleIndex?: number })[] = [];
  const moduleStartIndices: number[] = [];

  if (template.modules) {
    let questionIndex = 0;
    for (let mIdx = 0; mIdx < template.modules.length; mIdx++) {
      const module = template.modules[mIdx];
      moduleStartIndices.push(questionIndex);
      if (module.questions) {
        for (const q of module.questions) {
          allQuestions.push({ ...q, moduleId: module.id, moduleIndex: mIdx });
          questionIndex++;
        }
      }
    }
  }

  const currentQuestion = allQuestions[currentIndex];
  const progress =
    allQuestions.length > 0 ? Math.round(((currentIndex + 1) / allQuestions.length) * 100) : 0;

  // Calculate module progress for enhanced visualization
  const currentModuleId = currentQuestion?.moduleId;
  const currentModule = template.modules?.find((m) => m.id === currentModuleId);
  const moduleIndex = currentQuestion?.moduleIndex ?? 0;
  const _totalModules = template.modules?.length ?? 0;
  void _totalModules; // Reserved for future module progress display

  // Get module phases for color coding
  const getModulePhase = (moduleId: string | undefined): string => {
    if (!moduleId) return "foundation";
    if (
      moduleId.includes("soft") ||
      moduleId.includes("emotional") ||
      moduleId.includes("logistics") ||
      moduleId.includes("starter") ||
      moduleId.includes("base")
    ) {
      return "foundation";
    } else if (
      moduleId.includes("touch") ||
      moduleId.includes("sex") ||
      moduleId.includes("sensory") ||
      moduleId.includes("activities")
    ) {
      return "exploration";
    } else if (
      moduleId.includes("power") ||
      moduleId.includes("impact") ||
      moduleId.includes("bondage") ||
      moduleId.includes("roles")
    ) {
      return "advanced";
    } else if (
      moduleId.includes("risk") ||
      moduleId.includes("extreme") ||
      moduleId.includes("fetish") ||
      moduleId.includes("anal")
    ) {
      return "expert";
    } else if (
      moduleId.includes("future") ||
      moduleId.includes("digital") ||
      moduleId.includes("review")
    ) {
      return "lifestyle";
    }
    return "exploration";
  };

  const currentPhase = getModulePhase(currentModuleId);

  // Muted phase colors for better theme integration
  const phaseColors: Record<string, string> = {
    foundation: "bg-blue-500/80 text-blue-100",
    exploration: "bg-emerald-500/80 text-emerald-100",
    advanced: "bg-amber-500/80 text-amber-100",
    expert: "bg-red-500/80 text-red-100",
    lifestyle: "bg-purple-500/80 text-purple-100",
  };

  // Ring colors for active state (reserved for future use)
  const _phaseRings: Record<string, string> = {
    foundation: "ring-blue-500/30",
    exploration: "ring-emerald-500/30",
    advanced: "ring-amber-500/30",
    expert: "ring-red-500/30",
    lifestyle: "ring-purple-500/30",
  };
  void _phaseRings;

  const phaseLabels: Record<string, string> = {
    foundation: "Fundament",
    exploration: "Erkundung",
    advanced: "Vertiefung",
    expert: "Expert:in",
    lifestyle: "Lebensstil",
  };

  // Calculate answered questions per module
  function getModuleStats(module: Module): { total: number; answered: number } {
    const total = module.questions?.length || 0;
    const answered =
      module.questions?.filter((q) => {
        const response = responses[q.id];
        return response !== null && response !== undefined;
      }).length || 0;
    return { total, answered };
  }

  useEffect(() => {
    loadExistingResponses();
  }, [sessionId, person]);

  // Jump to initial module if provided
  useEffect(() => {
    if (initialModuleId && template.modules) {
      const mIdx = template.modules.findIndex((m) => m.id === initialModuleId);
      if (mIdx >= 0 && mIdx < moduleStartIndices.length) {
        setCurrentIndex(moduleStartIndices[mIdx]);
      }
    }
  }, [initialModuleId, template.modules]);

  // Update collapsible state when question changes
  useEffect(() => {
    if (currentQuestion) {
      const notesKey = `${currentQuestion.id}_notes`;
      const conditionsKey = `${currentQuestion.id}_conditions`;
      const notesResponse = responses[notesKey];
      const conditionsResponse = responses[conditionsKey];

      // Show notes section if there's existing notes
      if (
        notesResponse &&
        typeof notesResponse === "object" &&
        notesResponse !== null &&
        "text" in notesResponse
      ) {
        const notesText = (notesResponse as { text: string }).text;
        setShowNotes(Boolean(notesText && notesText.trim().length > 0));
      } else {
        setShowNotes(false);
      }

      // Show conditions section if there's existing conditions
      if (
        conditionsResponse &&
        typeof conditionsResponse === "object" &&
        conditionsResponse !== null &&
        "text" in conditionsResponse
      ) {
        const conditionsText = (conditionsResponse as { text: string }).text;
        setShowConditions(Boolean(conditionsText && conditionsText.trim().length > 0));
      } else {
        setShowConditions(false);
      }
    }
  }, [currentQuestion?.id, responses]);

  async function loadExistingResponses() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadResponses(sessionId, person);
      setResponses(data || {});
    } catch (err) {
      console.error("Failed to load responses:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
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
      await saveResponses(sessionId, person, responses);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  function handleAnswerChange(questionId: string, value: ResponseValue) {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    scheduleAutoSave();
  }

  function handleNotesChange(questionId: string, notes: string) {
    const notesKey = `${questionId}_notes`;
    setResponses((prev) => ({
      ...prev,
      [notesKey]: { text: notes } as ResponseValue,
    }));
    scheduleAutoSave();
  }

  function handleConditionsChange(questionId: string, conditions: string) {
    const conditionsKey = `${questionId}_conditions`;
    setResponses((prev) => ({
      ...prev,
      [conditionsKey]: { text: conditions } as ResponseValue,
    }));
    scheduleAutoSave();
  }

  // Check if main answer is valid for the current question
  function isMainAnswerValid(question: Question, response: ResponseValue): boolean {
    if (response === null || response === undefined) return false;

    switch (question.schema) {
      case "consent_rating": {
        if (typeof response !== "object" || response === null) return false;
        const consentValue = response as ConsentRatingValue;
        return !!(
          consentValue.status &&
          consentValue.interest !== null &&
          consentValue.interest !== undefined
        );
      }
      case "scale":
      case "slider":
      case "scale_1_10": {
        // Handle ScaleValue object
        if (typeof response === "object" && response !== null && "value" in response) {
          const scaleValue = response as { value: number | null };
          return (
            scaleValue.value !== null && scaleValue.value !== undefined && !isNaN(scaleValue.value)
          );
        }
        return false;
      }
      case "enum": {
        // Handle EnumValue object
        if (typeof response === "object" && response !== null && "value" in response) {
          const enumValue = response as { value: string | null };
          return (
            enumValue.value !== null && enumValue.value !== undefined && enumValue.value.length > 0
          );
        }
        return false;
      }
      case "multi": {
        // Handle MultiValue object
        if (typeof response === "object" && response !== null && "values" in response) {
          const multiValue = response as { values: string[] };
          return Array.isArray(multiValue.values) && multiValue.values.length > 0;
        }
        return false;
      }
      case "text": {
        if (typeof response === "object" && response !== null && "text" in response) {
          const textValue = response as { text: string };
          return typeof textValue.text === "string" && textValue.text.trim().length > 0;
        }
        return false;
      }
      default:
        return true;
    }
  }

  const currentResponse = responses[currentQuestion?.id];
  const isCurrentAnswerValid = currentQuestion
    ? isMainAnswerValid(currentQuestion, currentResponse)
    : false;

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

  function jumpToModule(mIdx: number) {
    if (mIdx >= 0 && mIdx < moduleStartIndices.length) {
      setCurrentIndex(moduleStartIndices[mIdx]);
      setShowModuleOverview(false);
    }
  }

  // Swipe handlers
  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: TouchEvent) {
    touchEndX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && isCurrentAnswerValid) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;
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

  // Module Overview View
  if (showModuleOverview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Modul-Übersicht</h2>
            <p className="text-sm text-muted-foreground">
              Person {person} • Springe zu einem Modul
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowModuleOverview(false)}>
            Zurück
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {template.modules?.map((module, mIdx) => {
            const stats = getModuleStats(module);
            const isComplete = stats.answered === stats.total && stats.total > 0;
            const phase = getModulePhase(module.id);
            const isCurrent = mIdx === moduleIndex;

            return (
              <Card
                key={module.id}
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                  isCurrent ? "ring-2 ring-primary" : ""
                } ${isComplete ? "bg-green-500/10" : ""}`}
                onClick={() => jumpToModule(mIdx)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-3 w-3 rounded-full ${phaseColors[phase]}`} />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {phaseLabels[phase]}
                        </span>
                        {isComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Aktuell
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-sm">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${phaseColors[phase]}`}
                        style={{
                          width: `${stats.total > 0 ? (stats.answered / stats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {stats.answered} / {stats.total} Fragen beantwortet
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Overall stats */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold">
                  {
                    Object.keys(responses).filter(
                      (k) => !k.includes("_notes") && !k.includes("_conditions")
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Beantwortet</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{allQuestions.length}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{progress}%</p>
                <p className="text-sm text-muted-foreground">Fortschritt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 pt-2"
      onTouchStart={handleTouchStart as any}
      onTouchMove={handleTouchMove as any}
      onTouchEnd={handleTouchEnd}
    >
      {/* Zen Mode Progress - Subtle top bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-background">
        <div
          className={`h-full transition-all duration-500 ${phaseColors[currentPhase].split(" ")[0]}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Zen Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <div
            className={`px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider ${phaseColors[currentPhase]}`}
          >
            {phaseLabels[currentPhase] || "Exploration"}
          </div>
          {currentModule && (
            <span className="text-sm text-muted-foreground font-medium hidden sm:inline-block">
              {currentModule.name}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowModuleOverview(true)}
          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Question Indicator (Minimal) */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 -mt-4 mb-2">
        <span>{currentModule?.name || "Allgemein"}</span>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl flex-1">
              {currentQuestion.text || currentQuestion.label}
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <InfoPopover
                title="Informationen zur Frage"
                infoDetails={currentQuestion.info_details}
                help={currentQuestion.help}
                examples={currentQuestion.examples}
              />
              <AIHelpDialog
                question={currentQuestion}
                sectionTitle={currentModule?.name}
                currentAnswer={currentResponse}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Render appropriate input based on schema */}
          {currentQuestion.schema === "consent_rating" && (
            <ConsentRatingInput
              value={responses[currentQuestion.id] as any}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            />
          )}

          {(currentQuestion.schema === "scale" ||
            currentQuestion.schema === "slider" ||
            currentQuestion.schema === "scale_1_10") && (
            <ScaleInput
              value={responses[currentQuestion.id] as number}
              onChange={(value) =>
                handleAnswerChange(currentQuestion.id, { value } as ResponseValue)
              }
              min={currentQuestion.schema === "scale_1_10" ? 1 : currentQuestion.min || 1}
              max={currentQuestion.schema === "scale_1_10" ? 10 : currentQuestion.max || 10}
              labels={currentQuestion.labels}
            />
          )}

          {currentQuestion.schema === "enum" && currentQuestion.options && (
            <EnumInput
              value={responses[currentQuestion.id] as string}
              onChange={(value) =>
                handleAnswerChange(currentQuestion.id, { value } as ResponseValue)
              }
              options={normalizeOptions(currentQuestion.options)}
            />
          )}

          {currentQuestion.schema === "multi" && currentQuestion.options && (
            <MultiInput
              value={responses[currentQuestion.id] as string[]}
              onChange={(value) =>
                handleAnswerChange(currentQuestion.id, { values: value } as ResponseValue)
              }
              options={normalizeOptions(currentQuestion.options)}
            />
          )}

          {currentQuestion.schema === "text" && (
            <TouchTextInput
              value={responses[currentQuestion.id] as { text: string }}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              placeholder={
                currentQuestion.help || "Tippe auf eine Schnellantwort oder schreibe selbst..."
              }
              quickReplies={getQuickRepliesForQuestion(currentQuestion)}
            />
          )}

          {/* Optional Fields - Notes */}
          <div className="space-y-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNotes ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Notiz ausblenden
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Notiz hinzufügen (optional)
                </>
              )}
            </button>

            {showNotes && (
              <div className="pt-2">
                <textarea
                  value={
                    (responses[`${currentQuestion.id}_notes`] as { text: string } | undefined)
                      ?.text || ""
                  }
                  onChange={(e) =>
                    handleNotesChange(currentQuestion.id, (e.target as HTMLTextAreaElement).value)
                  }
                  placeholder="Hier kannst du zusätzliche Notizen zu dieser Frage hinterlassen..."
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{ fontSize: "16px" }}
                />
              </div>
            )}
          </div>

          {/* Optional Fields - Conditions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowConditions(!showConditions)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConditions ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Bedingungen/Grenzen ausblenden
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Bedingungen/Grenzen hinzufügen (optional)
                </>
              )}
            </button>

            {showConditions && (
              <div className="pt-2">
                <textarea
                  value={
                    (responses[`${currentQuestion.id}_conditions`] as { text: string } | undefined)
                      ?.text || ""
                  }
                  onChange={(e) =>
                    handleConditionsChange(
                      currentQuestion.id,
                      (e.target as HTMLTextAreaElement).value
                    )
                  }
                  placeholder="Hier kannst du Bedingungen oder Grenzen zu dieser Frage angeben..."
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{ fontSize: "16px" }}
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="gap-2 min-h-[48px]"
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </Button>

            <Button
              onClick={goToNext}
              disabled={!isCurrentAnswerValid}
              className="gap-2 min-h-[48px]"
            >
              {currentIndex === allQuestions.length - 1 ? "Fertig" : "Weiter"}
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
          Auto-Save aktiv • Wische für Navigation
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
