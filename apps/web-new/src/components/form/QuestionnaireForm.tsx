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
  onExit?: () => void;
  initialModuleId?: string;
}

export function QuestionnaireForm({
  sessionId,
  person,
  template,
  onComplete,
  onExit,
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
  const totalModules = template.modules?.length ?? 0;

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
  const moduleLabel = currentModule?.name || "Allgemein";
  const questionTitle = currentQuestion?.text || currentQuestion?.label || "Frage";

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
      <div className="page">
        <section className="section-card">
          <div className="section-body text-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="section-subtitle mt-3">Fragen werden geladen...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="page">
        <section className="section-card">
          <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
            Keine Fragen im Template gefunden.
          </div>
        </section>
      </div>
    );
  }

  // Module Overview View
  if (showModuleOverview) {
    return (
      <div className="page">
        <div className="page-header">
          <Button variant="ghost" size="icon" onClick={() => setShowModuleOverview(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="page-title">Modul-Übersicht</h2>
            <p className="page-subtitle">Person {person} • Springe zu einem Modul.</p>
          </div>
        </div>

        <section className="section-card">
          <div className="section-body">
            {template.modules?.map((module, mIdx) => {
              const stats = getModuleStats(module);
              const isComplete = stats.answered === stats.total && stats.total > 0;
              const phase = getModulePhase(module.id);
              const isCurrent = mIdx === moduleIndex;
              const progressValue =
                stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0;

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => jumpToModule(mIdx)}
                  className={`list-card w-full text-left ${
                    isCurrent ? "ring-2 ring-primary/40" : "card-interactive"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs uppercase tracking-wide font-semibold px-2 py-1 rounded-full ${phaseColors[phase]}`}
                      >
                        {phaseLabels[phase]}
                      </span>
                      {isComplete && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                      {isCurrent && <span className="pill">Aktuell</span>}
                    </div>
                    <p className="list-card-title">{module.name}</p>
                    <p className="list-card-meta line-clamp-2">{module.description}</p>
                    <div className="progress-bar mt-3">
                      <div className="progress-bar-fill" style={{ width: `${progressValue}%` }} />
                    </div>
                  </div>
                  <span className="pill">
                    {stats.answered}/{stats.total}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="section-card">
          <div className="section-body">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold">
                  {
                    Object.keys(responses).filter(
                      (k) => !k.includes("_notes") && !k.includes("_conditions")
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Beantwortet</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{allQuestions.length}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{progress}%</p>
                <p className="text-sm text-muted-foreground">Fortschritt</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="page"
      onTouchStart={handleTouchStart as any}
      onTouchMove={handleTouchMove as any}
      onTouchEnd={handleTouchEnd}
    >
      <div className="page-header">
        {onExit && (
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="page-title">Fragebogen</h2>
          <p className="page-subtitle">
            Person {person} • {moduleLabel}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowModuleOverview(true)}>
            <Layers className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="section-title">Fortschritt</p>
            <p className="section-subtitle">
              Frage {currentIndex + 1} von {allQuestions.length}
              {totalModules > 0 ? ` • Modul ${moduleIndex + 1}/${totalModules}` : ""}
            </p>
          </div>
          <span
            className={`text-xs uppercase tracking-wide font-semibold px-2 py-1 rounded-full ${phaseColors[currentPhase]}`}
          >
            {phaseLabels[currentPhase] || "Exploration"}
          </span>
        </div>
        <div className="section-body">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% erledigt</span>
            <span>Wischen zum Navigieren</span>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="section-title">Aktuelle Frage</p>
            <p className="section-subtitle">Beantworte die Frage so konkret wie möglich.</p>
          </div>
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
        <div className="section-body">
          <div className="space-y-2">
            <h3 className="text-display text-xl">{questionTitle}</h3>
            {currentQuestion.help && <p className="section-subtitle">{currentQuestion.help}</p>}
          </div>

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
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="section-title">Optional</p>
            <p className="section-subtitle">Ergänze Notizen oder Bedingungen.</p>
          </div>
        </div>
        <div className="section-body">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`list-card w-full text-left ${showNotes ? "ring-2 ring-primary/30" : "card-interactive"}`}
          >
            <div className="flex-1 min-w-0">
              <p className="list-card-title">Notiz hinzufügen</p>
              <p className="list-card-meta">Persönliche Ergänzungen zur Frage.</p>
            </div>
            {showNotes ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showNotes && (
            <textarea
              value={
                (responses[`${currentQuestion.id}_notes`] as { text: string } | undefined)?.text ||
                ""
              }
              onChange={(e) =>
                handleNotesChange(currentQuestion.id, (e.target as HTMLTextAreaElement).value)
              }
              placeholder="Hier kannst du zusätzliche Notizen zu dieser Frage hinterlassen..."
              className="w-full min-h-[120px] px-3 py-2 border border-input rounded-xl bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              style={{ fontSize: "16px" }}
            />
          )}

          <button
            type="button"
            onClick={() => setShowConditions(!showConditions)}
            className={`list-card w-full text-left ${showConditions ? "ring-2 ring-primary/30" : "card-interactive"}`}
          >
            <div className="flex-1 min-w-0">
              <p className="list-card-title">Bedingungen/Grenzen</p>
              <p className="list-card-meta">Spezifische Voraussetzungen festhalten.</p>
            </div>
            {showConditions ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showConditions && (
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
              className="w-full min-h-[120px] px-3 py-2 border border-input rounded-xl bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              style={{ fontSize: "16px" }}
            />
          )}
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="section-title">Navigation</p>
            <p className="section-subtitle">Weiter, wenn die Antwort passt.</p>
          </div>
          <span className="pill">
            {currentIndex + 1}/{allQuestions.length}
          </span>
        </div>
        <div className="section-body">
          <div className="flex flex-col sm:flex-row gap-3">
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
              className="gap-2 min-h-[48px] flex-1"
            >
              {currentIndex === allQuestions.length - 1 ? "Fertig" : "Weiter"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="list-card">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {saving ? (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Save className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="list-card-title">
                  {saving ? "Speichert..." : saveSuccess ? "Gespeichert" : "Auto-Save aktiv"}
                </p>
                <p className="list-card-meta">Änderungen werden automatisch gesichert.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              Manuell speichern
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <section className="section-card">
          <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        </section>
      )}
    </div>
  );
}
