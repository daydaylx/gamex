import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ChevronLeft, Send } from "lucide-preact";
import { Button } from "../ui/button";
import { ConsentRatingInput } from "./ConsentRatingInput";
import { ScaleInput } from "./ScaleInput";
import { EnumInput } from "./EnumInput";
import { MultiInput } from "./MultiInput";
import { TouchTextInput, QUICK_REPLIES } from "./TouchTextInput";
import { loadResponses, saveResponses } from "../../services/api";
import type { Template, Question } from "../../types";
import type { ResponseMap, ResponseValue, ConsentRatingValue } from "../../types/form";

const SAFETY_GATE_TEMPLATE_ID = "unified_v3_pure";
const SAFETY_GATE_STORAGE_PREFIX = "gamex:safety_gate";
const TYPING_DELAY_MS = 650;

const STATUS_LABELS: Record<string, string> = {
  YES: "Ja",
  MAYBE: "Vielleicht",
  NO: "Nein",
  HARD_LIMIT: "Hard Limit",
};

interface ChatQuestionnaireProps {
  sessionId: string;
  person: "A" | "B";
  template: Template;
  onComplete?: () => void;
  onExit?: () => void;
  initialModuleId?: string;
}

type ChatRole = "system" | "user";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  detail?: string;
}

function normalizeOptions(
  options: string[] | Array<{ value: string; label: string }>
): Array<{ value: string; label: string }> {
  if (options.length === 0) return [];

  if (typeof options[0] === "string") {
    return (options as string[]).map((opt) => ({ value: opt, label: opt }));
  }

  return options as Array<{ value: string; label: string }>;
}

function getQuickRepliesForQuestion(question: Question): string[] {
  const tags = question.tags || [];
  const label = (question.label || question.text || "").toLowerCase();

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
  if (
    tags.includes("highlight") ||
    label.includes("schoen") ||
    label.includes("sch\u00f6n") ||
    label.includes("oeffter") ||
    label.includes("\u00f6fter")
  ) {
    return QUICK_REPLIES.highlights;
  }
  if (tags.includes("less") || label.includes("weniger") || label.includes("pausieren")) {
    return QUICK_REPLIES.pauseList;
  }

  return QUICK_REPLIES.notes;
}

function getQuestionTitle(question?: Question): string {
  return question?.text || question?.label || "Frage";
}

function getConsentCoreValue(value: ConsentRatingValue): {
  status?: string;
  interest?: number;
  comfort?: number;
} {
  return {
    status:
      value.status ||
      value.dom_status ||
      value.sub_status ||
      value.active_status ||
      value.passive_status,
    interest:
      value.interest ??
      value.dom_interest ??
      value.sub_interest ??
      value.active_interest ??
      value.passive_interest,
    comfort:
      value.comfort ??
      value.dom_comfort ??
      value.sub_comfort ??
      value.active_comfort ??
      value.passive_comfort,
  };
}

function getScaleValue(response: ResponseValue): number | null {
  if (response === null || response === undefined) return null;
  if (typeof response === "number" && !isNaN(response)) return response;
  if (typeof response === "object" && response !== null && "value" in response) {
    const value = response.value as number | null;
    return value ?? null;
  }
  return null;
}

function getEnumValue(response: ResponseValue): string | null {
  if (response === null || response === undefined) return null;
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null && "value" in response) {
    return (response.value as string | null) ?? null;
  }
  return null;
}

function getMultiValues(response: ResponseValue): string[] {
  if (response === null || response === undefined) return [];
  if (Array.isArray(response)) return response as string[];
  if (typeof response === "object" && response !== null && "values" in response) {
    return (response.values as string[]) || [];
  }
  return [];
}

function getTextValue(response: ResponseValue): string {
  if (response === null || response === undefined) return "";
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null && "text" in response) {
    return String(response.text || "");
  }
  return "";
}

function normalizeForSave(question: Question, response: ResponseValue): ResponseValue {
  if (response === null || response === undefined) return response;

  switch (question.schema) {
    case "scale":
    case "slider":
    case "scale_1_10": {
      if (typeof response === "number") {
        return { value: response };
      }
      return response;
    }
    case "enum": {
      if (typeof response === "string") {
        return { value: response };
      }
      return response;
    }
    case "multi": {
      if (Array.isArray(response)) {
        return { values: response };
      }
      return response;
    }
    case "text": {
      if (typeof response === "string") {
        return { text: response };
      }
      return response;
    }
    default:
      return response;
  }
}

function formatResponse(question: Question, response: ResponseValue): string {
  if (response === null || response === undefined) return "Keine Antwort";

  switch (question.schema) {
    case "consent_rating": {
      if (typeof response !== "object" || response === null) return "Keine Antwort";
      const consent = response as ConsentRatingValue;
      const { status, interest, comfort } = getConsentCoreValue(consent);
      const statusLabel = (status && STATUS_LABELS[status]) || status || "Antwort";
      const parts = [statusLabel];
      if (interest !== null && interest !== undefined) {
        parts.push(`Interesse ${interest}/5`);
      }
      if (comfort !== null && comfort !== undefined) {
        parts.push(`Komfort ${comfort}/5`);
      }
      return parts.join(", ");
    }
    case "scale":
    case "slider":
    case "scale_1_10": {
      const value = getScaleValue(response);
      const max = question.schema === "scale_1_10" ? 10 : question.max || 5;
      return value !== null ? `${value}/${max}` : "Keine Antwort";
    }
    case "enum": {
      const value = getEnumValue(response);
      if (!value) return "Keine Antwort";
      const options = question.options ? normalizeOptions(question.options) : [];
      return options.find((opt) => opt.value === value)?.label || value;
    }
    case "multi": {
      const values = getMultiValues(response);
      if (values.length === 0) return "Keine Antwort";
      const options = question.options ? normalizeOptions(question.options) : [];
      const labelMap = new Map(options.map((opt) => [opt.value, opt.label]));
      return values.map((val) => labelMap.get(val) || val).join(", ");
    }
    case "text": {
      const text = getTextValue(response);
      return text.trim().length > 0 ? text : "Keine Antwort";
    }
    default:
      return "Antwort gespeichert";
  }
}

function isMainAnswerValid(question: Question, response: ResponseValue): boolean {
  if (response === null || response === undefined) return false;

  switch (question.schema) {
    case "consent_rating": {
      if (typeof response !== "object" || response === null) return false;
      const consent = response as ConsentRatingValue;
      const { status, interest } = getConsentCoreValue(consent);
      return Boolean(status && interest !== null && interest !== undefined);
    }
    case "scale":
    case "slider":
    case "scale_1_10": {
      if (typeof response === "number") return !isNaN(response);
      if (typeof response === "object" && response !== null && "value" in response) {
        const value = response.value as number | null;
        return value !== null && value !== undefined && !isNaN(value);
      }
      return false;
    }
    case "enum": {
      if (typeof response === "string") return response.length > 0;
      if (typeof response === "object" && response !== null && "value" in response) {
        const value = response.value as string | null;
        return Boolean(value && value.length > 0);
      }
      return false;
    }
    case "multi": {
      if (Array.isArray(response)) return response.length > 0;
      if (typeof response === "object" && response !== null && "values" in response) {
        const values = response.values as string[];
        return Array.isArray(values) && values.length > 0;
      }
      return false;
    }
    case "text": {
      if (typeof response === "string") return response.trim().length > 0;
      if (typeof response === "object" && response !== null && "text" in response) {
        const text = response.text as string;
        return typeof text === "string" && text.trim().length > 0;
      }
      return false;
    }
    default:
      return true;
  }
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

  const { allQuestions, moduleStartIndices } = useMemo(() => {
    const questions: (Question & { moduleId?: string; moduleIndex?: number })[] = [];
    const moduleStarts: number[] = [];

    if (template.modules) {
      let questionIndex = 0;
      for (let mIdx = 0; mIdx < template.modules.length; mIdx++) {
        const module = template.modules[mIdx];
        moduleStarts.push(questionIndex);
        if (module.questions) {
          for (const q of module.questions) {
            questions.push({ ...q, moduleId: module.id, moduleIndex: mIdx });
            questionIndex++;
          }
        }
      }
    }

    return { allQuestions: questions, moduleStartIndices: moduleStarts };
  }, [template.modules]);

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
    if (!currentQuestion) return;
    setDraftResponse(responses[currentQuestion.id] ?? null);
  }, [currentQuestion?.id]);

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
      text: formatResponse(question, response),
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
      if (response && isMainAnswerValid(question, response)) {
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

    setMessages(history);
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
    const normalized = normalizeForSave(currentQuestion, draftResponse);
    if (!isMainAnswerValid(currentQuestion, normalized)) return;

    const nextResponses = {
      ...responses,
      [currentQuestion.id]: normalized,
    };
    setResponses(nextResponses);
    setMessages((prev) => [...prev, createUserMessage(currentQuestion, normalized)]);
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
        setMessages((prev) => [...prev, createSystemMessage(allQuestions[nextIndex])]);
        setCurrentIndex(nextIndex);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: "complete", role: "system", text: "Alles beantwortet. Danke dir." },
        ]);
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
      setIsTyping(false);
    }, TYPING_DELAY_MS);
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
        <div className="chat-stream-inner relative max-w-2xl mx-auto w-full px-4 pt-6 pb-32 space-y-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {isTyping && (
            <ChatBubble
              message={{
                id: "typing",
                role: "system",
                text: "Partner schreibt...",
              }}
              typing
            />
          )}

          {error && (
            <div className="chat-error">{error}</div>
          )}

          <div ref={chatEndRef} />
          <div className="h-32" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 chat-input-stage pb-safe">
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
                {currentQuestion ? getQuestionTitle(currentQuestion) : "Alles beantwortet"}
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
                    <ConsentRatingInput
                      value={draftResponse as ConsentRatingValue}
                      onChange={(value) => setDraftResponse(value)}
                      disabled={isTyping || saving}
                    />
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

              <div className="flex justify-end">
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
  const label = isUser ? "Du" : "Butler";

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
