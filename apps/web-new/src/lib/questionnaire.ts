import type { Question, Template } from "../types";
import type { ConsentRatingValue, ResponseMap, ResponseValue } from "../types/form";

export const QUICK_REPLIES = {
  hardLimits: ["Keine Hard Limits", "Möchte ich persönlich besprechen", "Siehe Liste unten"],
  softLimits: ["Keine Soft Limits aktuell", "Vielleicht später erkunden", "Brauche mehr Zeit"],
  aftercare: [
    "Kuscheln & Nähe",
    "Wasser & Snacks",
    "Stille & Ruhe",
    "Reden & Austauschen",
    "Warme Decke",
    "Allein sein",
  ],
  fantasies: [
    "Möchte ich mündlich teilen",
    "Habe aktuell keine konkreten",
    "Muss darüber nachdenken",
  ],
  safewords: [
    "Ampelsystem (Rot/Gelb/Grün)",
    "Eigenes Safeword vereinbart",
    "Müssen wir noch festlegen",
  ],
  allergies: [
    "Keine bekannten Allergien",
    "Latexallergie",
    "Duftstoffallergie",
    "Siehe separaten Hinweis",
  ],
  notes: ["Keine weiteren Anmerkungen", "Später ergänzen", "Mündlich besprechen"],
  highlights: [
    "Mehr spontane Momente",
    "Mehr Zeit für Vorspiel",
    "Mehr Kommunikation",
    "Mehr Experimentierfreude",
  ],
  pauseList: [
    "Aktuell keine Pausen nötig",
    "Brauche Pause bei intensiven Praktiken",
    "Möchte langsamer vorgehen",
  ],
};

const STATUS_LABELS: Record<string, string> = {
  YES: "Ja",
  MAYBE: "Vielleicht",
  NO: "Nein",
  HARD_LIMIT: "Hard Limit",
};

export type QuestionWithModule = Question & { moduleId?: string; moduleIndex?: number };

export function flattenTemplateQuestions(template?: Template | null): {
  allQuestions: QuestionWithModule[];
  moduleStartIndices: number[];
} {
  const allQuestions: QuestionWithModule[] = [];
  const moduleStartIndices: number[] = [];

  if (!template?.modules) {
    return { allQuestions, moduleStartIndices };
  }

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

  return { allQuestions, moduleStartIndices };
}

export function normalizeOptions(
  options: string[] | Array<{ value: string; label: string }>
): Array<{ value: string; label: string }> {
  if (options.length === 0) return [];
  if (typeof options[0] === "string") {
    return (options as string[]).map((opt) => ({ value: opt, label: opt }));
  }
  return options as Array<{ value: string; label: string }>;
}

export function getQuickRepliesForQuestion(question: Question): string[] {
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
    label.includes("schön") ||
    label.includes("oeffter") ||
    label.includes("öfter")
  ) {
    return QUICK_REPLIES.highlights;
  }
  if (tags.includes("less") || label.includes("weniger") || label.includes("pausieren")) {
    return QUICK_REPLIES.pauseList;
  }

  return QUICK_REPLIES.notes;
}

export function getQuestionTitle(question?: Question): string {
  return question?.text || question?.label || "Frage";
}

export function getScaleValue(response: ResponseValue): number | null {
  if (response === null || response === undefined) return null;
  if (typeof response === "number" && !isNaN(response)) return response;
  if (typeof response === "object" && response !== null && "value" in response) {
    const value = response.value as number | null;
    return value ?? null;
  }
  return null;
}

export function getEnumValue(response: ResponseValue): string | null {
  if (response === null || response === undefined) return null;
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null && "value" in response) {
    return (response.value as string | null) ?? null;
  }
  return null;
}

export function getMultiValues(response: ResponseValue): string[] {
  if (response === null || response === undefined) return [];
  if (Array.isArray(response)) return response as string[];
  if (typeof response === "object" && response !== null && "values" in response) {
    return (response.values as string[]) || [];
  }
  return [];
}

export function getTextValue(response: ResponseValue): string {
  if (response === null || response === undefined) return "";
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null && "text" in response) {
    return String(response.text || "");
  }
  return "";
}

export type RawResponseValue = ResponseValue | number | string | string[];

export function normalizeResponseForSave(
  question: Question,
  response: RawResponseValue
): ResponseValue {
  if (response === null || response === undefined) return response;

  switch (question.schema) {
    case "scale":
    case "slider":
    case "scale_1_10": {
      if (typeof response === "number") {
        return { value: response };
      }
      return response as ResponseValue;
    }
    case "enum": {
      if (typeof response === "string") {
        return { value: response };
      }
      return response as ResponseValue;
    }
    case "multi": {
      if (Array.isArray(response)) {
        return { values: response };
      }
      return response as ResponseValue;
    }
    case "text": {
      if (typeof response === "string") {
        return { text: response };
      }
      return response as ResponseValue;
    }
    default:
      return response as ResponseValue;
  }
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

function isVariantAnswerValid(
  response: ConsentRatingValue,
  primary: "dom" | "sub" | "active" | "passive",
  secondary: "dom" | "sub" | "active" | "passive"
): boolean {
  const primaryStatus = response[`${primary}_status`];
  const secondaryStatus = response[`${secondary}_status`];
  const primaryInterest = response[`${primary}_interest`];
  const secondaryInterest = response[`${secondary}_interest`];

  return Boolean(
    primaryStatus &&
      secondaryStatus &&
      primaryInterest !== null &&
      primaryInterest !== undefined &&
      secondaryInterest !== null &&
      secondaryInterest !== undefined
  );
}

export function isMainAnswerValid(question: Question, response: ResponseValue): boolean {
  if (response === null || response === undefined) return false;

  switch (question.schema) {
    case "consent_rating": {
      if (typeof response !== "object" || response === null) return false;
      const consent = response as ConsentRatingValue;
      if (question.has_dom_sub) {
        return isVariantAnswerValid(consent, "dom", "sub");
      }
      if (question.has_active_passive) {
        return isVariantAnswerValid(consent, "active", "passive");
      }
      const { status, interest } = getConsentCoreValue(consent);
      return Boolean(status && interest !== null && interest !== undefined);
    }
    case "scale":
    case "slider":
    case "scale_1_10": {
      const value = getScaleValue(response);
      return value !== null && value !== undefined && !isNaN(value);
    }
    case "enum": {
      const value = getEnumValue(response);
      return Boolean(value && value.length > 0);
    }
    case "multi": {
      const values = getMultiValues(response);
      return values.length > 0;
    }
    case "text": {
      const text = getTextValue(response);
      return text.trim().length > 0;
    }
    default:
      return true;
  }
}

function formatConsentSide(
  response: ConsentRatingValue,
  key: "dom" | "sub" | "active" | "passive",
  label: string
): string {
  const status = response[`${key}_status`];
  const interest = response[`${key}_interest`];
  const comfort = response[`${key}_comfort`];
  const statusLabel = (status && STATUS_LABELS[status]) || status || "Antwort";
  const parts = [statusLabel];
  if (interest !== null && interest !== undefined) {
    parts.push(`Interesse ${interest}/5`);
  }
  if (comfort !== null && comfort !== undefined) {
    parts.push(`Komfort ${comfort}/5`);
  }
  return `${label}: ${parts.join(", ")}`;
}

export function formatResponseForChat(question: Question, response: ResponseValue): string {
  if (response === null || response === undefined) return "Keine Antwort";

  switch (question.schema) {
    case "consent_rating": {
      if (typeof response !== "object" || response === null) return "Keine Antwort";
      const consent = response as ConsentRatingValue;
      if (question.has_dom_sub) {
        return [
          formatConsentSide(consent, "dom", "Dom"),
          formatConsentSide(consent, "sub", "Sub"),
        ].join(" · ");
      }
      if (question.has_active_passive) {
        return [
          formatConsentSide(consent, "active", "Aktiv"),
          formatConsentSide(consent, "passive", "Passiv"),
        ].join(" · ");
      }
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

export function getAnsweredQuestionCount(
  template: Template | null | undefined,
  responses: ResponseMap | null | undefined
): number {
  if (!template?.modules || !responses) return 0;
  let answered = 0;
  for (const module of template.modules) {
    for (const question of module.questions || []) {
      const response = responses[question.id];
      if (response !== null && response !== undefined && isMainAnswerValid(question, response)) {
        answered++;
      }
    }
  }
  return answered;
}
