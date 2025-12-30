import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ChevronDown, ChevronLeft, ChevronUp, Send, Sparkles } from "lucide-preact";
import { Button } from "../ui/button";
import { ConsentRatingInput } from "./ConsentRatingInput";
import { ConsentRatingVariantInput } from "./ConsentRatingVariantInput";
import { ScaleInput } from "./ScaleInput";
import { EnumInput } from "./EnumInput";
import { MultiInput } from "./MultiInput";
import { TouchTextInput } from "./TouchTextInput";
import { loadResponses, saveResponses } from "../../services/api";
import { askAIHelp } from "../../services/ai/help";
import { hasAPIKey } from "../../services/settings";
import type { Template, Question } from "../../types";
import type { AIHelpRequest } from "../../types/ai";
import type { ResponseMap, ResponseValue, ConsentRatingValue } from "../../types/form";
import {
  flattenTemplateQuestions,
  formatResponseForChat,
  getEnumValue,
  getMultiValues,
  getQuestionTitle,
  getQuickRepliesForQuestion,
  getScaleValue,
  getTextValue,
  isMainAnswerValid,
  normalizeOptions,
  normalizeResponseForSave,
} from "../../lib/questionnaire";

const SAFETY_GATE_TEMPLATE_ID = "unified_v3_pure";
const SAFETY_GATE_STORAGE_PREFIX = "gamex:safety_gate";
const TYPING_DELAY_MS = 650;
const MAX_CHAT_MESSAGES = 18;

interface ChatQuestionnaireProps {
  sessionId: string;
  person: "A" | "B";
  template: Template;
  onComplete?: () => void;
  onExit?: () => void;
  initialModuleId?: string;
}

type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  detail?: string;
}

function trimMessages(list: ChatMessage[]): ChatMessage[] {
  if (list.length <= MAX_CHAT_MESSAGES) return list;
  return list.slice(list.length - MAX_CHAT_MESSAGES);
}

export function ChatQuestionnaire({
  sessionId,
  person,
  template,
  onComplete,
  onExit,
  initialModuleId,
}: ChatQuestionnaireProps) {
  const isSafetyGateTemplate = template.id === SAFETY_GATE_TEMPLATE_ID;
  const safetyGateKey = `${SAFETY_GATE_STORAGE_PREFIX}:${sessionId}:${person}:${template.id}`;
  const [responses, setResponses] = useState<ResponseMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftResponse, setDraftResponse] = useState<ResponseValue | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [safetyChecks, setSafetyChecks] = useState({ safeword: false, boundaries: false });
  const [safetyGateAccepted, setSafetyGateAccepted] = useState(() => {
    if (!isSafetyGateTemplate) return true;
    try {
      return localStorage.getItem(safetyGateKey) === "true";
    } catch {
      return false;
    }
  });

  const typingTimeoutRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputStageRef = useRef<HTMLDivElement>(null);

  const { allQuestions, moduleStartIndices } = useMemo(
    () => flattenTemplateQuestions(template),
    [template]
  );

  const currentQuestion = allQuestions[currentIndex];
  const progress =
    allQuestions.length > 0
      ? Math.round(((Math.min(currentIndex + 1, allQuestions.length) || 0) / allQuestions.length) * 100)
      : 0;
  const currentModuleId = currentQuestion?.moduleId;
  const currentModule = template.modules?.find((m) => m.id === currentModuleId);
  const moduleLabel = currentModule?.name || "Allgemein";
  const isCurrentAnswerValid =
    currentQuestion && draftResponse ? isMainAnswerValid(currentQuestion, draftResponse) : false;
  const canConfirmSafety = safetyChecks.safeword && safetyChecks.boundaries;
  const canUseAI = hasAPIKey();

  useEffect(() => {
    loadExistingResponses();
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sessionId, person, initialModuleId, template.id]);

  useEffect(() => {
    if (!isSafetyGateTemplate) return;
    try {
      setSafetyGateAccepted(localStorage.getItem(safetyGateKey) === "true");
    } catch {
      setSafetyGateAccepted(false);
    }
  }, [isSafetyGateTemplate, safetyGateKey]);

  useEffect(() => {
    const stage = inputStageRef.current;
    if (!stage) return;

    const root = stage.closest(".chat-questionnaire") as HTMLElement | null;
    if (!root) return;

    const updateHeight = () => {
      const { height } = stage.getBoundingClientRect();
      root.style.setProperty("--chat-input-height", `${Math.round(height)}px`);

      const viewport = window.visualViewport;
      const offset = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      root.style.setProperty("--chat-input-offset", `${Math.round(offset)}px`);
    };

    updateHeight();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateHeight);
      observer.observe(stage);
    }

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", updateHeight);
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      observer?.disconnect();
      viewport?.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;
    setDraftResponse(responses[currentQuestion.id] ?? null);
  }, [currentQuestion?.id]);

  useEffect(() => {
    setAiQuestion("");
    setAiError(null);
    setShowAiHelper(false);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion) return;
    const notesKey = `${currentQuestion.id}_notes`;
    const conditionsKey = `${currentQuestion.id}_conditions`;
    const notesResponse = responses[notesKey];
    const conditionsResponse = responses[conditionsKey];

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
  }, [currentQuestion?.id, responses]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  function createSystemMessage(question: Question): ChatMessage {
    return {
      id: `q-${question.id}`,
      role: "system",
      text: getQuestionTitle(question),
      detail: question.help || undefined,
    };
  }

  function createUserMessage(question: Question, response: ResponseValue): ChatMessage {
    return {
      id: `a-${question.id}`,
      role: "user",
      text: formatResponseForChat(question, response),
    };
  }

  function createAIQuestionMessage(question: string): ChatMessage {
    return {
      id: `ai-q-${Date.now()}`,
      role: "user",
      text: question,
      detail: "Frage an KI",
    };
  }

  function createAIAnswerMessage(answer: string): ChatMessage {
    return {
      id: `ai-a-${Date.now()}`,
      role: "assistant",
      text: answer,
      detail: "KI-Antwort",
    };
  }

  function getStartIndex(): number {
    if (!initialModuleId || !template.modules) return 0;
    const moduleIndex = template.modules.findIndex((m) => m.id === initialModuleId);
    if (moduleIndex >= 0 && moduleIndex < moduleStartIndices.length) {
      return moduleStartIndices[moduleIndex];
    }
    return 0;
  }

  function buildHistory(data: ResponseMap) {
    const history: ChatMessage[] = [];
    const startIndex = getStartIndex();
    let nextIndex = startIndex;

    for (let i = startIndex; i < allQuestions.length; i++) {
      const question = allQuestions[i];
      const response = data[question.id];
      if (response !== null && response !== undefined && isMainAnswerValid(question, response)) {
        history.push(createSystemMessage(question));
        history.push(createUserMessage(question, response));
        nextIndex = i + 1;
      } else {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex < allQuestions.length) {
      history.push(createSystemMessage(allQuestions[nextIndex]));
    } else if (allQuestions.length > 0) {
      history.push({
        id: "complete",
        role: "system",
        text: "Alles beantwortet. Danke dir.",
      });
    }

    setMessages(trimMessages(history));
    setIsComplete(nextIndex >= allQuestions.length);
    const clampedIndex = Math.min(nextIndex, Math.max(allQuestions.length - 1, 0));
    setCurrentIndex(clampedIndex);
  }

  async function loadExistingResponses() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadResponses(sessionId, person);
      const responseMap = data || {};
      setResponses(responseMap);
      buildHistory(responseMap);
    } catch (err) {
      console.error("Failed to load responses:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!currentQuestion || !draftResponse || isTyping || saving) return;
    const normalized = normalizeResponseForSave(currentQuestion, draftResponse);
    if (!isMainAnswerValid(currentQuestion, normalized)) return;

    const nextResponses = {
      ...responses,
      [currentQuestion.id]: normalized,
    };
    setResponses(nextResponses);
    setMessages((prev) => trimMessages([...prev, createUserMessage(currentQuestion, normalized)]));
    setDraftResponse(null);
    setIsTyping(true);
    setError(null);

    setSaving(true);
    try {
      await saveResponses(sessionId, person, nextResponses);
    } catch (err) {
      console.error("Failed to save responses:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }

    const nextIndex = currentIndex + 1;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      if (nextIndex < allQuestions.length) {
        setMessages((prev) =>
          trimMessages([...prev, createSystemMessage(allQuestions[nextIndex])])
        );
        setCurrentIndex(nextIndex);
      } else {
        setMessages((prev) =>
          trimMessages([
            ...prev,
            { id: "complete", role: "system", text: "Alles beantwortet. Danke dir." },
          ])
        );
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
      setIsTyping(false);
    }, TYPING_DELAY_MS);
  }

  async function handleAskAI() {
    if (!currentQuestion || !aiQuestion.trim() || aiTyping) return;

    if (!canUseAI) {
      setAiError("OpenRouter API-Key ist nicht konfiguriert. Bitte in den Einstellungen setzen.");
      return;
    }

    const questionText = aiQuestion.trim();
    setAiError(null);
    setAiQuestion("");
    setShowAiHelper(false);
    setMessages((prev) => trimMessages([...prev, createAIQuestionMessage(questionText)]));
    setAiTyping(true);

    const request: AIHelpRequest = {
      questionId: currentQuestion.id,
      questionText: getQuestionTitle(currentQuestion),
      sectionTitle: moduleLabel,
      helpText: currentQuestion.help,
      answerType: currentQuestion.schema,
      options: currentQuestion.options,
      currentAnswer: draftResponse,
      userQuestion: questionText,
    };

    try {
      const response = await askAIHelp(request);
      setMessages((prev) => trimMessages([...prev, createAIAnswerMessage(response.answer)]));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "KI-Hilfe fehlgeschlagen");
    } finally {
      setAiTyping(false);
    }
  }

  function handleSafetyConfirm() {
    if (!isSafetyGateTemplate || !safetyChecks.safeword || !safetyChecks.boundaries) return;
    setSafetyGateAccepted(true);
    try {
      localStorage.setItem(safetyGateKey, "true");
    } catch {
      // Ignore storage failures; gate stays local to this session.
    }
  }

  function handleNotesChange(questionId: string, notes: string) {
    const notesKey = `${questionId}_notes`;
    setResponses((prev) => ({
      ...prev,
      [notesKey]: { text: notes } as ResponseValue,
    }));
  }

  function handleConditionsChange(questionId: string, conditions: string) {
    const conditionsKey = `${questionId}_conditions`;
    setResponses((prev) => ({
      ...prev,
      [conditionsKey]: { text: conditions } as ResponseValue,
    }));
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

  if (!currentQuestion && !isComplete) {
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

  if (isSafetyGateTemplate && !safetyGateAccepted) {
    return (
      <div className="page">
        <div className="page-header">
          {onExit && (
            <Button variant="ghost" size="icon" onClick={onExit}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="page-title">Safety Check</h2>
            <p className="page-subtitle">Bevor es losgeht, kurz bestaetigen.</p>
          </div>
        </div>

        <section className="section-card">
          <div className="section-header">
            <div>
              <p className="section-title">Safety First</p>
              <p className="section-subtitle">
                Da dieser Fragebogen direkt zur Sache geht, bitte kurz bestaetigen:
              </p>
            </div>
          </div>
          <div className="section-body">
            <label className="list-card items-start gap-3">
              <input
                type="checkbox"
                checked={safetyChecks.safeword}
                onChange={(e) =>
                  setSafetyChecks((prev) => ({
                    ...prev,
                    safeword: (e.target as HTMLInputElement).checked,
                  }))
                }
                className="mt-1 h-5 w-5"
              />
              <span className="text-sm text-foreground">
                Wir haben ein Safeword vereinbart (z.B. &quot;Rot&quot; oder &quot;Stop&quot;).
              </span>
            </label>
            <label className="list-card items-start gap-3">
              <input
                type="checkbox"
                checked={safetyChecks.boundaries}
                onChange={(e) =>
                  setSafetyChecks((prev) => ({
                    ...prev,
                    boundaries: (e.target as HTMLInputElement).checked,
                  }))
                }
                className="mt-1 h-5 w-5"
              />
              <span className="text-sm text-foreground">
                Wir achten auf koerperliche und emotionale Grenzen.
              </span>
            </label>
            <Button
              onClick={handleSafetyConfirm}
              disabled={!canConfirmSafety}
              size="lg"
              className="w-full"
            >
              Verstanden & starten
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="chat-questionnaire min-h-screen flex flex-col">
      <div className="chat-header sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-2xl mx-auto w-full px-4 pt-safe pb-3">
          <div className="flex items-center gap-3">
            {onExit && (
              <Button variant="ghost" size="icon" onClick={onExit}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground/80">
                Diskret
              </p>
              <p className="text-sm text-foreground/90 truncate">
                Person {person} - {moduleLabel}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {Math.min(currentIndex + 1, allQuestions.length)}/{allQuestions.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 chat-progress-track rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--chat-accent)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="chat-stream flex-1 overflow-y-auto">
        <div className="chat-stream-inner relative max-w-2xl mx-auto w-full px-4 pt-6 space-y-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {isTyping && (
            <ChatBubble
              message={{
                id: "typing",
                role: "system",
                text: "Guide schreibt...",
              }}
              typing
            />
          )}

          {aiTyping && (
            <ChatBubble
              message={{
                id: "ai-typing",
                role: "assistant",
                text: "KI schreibt...",
              }}
              typing
            />
          )}

          {error && (
            <div className="chat-error">{error}</div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <div
        ref={inputStageRef}
        className="fixed bottom-0 left-0 right-0 z-40 chat-input-stage pb-safe"
      >
        <div className="max-w-2xl mx-auto w-full px-4 pb-4">
          <div className="chat-sheet rounded-3xl border shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="flex justify-center pt-3">
              <div className="chat-sheet-handle" />
            </div>
            <div className="px-4 pt-4 pb-2">
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/70">
                Antwort
              </p>
              <p className="text-display text-base text-foreground/95">
                {currentQuestion ? `Auf: ${getQuestionTitle(currentQuestion)}` : "Alles beantwortet"}
              </p>
            </div>

            <div className="px-4 pb-4 space-y-4 max-h-[65vh] min-h-[280px] overflow-y-auto">
              {!currentQuestion || isComplete ? (
                <div className="chat-sheet-panel">
                  Alles beantwortet. Du kannst jetzt zurueckgehen.
                </div>
              ) : isTyping ? (
                <div className="chat-sheet-panel">Bitte kurz warten...</div>
              ) : (
                <div key={currentQuestion.id} className="space-y-4">
                  {currentQuestion.schema === "consent_rating" && (
                    <>
                      {currentQuestion.has_dom_sub ? (
                        <ConsentRatingVariantInput
                          variant="dom_sub"
                          value={draftResponse as ConsentRatingValue}
                          onChange={(value) => setDraftResponse(value)}
                          disabled={isTyping || saving}
                        />
                      ) : currentQuestion.has_active_passive ? (
                        <ConsentRatingVariantInput
                          variant="active_passive"
                          value={draftResponse as ConsentRatingValue}
                          onChange={(value) => setDraftResponse(value)}
                          disabled={isTyping || saving}
                        />
                      ) : (
                        <ConsentRatingInput
                          value={draftResponse as ConsentRatingValue}
                          onChange={(value) => setDraftResponse(value)}
                          disabled={isTyping || saving}
                        />
                      )}
                    </>
                  )}

                  {(currentQuestion.schema === "scale" ||
                    currentQuestion.schema === "slider" ||
                    currentQuestion.schema === "scale_1_10") && (
                    <ScaleInput
                      value={getScaleValue(draftResponse as ResponseValue) ?? undefined}
                      onChange={(value) =>
                        setDraftResponse({ value } as ResponseValue)
                      }
                      min={currentQuestion.schema === "scale_1_10" ? 1 : currentQuestion.min || 1}
                      max={currentQuestion.schema === "scale_1_10" ? 10 : currentQuestion.max || 10}
                      labels={currentQuestion.labels}
                      disabled={isTyping || saving}
                    />
                  )}

                  {currentQuestion.schema === "enum" && currentQuestion.options && (
                    <EnumInput
                      value={getEnumValue(draftResponse as ResponseValue) ?? undefined}
                      onChange={(value) =>
                        setDraftResponse({ value } as ResponseValue)
                      }
                      options={normalizeOptions(currentQuestion.options)}
                      disabled={isTyping || saving}
                    />
                  )}

                  {currentQuestion.schema === "multi" && currentQuestion.options && (
                    <MultiInput
                      value={getMultiValues(draftResponse as ResponseValue)}
                      onChange={(value) =>
                        setDraftResponse({ values: value } as ResponseValue)
                      }
                      options={normalizeOptions(currentQuestion.options)}
                      disabled={isTyping || saving}
                    />
                  )}

                  {currentQuestion.schema === "text" && (
                    <TouchTextInput
                      value={
                        getTextValue(draftResponse as ResponseValue)
                          ? ({ text: getTextValue(draftResponse as ResponseValue) } as {
                              text: string;
                            })
                          : undefined
                      }
                      onChange={(value) => setDraftResponse(value)}
                      placeholder={
                        currentQuestion.help ||
                        "Tippe auf eine Schnellantwort oder schreibe selbst..."
                      }
                      quickReplies={getQuickRepliesForQuestion(currentQuestion)}
                      disabled={isTyping || saving}
                    />
                  )}
                </div>
              )}

              {currentQuestion && !isComplete && !isTyping && (
                <div className="rounded-2xl border border-border/40 bg-background/40 p-3 space-y-3">
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Optional
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNotes((prev) => !prev)}
                    className={`list-card w-full text-left ${
                      showNotes ? "ring-2 ring-primary/30" : "card-interactive"
                    }`}
                    disabled={isTyping || saving}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="list-card-title">Notiz hinzufuegen</p>
                      <p className="list-card-meta">Persoenliche Ergaenzungen zur Frage.</p>
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
                        (responses[`${currentQuestion.id}_notes`] as { text: string } | undefined)
                          ?.text || ""
                      }
                      onInput={(e) =>
                        handleNotesChange(
                          currentQuestion.id,
                          (e.target as HTMLTextAreaElement).value
                        )
                      }
                      placeholder="Hier kannst du zusaetzliche Notizen zu dieser Frage hinterlassen..."
                      className="w-full min-h-[110px] px-3 py-2 border border-input rounded-xl bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{ fontSize: "16px" }}
                      disabled={isTyping || saving}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setShowConditions((prev) => !prev)}
                    className={`list-card w-full text-left ${
                      showConditions ? "ring-2 ring-primary/30" : "card-interactive"
                    }`}
                    disabled={isTyping || saving}
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
                        (
                          responses[`${currentQuestion.id}_conditions`] as
                            | { text: string }
                            | undefined
                        )?.text || ""
                      }
                      onInput={(e) =>
                        handleConditionsChange(
                          currentQuestion.id,
                          (e.target as HTMLTextAreaElement).value
                        )
                      }
                      placeholder="Hier kannst du Bedingungen oder Grenzen zu dieser Frage angeben..."
                      className="w-full min-h-[110px] px-3 py-2 border border-input rounded-xl bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{ fontSize: "16px" }}
                      disabled={isTyping || saving}
                    />
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAiHelper((prev) => !prev)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    disabled={!currentQuestion}
                  >
                    <Sparkles className="h-4 w-4" />
                    KI Hilfe (optional)
                  </button>
                  <Button
                    onClick={handleSend}
                    disabled={
                      isTyping ||
                      saving ||
                      isComplete ||
                      !currentQuestion ||
                      !isCurrentAnswerValid
                    }
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg shadow-rose-500/20 bg-rose-600 text-white hover:bg-rose-500"
                    aria-label="Senden"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>

                {showAiHelper && (
                  <div className="rounded-2xl border border-border/40 bg-background/40 p-3 space-y-3">
                    <label className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                      Frage an KI
                    </label>
                    <textarea
                      value={aiQuestion}
                      onInput={(e) => setAiQuestion((e.target as HTMLTextAreaElement).value)}
                      placeholder="z.B. Was bedeutet die Frage genau?"
                      className="w-full min-h-[84px] px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={aiTyping}
                    />
                    {!canUseAI && (
                      <p className="text-xs text-muted-foreground">
                        KI benötigt einen OpenRouter API-Key in den Einstellungen.
                      </p>
                    )}
                    {aiError && <p className="text-xs text-destructive">{aiError}</p>}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAskAI}
                        disabled={!aiQuestion.trim() || aiTyping || !canUseAI}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        {aiTyping ? "KI schreibt..." : "Frage senden"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {saving && (
            <p className="mt-3 text-xs text-muted-foreground">Antwort wird gespeichert...</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, typing = false }: { message: ChatMessage; typing?: boolean }) {
  const isUser = message.role === "user";
  const label = isUser ? "Du" : message.role === "assistant" ? "KI" : "Guide";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] ${isUser ? "text-right" : "text-left"}`}>
        <p
          className={`text-[0.65rem] uppercase tracking-[0.2em] mb-1 ${
            isUser ? "chat-label-user" : "chat-label-system"
          }`}
        >
          {label}
        </p>
        <div
          className={`chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--system"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
        >
          <span
            className={`chat-bubble-tail ${
              isUser ? "chat-bubble-tail--user" : "chat-bubble-tail--system"
            }`}
          />
          {typing ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="chat-typing-dot animate-pulse" />
              <span className="chat-typing-dot animate-pulse" />
              <span className="chat-typing-dot animate-pulse" />
            </div>
          ) : (
            <>
              <span className="block">{message.text}</span>
              {message.detail && (
                <p
                  className={`mt-2 text-xs leading-relaxed ${
                    isUser ? "text-rose-100/80" : "text-muted-foreground"
                  }`}
                >
                  {message.detail}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
