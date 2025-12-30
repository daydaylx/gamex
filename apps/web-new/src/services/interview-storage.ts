/**
 * Interview Storage Service
 * Handles persistence with strict key separation and schema versioning
 */

import type {
  InterviewSession,
  InterviewScenario,
  InterviewScenariosFile,
  InterviewAnswer,
  InterviewSceneDecision,
  InterviewSceneNode,
} from "../types/interview";

const INTERVIEW_STORAGE_PREFIX = "gamex_interview_v1";
const CURRENT_SCHEMA_VERSION = 2;

/**
 * Storage Keys - STRICTLY separated from gamex:sessions
 */
const STORAGE_KEYS = {
  session: (sessionId: string, person: string) =>
    `${INTERVIEW_STORAGE_PREFIX}_session_${sessionId}_${person}`,
  settings: `${INTERVIEW_STORAGE_PREFIX}_settings`,
  scenarios_cache: `${INTERVIEW_STORAGE_PREFIX}_scenarios_cache`,
};

/**
 * Load interview scenarios from JSON file
 * Includes schema version check and forward-compatible loading
 */
export async function loadInterviewScenarios(): Promise<InterviewScenario[]> {
  try {
    const response = await fetch("/data/interview_scenarios.json");
    if (!response.ok) {
      throw new Error(`Failed to load scenarios: ${response.status}`);
    }

    const file: InterviewScenariosFile = await response.json();

    // Schema version check
    if (file.schema_version > CURRENT_SCHEMA_VERSION) {
      console.warn(
        `Scenarios file has newer schema version (${file.schema_version} > ${CURRENT_SCHEMA_VERSION}). Loading with forward compatibility.`
      );
      // Still load, but only use known fields
    }

    // Cache in localStorage for offline use
    try {
      localStorage.setItem(
        STORAGE_KEYS.scenarios_cache,
        JSON.stringify({ data: file.scenarios, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn("Could not cache scenarios:", e);
    }

    return file.scenarios;
  } catch (error) {
    // Try to load from cache as fallback
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.scenarios_cache);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.warn("Using cached scenarios due to load error:", error);
        return data;
      }
    } catch {}

    console.error("Failed to load scenarios:", error);
    throw error;
  }
}

/**
 * Load interview session with migration support
 */
export function loadInterviewSession(
  sessionId: string,
  person: "A" | "B"
): InterviewSession | null {
  try {
    const key = STORAGE_KEYS.session(sessionId, person);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const session = JSON.parse(raw) as InterviewSession;

    // Migration: Old sessions without schema_version
    if (!session.schema_version) {
      session.schema_version = CURRENT_SCHEMA_VERSION;
      // Ensure required fields exist
      if (!session.created_at) {
        session.created_at = new Date().toISOString();
      }
      if (!session.updated_at) {
        session.updated_at = new Date().toISOString();
      }
      if (!session.scene_paths) {
        session.scene_paths = [];
      }
      // Migrate and save
      saveInterviewSession(session, person);
    }

    if (!session.scene_paths) {
      session.scene_paths = [];
    }

    return session;
  } catch (error) {
    console.error("Failed to load interview session:", error);
    return null;
  }
}

/**
 * Save interview session with schema version and timestamp
 */
export function saveInterviewSession(session: InterviewSession, person: "A" | "B"): void {
  session.schema_version = CURRENT_SCHEMA_VERSION;
  session.updated_at = new Date().toISOString();

  if (!session.created_at) {
    session.created_at = new Date().toISOString();
  }

  if (!session.scene_paths) {
    session.scene_paths = [];
  }

  try {
    const key = STORAGE_KEYS.session(session.session_id, person);
    localStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save interview session:", error);
    throw new Error("Speichern fehlgeschlagen. Bitte prüfe den Speicherplatz.");
  }
}

/**
 * Create new interview session
 */
export function createInterviewSession(sessionId: string, scenarioIds: string[]): InterviewSession {
  const now = new Date().toISOString();
  const session: InterviewSession = {
    schema_version: CURRENT_SCHEMA_VERSION,
    session_id: sessionId,
    people: ["A", "B"],
    scenario_order: scenarioIds,
    answers: [],
    scene_paths: [],
    progress: { current_index: 0 },
    created_at: now,
    updated_at: now,
  };
  return session;
}

/**
 * Save interview answer (updates existing session)
 */
export function saveInterviewAnswer(
  sessionId: string,
  person: "A" | "B",
  answer: InterviewAnswer
): void {
  let session = loadInterviewSession(sessionId, person);

  if (!session) {
    // Create new session if it doesn't exist
    // This shouldn't happen in normal flow, but handle gracefully
    console.warn("Session not found, creating new one");
    session = createInterviewSession(sessionId, [answer.scenario_id]);
  }

  // Ensure answer has timestamp
  if (!answer.timestamp) {
    answer.timestamp = new Date().toISOString();
  }

  // Replace existing answer or add new one
  const idx = session.answers.findIndex((a) => a.scenario_id === answer.scenario_id);
  if (idx >= 0) {
    session.answers[idx] = answer;
  } else {
    session.answers.push(answer);
  }

  saveInterviewSession(session, person);
}

/**
 * Update progress
 */
export function updateInterviewProgress(
  sessionId: string,
  person: "A" | "B",
  currentIndex: number
): void {
  const session = loadInterviewSession(sessionId, person);
  if (!session) {
    throw new Error("Session not found");
  }

  session.progress.current_index = currentIndex;
  saveInterviewSession(session, person);
}

/**
 * Get answer for a specific scenario
 */
export function getInterviewAnswer(
  sessionId: string,
  person: "A" | "B",
  scenarioId: string
): InterviewAnswer | null {
  const session = loadInterviewSession(sessionId, person);
  if (!session) return null;

  return session.answers.find((a) => a.scenario_id === scenarioId) || null;
}

/**
 * Get all answers for a person
 */
export function getInterviewAnswers(sessionId: string, person: "A" | "B"): InterviewAnswer[] {
  const session = loadInterviewSession(sessionId, person);
  if (!session) return [];

  return session.answers;
}

/**
 * Scene path handling
 */
export function getSceneDecisions(
  sessionId: string,
  person: "A" | "B",
  scenarioId: string
): InterviewSceneDecision[] {
  const session = loadInterviewSession(sessionId, person);
  if (!session?.scene_paths) return [];

  return session.scene_paths
    .filter((p) => p.scenario_id === scenarioId && p.person === person)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function saveSceneDecision(
  sessionId: string,
  person: "A" | "B",
  decision: InterviewSceneDecision
): void {
  let session = loadInterviewSession(sessionId, person);
  if (!session) {
    session = createInterviewSession(sessionId, [decision.scenario_id]);
  }

  const updatedDecision = {
    ...decision,
    person,
    timestamp: decision.timestamp || new Date().toISOString(),
  };

  const existingWithoutNode = session.scene_paths.filter(
    (d) => !(d.scenario_id === updatedDecision.scenario_id && d.node_id === updatedDecision.node_id && d.person === person)
  );

  session.scene_paths = [...existingWithoutNode, updatedDecision];
  saveInterviewSession(session, person);
}

export interface SceneStreamMessage {
  id: string;
  role: "guide" | "user" | "reaction";
  text: string;
  node_id?: string;
  choice_id?: string;
}

export interface SceneResolutionResult {
  stream: SceneStreamMessage[];
  pendingNode: InterviewSceneNode | null;
}

export function buildSceneReaction(
  scenario: InterviewScenario,
  node: InterviewSceneNode,
  choiceLabel: string,
  reactionTemplate?: string
): string {
  const template =
    reactionTemplate ||
    node.reaction_template ||
    scenario.reaction_templates?.default ||
    "Notiert: {{choice}}";

  return template
    .replace(/{{choice}}/g, choiceLabel)
    .replace(/{{prompt}}/g, node.prompt)
    .replace(/{{title}}/g, scenario.title);
}

function getStartNode(scenario: InterviewScenario): InterviewSceneNode | null {
  if (!scenario.scene_nodes || scenario.scene_nodes.length === 0) return null;
  if (scenario.scene_entry) {
    const found = scenario.scene_nodes.find((n) => n.id === scenario.scene_entry);
    if (found) return found;
  }
  return scenario.scene_nodes[0];
}

function findNodeById(nodes: InterviewSceneNode[] | undefined, id?: string): InterviewSceneNode | null {
  if (!nodes || !id) return null;
  return nodes.find((n) => n.id === id) || null;
}

function getNextNodeId(node: InterviewSceneNode, choiceId?: string): string | undefined {
  const choice = node.choices.find((c) => c.id === choiceId);
  return choice?.followup || choice?.next || node.followup || node.next;
}

export function resolveSceneStream(
  scenario: InterviewScenario,
  decisions: InterviewSceneDecision[]
): SceneResolutionResult {
  if (!scenario.scene_nodes || scenario.scene_nodes.length === 0) {
    return {
      stream: [
        {
          id: `${scenario.id}-intro`,
          role: "guide",
          text: scenario.scenario_text,
        },
      ],
      pendingNode: null,
    };
  }

  const stream: SceneStreamMessage[] = [
    {
      id: `${scenario.id}-intro`,
      role: "guide",
      text: scenario.scenario_text,
    },
  ];

  const visited = new Set<string>();
  let currentNode: InterviewSceneNode | null = getStartNode(scenario);

  while (currentNode && !visited.has(currentNode.id)) {
    visited.add(currentNode.id);
    stream.push({
      id: `${scenario.id}-${currentNode.id}-prompt`,
      role: "guide",
      text: currentNode.prompt,
      node_id: currentNode.id,
    });

    const decision = decisions.find((d) => d.node_id === currentNode?.id);
    if (!decision) {
      return { stream, pendingNode: currentNode };
    }

    const choice = currentNode.choices.find((c) => c.id === decision.choice_id);
    if (choice) {
      stream.push({
        id: `${scenario.id}-${currentNode.id}-choice`,
        role: "user",
        text: choice.label,
        node_id: currentNode.id,
        choice_id: choice.id,
      });

      const reaction =
        decision.reaction || buildSceneReaction(scenario, currentNode, choice.label, choice.reaction_template);
      stream.push({
        id: `${scenario.id}-${currentNode.id}-reaction`,
        role: "reaction",
        text: reaction,
        node_id: currentNode.id,
        choice_id: choice.id,
      });

      const nextId = getNextNodeId(currentNode, choice.id);
      currentNode = findNodeById(scenario.scene_nodes, nextId);
    } else {
      return { stream, pendingNode: currentNode };
    }
  }

  return { stream, pendingNode: null };
}

/**
 * Combine answers from both persons for report generation
 */
export function getCombinedSession(sessionId: string): InterviewSession | null {
  const sessionA = loadInterviewSession(sessionId, "A");
  const sessionB = loadInterviewSession(sessionId, "B");

  if (!sessionA && !sessionB) return null;

  // Use session A as base, or create new if neither exists
  const combined: InterviewSession = sessionA
    ? { ...sessionA }
    : createInterviewSession(sessionId, []);

  // Merge answers from both persons (ensure we don't duplicate)
  const allAnswers = [...combined.answers];
  if (sessionB) {
    for (const answerB of sessionB.answers) {
      // Check if answer already exists (same scenario_id and person)
      const exists = allAnswers.some(
        (a) => a.scenario_id === answerB.scenario_id && a.person === answerB.person
      );
      if (!exists) {
        allAnswers.push(answerB);
      }
    }
  }
  combined.answers = allAnswers;

  // Merge scene path decisions from both persons
  const allScenePaths = [...(combined.scene_paths || [])];
  if (sessionB?.scene_paths) {
    for (const path of sessionB.scene_paths) {
      const exists = allScenePaths.some(
        (p) => p.scenario_id === path.scenario_id && p.person === path.person && p.node_id === path.node_id
      );
      if (!exists) {
        allScenePaths.push(path);
      }
    }
  }
  combined.scene_paths = allScenePaths;

  return combined;
}

/**
 * Find first incomplete question index
 * Returns index of first question without an answer, or -1 if all are answered
 */
export function findFirstIncompleteIndex(
  sessionId: string,
  person: "A" | "B",
  scenarioIds: string[]
): number {
  const session = loadInterviewSession(sessionId, person);
  if (!session) return 0; // Start from beginning if no session

  for (let i = 0; i < scenarioIds.length; i++) {
    const answer = session.answers.find((a) => a.scenario_id === scenarioIds[i]);
    if (!answer || answer.skipped || answer.primary === null || answer.primary === undefined) {
      return i;
    }
  }

  return -1; // All questions answered
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(
  sessionId: string,
  person: "A" | "B",
  totalQuestions: number
): number {
  const session = loadInterviewSession(sessionId, person);
  if (!session) return 0;

  const answeredCount = session.answers.filter(
    (a) => !a.skipped && a.primary !== null && a.primary !== undefined
  ).length;

  return Math.round((answeredCount / totalQuestions) * 100);
}

/**
 * Get answered question count
 */
export function getAnsweredCount(sessionId: string, person: "A" | "B"): number {
  const session = loadInterviewSession(sessionId, person);
  if (!session) return 0;

  return session.answers.filter((a) => !a.skipped && a.primary !== null && a.primary !== undefined)
    .length;
}

export function buildSceneNarratives(
  session: InterviewSession,
  scenarios: InterviewScenario[]
): Record<"A" | "B", string[]> {
  const narratives: Record<"A" | "B", string[]> = { A: [], B: [] };
  const scenarioMap = new Map<string, InterviewScenario>();
  scenarios.forEach((s) => scenarioMap.set(s.id, s));

  for (const decision of session.scene_paths || []) {
    const scenario = scenarioMap.get(decision.scenario_id);
    if (!scenario) continue;

    const node = scenario.scene_nodes?.find((n) => n.id === decision.node_id);
    const choice = node?.choices.find((c) => c.id === decision.choice_id);
    const reaction =
      decision.reaction ||
      (choice && node ? buildSceneReaction(scenario, node, choice.label, choice.reaction_template) : null);

    const sentence =
      reaction ||
      `${scenario.title}: ${choice?.label || decision.choice_id}`;

    if (decision.person === "A" || decision.person === "B") {
      narratives[decision.person].push(sentence);
    }
  }

  return narratives;
}
