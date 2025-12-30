import { useState, useEffect, useRef } from "preact/hooks";
import type { JSX } from "preact";
import { ChevronLeft, ChevronRight, X, AlertTriangle, Info, Shield, Layers } from "lucide-preact";
import { Button } from "./ui/button";
import { loadScenarios } from "../services/api";

interface ScenariosViewProps {
  sessionId?: string;
  onClose?: () => void;
  initialDeckIndex?: number;
  person?: "A" | "B" | "both";
}

interface ScenarioOption {
  id: string;
  label: string;
  risk_type: string;
}

interface InfoCard {
  emotional_context?: string;
  typical_risks?: string;
  safety_gate?: string;
}

interface SafetyGate {
  required?: string[];
  message?: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  info_card?: InfoCard;
  safety_gate?: SafetyGate;
  options: ScenarioOption[];
}

interface Deck {
  id: string;
  name: string;
  description: string;
  scenarios: string[];
  order: number;
  requires_safety_gate?: boolean;
}

interface ScenariosData {
  decks: Deck[];
  scenarios: Scenario[];
}

// Risk type colors for option markers
const riskTypeColors: Record<string, string> = {
  boundary: "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40",
  fantasy_passive: "bg-sky-500/20 text-sky-200 border border-sky-500/40",
  fantasy_active: "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40",
  playful: "bg-amber-500/20 text-amber-200 border border-amber-500/40",
  negotiation: "bg-orange-500/20 text-orange-200 border border-orange-500/40",
  checkin: "bg-slate-500/20 text-slate-200 border border-slate-500/40",
  safety: "bg-teal-500/20 text-teal-200 border border-teal-500/40",
  conditional: "bg-violet-500/20 text-violet-200 border border-violet-500/40",
  active: "bg-rose-500/20 text-rose-200 border border-rose-500/40",
  submission: "bg-pink-500/20 text-pink-200 border border-pink-500/40",
  explore: "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40",
  passive: "bg-slate-500/20 text-slate-200 border border-slate-500/40",
  hesitant: "bg-yellow-500/20 text-yellow-200 border border-yellow-500/40",
  soft: "bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/40",
  masochism: "bg-red-600/20 text-red-200 border border-red-600/40",
};

const SCENARIO_ANSWER_KEY_PREFIX = "gamex:scenario-deck-answers:";

type ScenarioAnswerMap = Record<string, { a?: string; b?: string }>;

function loadScenarioAnswers(sessionId?: string): ScenarioAnswerMap {
  if (!sessionId) return {};
  try {
    const raw = localStorage.getItem(`${SCENARIO_ANSWER_KEY_PREFIX}${sessionId}`);
    return raw ? (JSON.parse(raw) as ScenarioAnswerMap) : {};
  } catch (error) {
    console.warn("Failed to load scenario answers:", error);
    return {};
  }
}

function saveScenarioAnswers(sessionId: string, answers: ScenarioAnswerMap): void {
  try {
    localStorage.setItem(`${SCENARIO_ANSWER_KEY_PREFIX}${sessionId}`, JSON.stringify(answers));
  } catch (error) {
    console.warn("Failed to save scenario answers:", error);
  }
}

export function ScenariosView({
  sessionId,
  onClose,
  initialDeckIndex = 0,
  person = "both",
}: ScenariosViewProps) {
  const [scenariosData, setScenariosData] = useState<ScenariosData | null>(null);
  const [currentDeckIndex, setCurrentDeckIndex] = useState(initialDeckIndex);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ScenarioAnswerMap>(() =>
    loadScenarioAnswers(sessionId)
  );
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [safetyGateAccepted, setSafetyGateAccepted] = useState<Record<string, boolean>>({});
  const [showDeckOverview, setShowDeckOverview] = useState(false);

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    loadScenariosData();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setAnswers({});
      return;
    }
    setAnswers(loadScenarioAnswers(sessionId));
  }, [sessionId]);

  async function loadScenariosData() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadScenarios();
      setScenariosData(data as ScenariosData);
    } catch (err) {
      console.error("Failed to load scenarios:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Szenarien");
    } finally {
      setLoading(false);
    }
  }

  // Get current deck and scenario
  const currentDeck = scenariosData?.decks[currentDeckIndex];
  const scenariosInDeck = currentDeck
    ? (currentDeck.scenarios
        .map((id) => scenariosData?.scenarios.find((s) => s.id === id))
        .filter(Boolean) as Scenario[])
    : [];
  const currentScenario = scenariosInDeck[currentScenarioIndex];

  // Check if current deck requires safety gate
  const deckRequiresSafetyGate =
    currentDeck?.requires_safety_gate && !safetyGateAccepted[currentDeck.id];

  function goToNextScenario() {
    if (currentScenarioIndex < scenariosInDeck.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
      setShowInfoCard(false);
    } else if (currentDeckIndex < (scenariosData?.decks.length || 0) - 1) {
      // Move to next deck
      setCurrentDeckIndex(currentDeckIndex + 1);
      setCurrentScenarioIndex(0);
      setShowInfoCard(false);
    }
  }

  function goToPreviousScenario() {
    if (currentScenarioIndex > 0) {
      setCurrentScenarioIndex(currentScenarioIndex - 1);
      setShowInfoCard(false);
    } else if (currentDeckIndex > 0) {
      // Move to previous deck
      const prevDeckIndex = currentDeckIndex - 1;
      const prevDeck = scenariosData?.decks[prevDeckIndex];
      const prevDeckScenarios = prevDeck
        ? prevDeck.scenarios
            .map((id) => scenariosData?.scenarios.find((s) => s.id === id))
            .filter(Boolean)
        : [];
      setCurrentDeckIndex(prevDeckIndex);
      setCurrentScenarioIndex(prevDeckScenarios.length - 1);
      setShowInfoCard(false);
    }
  }

  function handleAnswer(person: "a" | "b", optionId: string) {
    const scenarioId = currentScenario?.id;
    if (!scenarioId) return;

    setAnswers((prev) => {
      const updated = {
        ...prev,
        [scenarioId]: {
          ...prev[scenarioId],
          [person]: optionId,
        },
      };
      if (sessionId) {
        saveScenarioAnswers(sessionId, updated);
      }
      return updated;
    });
  }

  function acceptSafetyGate(deckId: string) {
    setSafetyGateAccepted((prev) => ({ ...prev, [deckId]: true }));
  }

  function jumpToDeck(deckIndex: number) {
    setCurrentDeckIndex(deckIndex);
    setCurrentScenarioIndex(0);
    setShowDeckOverview(false);
    setShowInfoCard(false);
  }

  // Swipe handlers
  function handleTouchStart(e: JSX.TargetedTouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: JSX.TargetedTouchEvent<HTMLDivElement>) {
    touchEndX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextScenario();
    } else if (isRightSwipe) {
      goToPreviousScenario();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h2 className="page-title">Szenarien</h2>
            <p className="page-subtitle">Lädt Szenarien...</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <section className="section-card">
          <div className="section-body text-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="section-subtitle mt-3">Bitte einen Moment warten.</p>
          </div>
        </section>
      </div>
    );
  }

  if (error || !scenariosData || scenariosData.scenarios.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h2 className="page-title">Szenarien</h2>
            <p className="page-subtitle">Leider konnten die Szenarien nicht geladen werden.</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <section className="section-card">
          <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
            {error || "Keine Szenarien gefunden"}
          </div>
        </section>
      </div>
    );
  }

  // Calculate total progress across all decks
  const totalScenarios = scenariosData.scenarios.length;
  const globalIndex =
    scenariosData.decks
      .slice(0, currentDeckIndex)
      .reduce((acc, deck) => acc + deck.scenarios.length, 0) + currentScenarioIndex;
  const progress = Math.round(((globalIndex + 1) / totalScenarios) * 100);

  const currentAnswers = currentScenario ? answers[currentScenario.id] : undefined;
  const answerKey = person === "A" ? "a" : person === "B" ? "b" : null;
  const singlePersonKey: "a" | "b" = person === "B" ? "b" : "a";
  const showBoth = !answerKey;

  function hasAnswer(scenarioId: string) {
    const entry = answers[scenarioId];
    if (!entry) return false;
    if (!answerKey) return Boolean(entry.a || entry.b);
    return Boolean(entry[answerKey]);
  }

  function renderAnswerBlock(personKey: "a" | "b", label: string) {
    return (
      <div className="section-body">
        <div>
          <p className="section-title">{label}</p>
          <p className="section-subtitle">Wähle die passende Option.</p>
        </div>
        <div className="grid gap-2">
          {currentScenario?.options.map((option) => {
            const selected = currentAnswers?.[personKey] === option.id;
            const markerClass =
              riskTypeColors[option.risk_type] || "bg-muted text-muted-foreground border";
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAnswer(personKey, option.id)}
                className={`list-card w-full text-left ${selected ? "ring-2 ring-primary/40" : "card-interactive"}`}
              >
                <span
                  className={`h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center ${markerClass}`}
                >
                  {option.id}
                </span>
                <span className="flex-1 min-w-0 text-sm leading-snug">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Deck Overview
  if (showDeckOverview) {
    return (
      <div className="page">
        <div className="page-header">
          <Button variant="ghost" size="icon" onClick={() => setShowDeckOverview(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="page-title">Szenarien-Decks</h2>
            <p className="page-subtitle">Wähle ein Deck zum Starten.</p>
          </div>
          <div className="ml-auto flex gap-2">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <section className="section-card">
          <div className="section-body">
            {scenariosData.decks.map((deck, index) => {
              const deckScenarios = deck.scenarios.length;
              const answeredInDeck = deck.scenarios.filter((id) => hasAnswer(id)).length;
              const deckProgress =
                deckScenarios > 0 ? Math.round((answeredInDeck / deckScenarios) * 100) : 0;

              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => jumpToDeck(index)}
                  className={`list-card card-interactive w-full text-left ${
                    deck.requires_safety_gate ? "border-red-500/50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="list-card-title truncate">{deck.name}</p>
                      {deck.requires_safety_gate && (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <p className="list-card-meta line-clamp-2">{deck.description}</p>
                    <div className="progress-bar mt-3">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${deckProgress}%` }}
                      />
                    </div>
                    <p className="list-card-meta mt-2">
                      {answeredInDeck} / {deckScenarios} beantwortet
                    </p>
                  </div>
                  <span className="pill">{deckScenarios} Karten</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // Safety Gate Warning
  if (deckRequiresSafetyGate && currentDeck) {
    return (
      <div className="page">
        <div className="page-header">
          <Button variant="ghost" size="icon" onClick={() => setShowDeckOverview(true)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="page-title">Sicherheits-Gate</h2>
            <p className="page-subtitle">Bitte bestätige die Voraussetzungen.</p>
          </div>
          <div className="ml-auto flex gap-2">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <section className="section-card border border-red-500/40 bg-red-500/10">
          <div className="section-header">
            <div>
              <p className="section-title text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {currentDeck.name}
              </p>
              <p className="section-subtitle">{currentDeck.description}</p>
            </div>
          </div>

          <div className="section-body">
            <div className="list-card bg-background">
              <div>
                <p className="list-card-title flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Voraussetzungen für dieses Deck
                </p>
                <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Safeword ist vereinbart und wird respektiert.</li>
                  <li>Beide Partner:innen fühlen sich sicher.</li>
                  <li>Ausreichend Zeit für Nachbesprechung.</li>
                  <li>Keine Überraschungen ohne vorherige Absprache.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentDeckIndex > 0) {
                    setCurrentDeckIndex(currentDeckIndex - 1);
                    setCurrentScenarioIndex(0);
                  }
                }}
                className="flex-1"
              >
                Zum vorherigen Deck
              </Button>
              <Button
                onClick={() => acceptSafetyGate(currentDeck.id)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Verstanden, fortfahren
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="section-title">{currentDeck?.name || "Szenarien"}</p>
            <p className="section-subtitle">
              Karte {currentScenarioIndex + 1} von {scenariosInDeck.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowDeckOverview(true)}>
              <Layers className="h-5 w-5" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="list-card-meta mt-2">Gesamtfortschritt: {progress}%</p>
      </section>

      {currentScenario && (
        <section className="section-card">
          <div className="section-header">
            <div className="space-y-2">
              {currentScenario.category && <span className="pill">{currentScenario.category}</span>}
              <h3 className="text-xl font-semibold leading-snug">{currentScenario.title}</h3>
              <p className="section-subtitle">{currentScenario.description}</p>
            </div>
            {currentScenario.info_card && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfoCard(!showInfoCard)}
                className={showInfoCard ? "bg-muted" : ""}
              >
                <Info className="h-5 w-5" />
              </Button>
            )}
          </div>

          {showInfoCard && currentScenario.info_card && (
            <div className="list-card bg-muted/40">
              <div className="space-y-3">
                {currentScenario.info_card.emotional_context && (
                  <div>
                    <p className="list-card-title">Emotionaler Kontext</p>
                    <p className="list-card-meta">
                      {currentScenario.info_card.emotional_context}
                    </p>
                  </div>
                )}
                {currentScenario.info_card.typical_risks && (
                  <div>
                    <p className="list-card-title">Typische Risiken</p>
                    <p className="list-card-meta">{currentScenario.info_card.typical_risks}</p>
                  </div>
                )}
                {currentScenario.info_card.safety_gate && (
                  <div>
                    <p className="list-card-title">Sicherheitshinweis</p>
                    <p className="list-card-meta">{currentScenario.info_card.safety_gate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentScenario.safety_gate && (
            <div className="list-card border border-red-500/40 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-300" />
              <p className="list-card-meta text-red-200">
                {currentScenario.safety_gate.message ||
                  "Dieses Szenario erfordert besondere Vorsicht und vorherige Absprache."}
              </p>
            </div>
          )}

          <div className="section-divider" />

          {showBoth ? (
            <>
              {renderAnswerBlock("a", "Person A")}
              <div className="section-divider" />
              {renderAnswerBlock("b", "Person B")}
            </>
          ) : (
            renderAnswerBlock(singlePersonKey, `Person ${singlePersonKey === "a" ? "A" : "B"}`)
          )}

          {currentScenario.tags && currentScenario.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentScenario.tags.map((tag, i) => (
                <span key={i} className="pill">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="section-divider" />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={goToPreviousScenario}
              disabled={currentDeckIndex === 0 && currentScenarioIndex === 0}
              className="gap-2 flex-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Vorherige
            </Button>

            <Button
              onClick={goToNextScenario}
              disabled={
                currentDeckIndex === scenariosData.decks.length - 1 &&
                currentScenarioIndex === scenariosInDeck.length - 1
              }
              className="gap-2 flex-1"
            >
              Nächste
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted-foreground/70">
        💡 Wische nach links oder rechts zum Navigieren.
      </p>
    </div>
  );
}
