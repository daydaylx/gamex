/**
 * Comparison Service
 * Compares two people's responses and generates match/explore/boundary analysis
 */

import type { Template, Question } from "../../types";
import type { ResponseMap, ResponseValue, ConsentRatingValue } from "../../types/form";
import type { CompareResponse, ComparisonResult, MatchLevel } from "../../types/compare";

/**
 * Determines the pair status based on two consent statuses
 */
function statusPair(a: string | undefined, b: string | undefined): MatchLevel {
  const statusA = a || "";
  const statusB = b || "";

  // BOUNDARY: One person has HARD_LIMIT
  if (statusA === "HARD_LIMIT" || statusB === "HARD_LIMIT") {
    return "BOUNDARY";
  }

  // BOUNDARY: One YES, one NO
  if ((statusA === "YES" && statusB === "NO") || (statusA === "NO" && statusB === "YES")) {
    return "BOUNDARY";
  }

  // MATCH: Both YES
  if (statusA === "YES" && statusB === "YES") {
    return "MATCH";
  }

  // EXPLORE: Everything else (MAYBE combinations, NO+NO, etc.)
  return "EXPLORE";
}

/**
 * Safely converts a value to an integer, returns null for invalid values
 */
function safeInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const num = Number(v);
  if (isNaN(num)) return null;
  return Math.floor(num);
}

/**
 * Calculates absolute difference between two values
 */
function absDelta(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Math.abs(a - b);
}

/**
 * Flags entries where either person has high interest but low comfort
 */
function flagLowComfortHighInterest(entry: ComparisonResult): boolean {
  const checkPair = (interest: number | null, comfort: number | null): boolean => {
    if (interest === null || comfort === null) return false;
    return interest >= 3 && comfort <= 2;
  };

  // Check person A
  if (entry.interest_a !== null && entry.comfort_a !== null) {
    if (checkPair(entry.interest_a, entry.comfort_a)) {
      return true;
    }
  }

  // Check person B
  if (entry.interest_b !== null && entry.comfort_b !== null) {
    if (checkPair(entry.interest_b, entry.comfort_b)) {
      return true;
    }
  }

  return false;
}

/**
 * Generates action plan from comparison results
 * Returns top suggestions based on matches with high comfort
 */
function generateActionPlan(items: ComparisonResult[]): string[] {
  interface ScoredItem {
    label: string;
    score: number;
    moduleId: string;
  }

  const scored: ScoredItem[] = [];

  for (const item of items) {
    // Only include MATCH items
    if (item.pair_status !== "MATCH") continue;

    // Both must have comfort >= 3
    const comfortA = item.comfort_a ?? 0;
    const comfortB = item.comfort_b ?? 0;
    if (comfortA < 3 || comfortB < 3) continue;

    // Calculate score: average of interests
    const interestA = item.interest_a ?? 0;
    const interestB = item.interest_b ?? 0;
    const score = (interestA + interestB) / 2;

    scored.push({
      label: item.label || item.question_id,
      score,
      moduleId: item.module_id || "",
    });
  }

  // Sort by score descending
  scored.sort((x, y) => y.score - x.score);

  // Take top items with diversity
  const result: string[] = [];
  const usedModules = new Set<string>();

  for (const item of scored) {
    if (result.length >= 3) break;

    // Prefer diversity across modules
    if (!usedModules.has(item.moduleId)) {
      result.push(item.label);
      usedModules.add(item.moduleId);
    }
  }

  // Fill remaining slots if needed
  for (const item of scored) {
    if (result.length >= 3) break;
    if (!result.includes(item.label)) {
      result.push(item.label);
    }
  }

  return result;
}

/**
 * Main comparison function
 * Compares two sets of responses and returns detailed analysis
 */
export function compare(
  template: Template | null | undefined,
  respA: ResponseMap | null | undefined,
  respB: ResponseMap | null | undefined,
  scenarios?: Record<string, ResponseValue> | null
): CompareResponse {
  const items: ComparisonResult[] = [];

  if (!template || !template.modules || !respA || !respB) {
    return {
      items: [],
      action_plan: [],
    };
  }

  // Build question map
  const questionMap: Record<string, Question> = {};
  for (const mod of template.modules) {
    for (const q of mod.questions || []) {
      questionMap[q.id] = q;
    }
  }

  // Compare each question
  const allQuestionIds = new Set([...Object.keys(respA), ...Object.keys(respB)]);

  for (const qid of allQuestionIds) {
    const question = questionMap[qid];
    if (!question) continue;

    const dataA = respA[qid];
    const dataB = respB[qid];

    const schema = question.schema;
    const riskLevel = question.risk_level || "A";
    const label = question.label || qid;
    const moduleId = findModuleId(template, qid);

    const entry: ComparisonResult = {
      question_id: qid,
      label,
      schema,
      risk_level: riskLevel,
      module_id: moduleId,
      pair_status: "EXPLORE",
      status_a: null,
      status_b: null,
      interest_a: null,
      interest_b: null,
      comfort_a: null,
      comfort_b: null,
      value_a: null,
      value_b: null,
      delta_interest: null,
      delta_comfort: null,
      flags: [],
    };

    if (schema === "consent_rating") {
      handleConsentRating(entry, dataA, dataB);
    } else if (schema === "scale_1_10") {
      handleScale(entry, dataA, dataB);
    } else if (schema === "enum") {
      handleEnum(entry, dataA, dataB);
    } else if (schema === "multi") {
      handleMulti(entry, dataA, dataB);
    } else if (schema === "text") {
      handleText(entry, dataA, dataB);
    } else if (schema === "scenario") {
      handleScenario(entry, dataA, dataB, scenarios || {});
    }

    items.push(entry);
  }

  // Sort items: BOUNDARY > EXPLORE > MATCH, then by risk level, module, question_id
  const order: Record<MatchLevel, number> = { BOUNDARY: 0, EXPLORE: 1, MATCH: 2 };
  items.sort((x, y) => {
    const ax = order[x.pair_status];
    const ay = order[y.pair_status];
    if (ax !== ay) return ax - ay;

    const rx = x.risk_level === "C" ? 0 : 1;
    const ry = y.risk_level === "C" ? 0 : 1;
    if (rx !== ry) return rx - ry;

    const mx = x.module_id || "";
    const my = y.module_id || "";
    if (mx !== my) return mx.localeCompare(my);

    return x.question_id.localeCompare(y.question_id);
  });

  // Generate action plan
  const actionPlan = generateActionPlan(items);

  return {
    items,
    action_plan: actionPlan,
  };
}

/**
 * Finds the module ID for a given question ID
 */
function findModuleId(template: Template, questionId: string): string {
  for (const mod of template.modules || []) {
    for (const q of mod.questions || []) {
      if (q.id === questionId) {
        return mod.id;
      }
    }
  }
  return "";
}

/**
 * Handles consent_rating schema comparison
 */
function handleConsentRating(
  entry: ComparisonResult,
  dataA: ResponseValue | undefined,
  dataB: ResponseValue | undefined
): void {
  const objA = (typeof dataA === "object" && dataA !== null ? dataA : {}) as ConsentRatingValue;
  const objB = (typeof dataB === "object" && dataB !== null ? dataB : {}) as ConsentRatingValue;

  // Detect variant
  const hasDomSubA = objA.dom_status || objA.sub_status;
  const hasDomSubB = objB.dom_status || objB.sub_status;
  const hasActivePassiveA = objA.active_status || objA.passive_status;
  const hasActivePassiveB = objB.active_status || objB.passive_status;

  if (hasDomSubA || hasDomSubB) {
    // Dom/Sub variant - use dom as primary
    entry.status_a = objA.dom_status || null;
    entry.status_b = objB.dom_status || null;
    entry.interest_a = safeInt(objA.dom_interest);
    entry.interest_b = safeInt(objB.dom_interest);
    entry.comfort_a = safeInt(objA.dom_comfort);
    entry.comfort_b = safeInt(objB.dom_comfort);
  } else if (hasActivePassiveA || hasActivePassiveB) {
    // Active/Passive variant - use active as primary
    entry.status_a = objA.active_status || null;
    entry.status_b = objB.active_status || null;
    entry.interest_a = safeInt(objA.active_interest);
    entry.interest_b = safeInt(objB.active_interest);
    entry.comfort_a = safeInt(objA.active_comfort);
    entry.comfort_b = safeInt(objB.active_comfort);
  } else {
    // Standard variant
    entry.status_a = objA.dom_status || objA.status || null;
    entry.status_b = objB.dom_status || objB.status || null;
    entry.interest_a = safeInt(objA.interest);
    entry.interest_b = safeInt(objB.interest);
    entry.comfort_a = safeInt(objA.comfort);
    entry.comfort_b = safeInt(objB.comfort);
  }

  // Calculate pair status
  entry.pair_status = statusPair(entry.status_a || undefined, entry.status_b || undefined);

  // Calculate deltas
  entry.delta_interest = absDelta(entry.interest_a, entry.interest_b);
  entry.delta_comfort = absDelta(entry.comfort_a, entry.comfort_b);

  // Generate flags
  if (flagLowComfortHighInterest(entry)) {
    entry.flags.push("low_comfort_high_interest");
  }

  if (entry.delta_interest !== null && entry.delta_interest >= 2) {
    entry.flags.push("big_delta");
  }

  if (entry.risk_level === "C") {
    entry.flags.push("high_risk");
  }

  if (entry.status_a === "HARD_LIMIT" || entry.status_b === "HARD_LIMIT") {
    entry.flags.push("hard_limit_violation");
  }
}

/**
 * Handles scale_1_10 schema comparison
 */
function handleScale(
  entry: ComparisonResult,
  dataA: ResponseValue | undefined,
  dataB: ResponseValue | undefined
): void {
  const valA = typeof dataA === "object" && dataA !== null && "value" in dataA ? dataA.value : null;
  const valB = typeof dataB === "object" && dataB !== null && "value" in dataB ? dataB.value : null;

  const numA = safeInt(valA);
  const numB = safeInt(valB);

  entry.value_a = numA;
  entry.value_b = numB;

  // Match if both answered and values are close (delta <= 2)
  if (numA !== null && numB !== null) {
    const delta = Math.abs(numA - numB);
    entry.pair_status = delta <= 2 ? "MATCH" : "EXPLORE";

    if (delta >= 3) {
      entry.flags.push("big_delta");
    }
  } else {
    entry.pair_status = "EXPLORE";
  }
}

/**
 * Handles enum schema comparison
 */
function handleEnum(
  entry: ComparisonResult,
  dataA: ResponseValue | undefined,
  dataB: ResponseValue | undefined
): void {
  const valA = typeof dataA === "object" && dataA !== null && "value" in dataA ? dataA.value : null;
  const valB = typeof dataB === "object" && dataB !== null && "value" in dataB ? dataB.value : null;

  entry.value_a = valA as ResponseValue;
  entry.value_b = valB as ResponseValue;

  // Match if both answered and same value
  if (valA !== null && valB !== null) {
    entry.pair_status = valA === valB ? "MATCH" : "EXPLORE";
  } else {
    entry.pair_status = "EXPLORE";
  }
}

/**
 * Handles multi schema comparison
 */
function handleMulti(
  entry: ComparisonResult,
  dataA: ResponseValue | undefined,
  dataB: ResponseValue | undefined
): void {
  const arrA =
    typeof dataA === "object" && dataA !== null && "values" in dataA ? dataA.values : null;
  const arrB =
    typeof dataB === "object" && dataB !== null && "values" in dataB ? dataB.values : null;

  entry.value_a = (Array.isArray(arrA) ? arrA : null) as ResponseValue;
  entry.value_b = (Array.isArray(arrB) ? arrB : null) as ResponseValue;

  // Calculate overlap
  if (Array.isArray(entry.value_a) && Array.isArray(entry.value_b)) {
    const setA = new Set(entry.value_a);
    const setB = new Set(entry.value_b);
    const intersection = [...setA].filter((x) => setB.has(x));

    // Match if at least one common value
    entry.pair_status = intersection.length > 0 ? "MATCH" : "EXPLORE";
  } else {
    entry.pair_status = "EXPLORE";
  }
}

/**
 * Handles text schema comparison
 */
function handleText(
  entry: ComparisonResult,
  dataA: ResponseValue | undefined,
  dataB: ResponseValue | undefined
): void {
  const textA = typeof dataA === "object" && dataA !== null && "text" in dataA ? dataA.text : null;
  const textB = typeof dataB === "object" && dataB !== null && "text" in dataB ? dataB.text : null;

  entry.value_a = textA as ResponseValue;
  entry.value_b = textB as ResponseValue;

  // Always EXPLORE for text (no automatic matching)
  entry.pair_status = "EXPLORE";
}

/**
 * Handles scenario schema comparison
 */
function handleScenario(
  entry: ComparisonResult,
  dataA: ResponseValue | undefined,
  dataB: ResponseValue | undefined,
  scenarios: Record<string, ResponseValue>
): void {
  const scenarioIdA =
    typeof dataA === "object" && dataA !== null && "scenario_id" in dataA
      ? dataA.scenario_id
      : null;
  const scenarioIdB =
    typeof dataB === "object" && dataB !== null && "scenario_id" in dataB
      ? dataB.scenario_id
      : null;

  entry.value_a = scenarioIdA as ResponseValue;
  entry.value_b = scenarioIdB as ResponseValue;

  // If both selected same scenario, compare that scenario's data
  if (scenarioIdA && scenarioIdB && scenarioIdA === scenarioIdB) {
    const scenarioData = scenarios[scenarioIdA as string];
    if (scenarioData && typeof scenarioData === "object" && "status" in scenarioData) {
      // Treat like consent_rating
      const objA = typeof dataA === "object" && dataA !== null ? dataA : {};
      const objB = typeof dataB === "object" && dataB !== null ? dataB : {};

      entry.status_a = (objA as Record<string, unknown>).status as string | null;
      entry.status_b = (objB as Record<string, unknown>).status as string | null;
      entry.interest_a = safeInt((objA as Record<string, unknown>).interest);
      entry.interest_b = safeInt((objB as Record<string, unknown>).interest);
      entry.comfort_a = safeInt((objA as Record<string, unknown>).comfort);
      entry.comfort_b = safeInt((objB as Record<string, unknown>).comfort);

      entry.pair_status = statusPair(entry.status_a || undefined, entry.status_b || undefined);

      if (flagLowComfortHighInterest(entry)) {
        entry.flags.push("low_comfort_high_interest");
      }
    } else {
      entry.pair_status = "MATCH";
    }
  } else {
    entry.pair_status = "EXPLORE";
  }
}
