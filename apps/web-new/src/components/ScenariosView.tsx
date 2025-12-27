import { useState, useEffect } from "preact/hooks";
import { ChevronLeft, ChevronRight, X } from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { loadScenarios } from "../../services/api";

interface ScenariosViewProps {
  sessionId?: string;
  onClose?: () => void;
}

interface Scenario {
  id: string;
  text: string;
  category?: string;
  tags?: string[];
}

export function ScenariosView({ onClose }: ScenariosViewProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, { a?: string; b?: string }>>({});

  useEffect(() => {
    loadScenariosData();
  }, []);

  async function loadScenariosData() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadScenarios();
      setScenarios(data as Scenario[]);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Szenarien');
    } finally {
      setLoading(false);
    }
  }

  function goToNext() {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function goToPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleAnswer(person: "a" | "b", value: string) {
    const scenarioId = currentScenario?.id;
    if (!scenarioId) return;

    setAnswers(prev => ({
      ...prev,
      [scenarioId]: {
        ...prev[scenarioId],
        [person]: value,
      },
    }));
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

  if (error || scenarios.length === 0) {
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
          {error || 'Keine Szenarien gefunden'}
        </div>
      </div>
    );
  }

  const currentScenario = scenarios[currentIndex];
  const progress = Math.round(((currentIndex + 1) / scenarios.length) * 100);
  const currentAnswers = currentScenario ? answers[currentScenario.id] : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Szenarien-Modus</h2>
          <p className="text-sm text-muted-foreground">
            Karte {currentIndex + 1} von {scenarios.length}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scenario Card */}
      {currentScenario && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                {currentScenario.category && (
                  <CardDescription className="mb-2">
                    {currentScenario.category}
                  </CardDescription>
                )}
                <CardTitle className="text-xl leading-relaxed">
                  {currentScenario.text}
                </CardTitle>
              </div>
            </div>
            {currentScenario.tags && currentScenario.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {currentScenario.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Person A Response */}
            <div className="space-y-3">
              <h3 className="font-medium">Person A</h3>
              <div className="grid grid-cols-3 gap-2">
                {["Ja", "Vielleicht", "Nein"].map((option) => (
                  <Button
                    key={option}
                    variant={currentAnswers?.a === option ? "default" : "outline"}
                    onClick={() => handleAnswer("a", option)}
                    className="w-full"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Person B Response */}
            <div className="space-y-3">
              <h3 className="font-medium">Person B</h3>
              <div className="grid grid-cols-3 gap-2">
                {["Ja", "Vielleicht", "Nein"].map((option) => (
                  <Button
                    key={option}
                    variant={currentAnswers?.b === option ? "default" : "outline"}
                    onClick={() => handleAnswer("b", option)}
                    className="w-full"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Vorherige
              </Button>

              <Button
                onClick={goToNext}
                disabled={currentIndex === scenarios.length - 1}
                className="gap-2"
              >
                Nächste
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold">{currentIndex + 1}</p>
              <p className="text-sm text-muted-foreground">Aktuelle Karte</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Object.keys(answers).length}</p>
              <p className="text-sm text-muted-foreground">Beantwortet</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{scenarios.length}</p>
              <p className="text-sm text-muted-foreground">Gesamt</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

