/**
 * Follow-up Logic (Deterministic)
 * Clear rules for when to trigger follow-up questions - NO AI decision
 */

import type { InterviewAnswer, InterviewScenario } from "../types/interview";

/**
 * Check if follow-up should be triggered based on answer
 * Rule: interest_high_comfort_low = primary >= 4 && comfort <= 2
 */
export function shouldTriggerFollowup(
  answer: InterviewAnswer,
  scenario: InterviewScenario
): boolean {
  if (!scenario.followup_rules) return false;

  const condition = scenario.followup_rules.condition;

  // interest_high_comfort_low: primary >= 4 && comfort <= 2
  if (condition === "interest_high_comfort_low") {
    if (typeof answer.primary === "number" && answer.comfort !== undefined) {
      return answer.primary >= 4 && answer.comfort <= 2;
    }
    return false;
  }

  // skipped: answer was skipped
  if (condition === "skipped") {
    return answer.skipped === true;
  }

  // boundary: hard limit set (primary === 1 or "nein")
  if (condition === "boundary") {
    if (typeof answer.primary === "number") {
      return answer.primary === 1;
    }
    if (typeof answer.primary === "string") {
      return answer.primary.toLowerCase() === "nein";
    }
    return false;
  }

  return false;
}

/**
 * Get follow-up question text from scenario
 */
export function getFollowupQuestion(scenario: InterviewScenario): string | null {
  if (!scenario.followup_rules) return null;
  return scenario.followup_rules.followup_goal || null;
}
