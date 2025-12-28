import { useState, useEffect, useRef } from "preact/hooks";
import { ChevronLeft, ChevronRight, X, AlertTriangle, Info, Shield, Layers } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { loadScenarios } from "../services/api";

interface ScenariosViewProps {
  sessionId?: string;
  onClose?: () => void;
  initialDeckIndex?: number;
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

// Risk type colors for options - Muted/Semantic
const riskTypeColors: Record<string, string> = {
  boundary: "bg-green-600/90 text-green-50",
  fantasy_passive: "bg-blue-600/90 text-blue-50",
  fantasy_active: "bg-indigo-600/90 text-indigo-50",
  playful: "bg-amber-500/90 text-amber-50",
  negotiation: "bg-orange-500/90 text-orange-50",
  checkin: "bg-stone-500/90 text-stone-50",
  safety: "bg-teal-600/90 text-teal-50",
  conditional: "bg-purple-600/90 text-purple-50",
  active: "bg-red-600/90 text-red-50",
  submission: "bg-pink-600/90 text-pink-50",
  explore: "bg-cyan-600/90 text-cyan-50",
  passive: "bg-slate-500/90 text-slate-50",
  hesitant: "bg-yellow-600/90 text-yellow-50",
  soft: "bg-rose-500/90 text-rose-50",
  masochism: "bg-red-800/90 text-red-100",
};

export function ScenariosView({ onClose, initialDeckIndex = 0 }: ScenariosViewProps) {
  const [scenariosData, setScenariosData] = useState<ScenariosData | null>(null);
  const [currentDeckIndex, setCurrentDeckIndex] = useState(initialDeckIndex);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, { a?: string; b?: string }>>({});
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

    setAnswers((prev) => ({
      ...prev,
      [scenarioId]: {
        ...prev[scenarioId],
        [person]: optionId,
      },
    }));
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Szenarien</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Lädt Szenarien...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !scenariosData || scenariosData.scenarios.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Szenarien</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error || "Keine Szenarien gefunden"}
        </div>
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

  // Deck Overview
  if (showDeckOverview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Szenarien-Decks</h2>
            <p className="text-sm text-muted-foreground">Wähle ein Deck zum Starten</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeckOverview(false)}>
              Zurück
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {scenariosData.decks.map((deck, index) => {
            const deckScenarios = deck.scenarios.length;
            const answeredInDeck = deck.scenarios.filter((id) => answers[id]).length;
            const deckProgress =
              deckScenarios > 0 ? Math.round((answeredInDeck / deckScenarios) * 100) : 0;

            return (
              <Card
                key={deck.id}
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                  deck.requires_safety_gate ? "border-red-500/50" : ""
                }`}
                onClick={() => jumpToDeck(index)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {deck.name}
                        {deck.requires_safety_gate && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{deck.description}</CardDescription>
                    </div>
                    <span className="text-sm text-muted-foreground">{deckScenarios} Karten</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${deckProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {answeredInDeck} / {deckScenarios} beantwortet
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Safety Gate Warning
  if (deckRequiresSafetyGate && currentDeck) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Szenarien-Modus</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Card className="border-red-500 bg-red-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Sicherheits-Gate: {currentDeck.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{currentDeck.description}</p>

            <div className="rounded-lg bg-background p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Voraussetzungen für dieses Deck:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Safeword ist vereinbart und wird 100% respektiert</li>
                <li>Beide Partner:innen fühlen sich sicher und wohl</li>
                <li>Ausreichend Zeit für Nachbesprechung</li>
                <li>Keine Überraschungen - alles wird vorher besprochen</li>
              </ul>
            </div>

            <div className="flex gap-3">
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
                Zurück zum vorherigen Deck
              </Button>
              <Button
                onClick={() => acceptSafetyGate(currentDeck.id)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Verstanden, fortfahren
              </Button>
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
          className="h-full bg-primary/70 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Zen Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{currentDeck?.name}</h2>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
              Karte {currentScenarioIndex + 1}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeckOverview(true)}>
            <Layers className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Decks</span>
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Scenario Card */}
      {currentScenario && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {currentScenario.category && (
                  <CardDescription className="mb-2 text-xs uppercase tracking-wide font-medium text-primary/70">
                    {currentScenario.category}
                  </CardDescription>
                )}
                <CardTitle className="text-xl leading-relaxed">{currentScenario.title}</CardTitle>
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
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Scenario Description */}
            <p className="text-muted-foreground leading-relaxed">{currentScenario.description}</p>

            {/* Info Card (collapsible) */}
            {showInfoCard && currentScenario.info_card && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-3 border border-border/50">
                {currentScenario.info_card.emotional_context && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1 text-foreground/80">
                      💭 Emotionaler Kontext
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {currentScenario.info_card.emotional_context}
                    </p>
                  </div>
                )}
                {currentScenario.info_card.typical_risks && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1 text-foreground/80">
                      ⚠️ Typische Risiken
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {currentScenario.info_card.typical_risks}
                    </p>
                  </div>
                )}
                {currentScenario.info_card.safety_gate && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1 text-foreground/80">
                      🛡️ Sicherheitshinweis
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {currentScenario.info_card.safety_gate}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Scenario-specific Safety Gate */}
            {currentScenario.safety_gate && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-sm text-red-600 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {currentScenario.safety_gate.message ||
                    "Dieses Szenario erfordert besondere Vorsicht und vorherige Absprache."}
                </p>
              </div>
            )}

            {/* Person A Response with 4 Options - Grid fix for mobile */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Person A
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentScenario.options.map((option) => (
                  <Button
                    key={option.id}
                    variant={currentAnswers?.a === option.id ? "default" : "outline"}
                    onClick={() => handleAnswer("a", option.id)}
                    className={`w-full text-left h-auto py-3 px-4 whitespace-normal justify-start ${
                      currentAnswers?.a === option.id
                        ? riskTypeColors[option.risk_type] || "bg-primary"
                        : ""
                    }`}
                  >
                    <span className="font-semibold mr-2 opacity-70">{option.id}.</span>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Person B Response with 4 Options */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Person B
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentScenario.options.map((option) => (
                  <Button
                    key={option.id}
                    variant={currentAnswers?.b === option.id ? "default" : "outline"}
                    onClick={() => handleAnswer("b", option.id)}
                    className={`w-full text-left h-auto py-3 px-4 whitespace-normal justify-start ${
                      currentAnswers?.b === option.id
                        ? riskTypeColors[option.risk_type] || "bg-primary"
                        : ""
                    }`}
                  >
                    <span className="font-semibold mr-2 opacity-70">{option.id}.</span>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {currentScenario.tags && currentScenario.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {currentScenario.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-full bg-muted/50 text-muted-foreground border border-border/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-border/50">
              <Button
                variant="outline"
                onClick={goToPreviousScenario}
                disabled={currentDeckIndex === 0 && currentScenarioIndex === 0}
                className="gap-2 min-h-[48px]"
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
                className="gap-2 min-h-[48px]"
              >
                Nächste
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Swipe hint */}
      <p className="text-center text-xs text-muted-foreground/50 pb-4">💡 Wische für Navigation</p>
    </div>
  );
}
