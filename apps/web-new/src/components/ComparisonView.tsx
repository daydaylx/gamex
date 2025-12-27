import { useState, useEffect } from "preact/hooks";
import { Filter, Search, X } from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ActionPlan } from "./ActionPlan";
import { compareSession } from "../../services/api";
import type { CompareResponse, ComparisonResult, MatchLevel } from "../../types/compare";

interface ComparisonViewProps {
  sessionId: string;
  onClose?: () => void;
}

const BUCKET_OPTIONS: { value: MatchLevel | "ALL"; label: string; color: string }[] = [
  { value: "ALL", label: "Alle", color: "secondary" },
  { value: "MATCH", label: "Match", color: "default" },
  { value: "EXPLORE", label: "Explore", color: "secondary" },
  { value: "BOUNDARY", label: "Boundary", color: "destructive" },
];

export function ComparisonView({ sessionId, onClose }: ComparisonViewProps) {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [bucketFilter, setBucketFilter] = useState<MatchLevel | "ALL">("ALL");
  const [riskOnly, setRiskOnly] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadComparison();
  }, [sessionId]);

  async function loadComparison() {
    setLoading(true);
    setError(null);
    try {
      const result = await compareSession(sessionId);
      setData(result);
    } catch (err) {
      console.error('Failed to load comparison:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Vergleich');
    } finally {
      setLoading(false);
    }
  }

  function getFilteredItems(): ComparisonResult[] {
    if (!data?.items) return [];

    let filtered = data.items;

    // Bucket filter
    if (bucketFilter !== "ALL") {
      filtered = filtered.filter((item: ComparisonResult) => item.pair_status === bucketFilter);
    }

    // Risk filter
    if (riskOnly) {
      filtered = filtered.filter((item: ComparisonResult) =>
        item.flags.includes('low_comfort_high_interest')
      );
    }

    // Flagged filter
    if (flaggedOnly) {
      filtered = filtered.filter((item: ComparisonResult) =>
        item.flags.length > 0
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: ComparisonResult) => 
        item.question_text?.toLowerCase().includes(query) ||
        item.question_id?.toLowerCase().includes(query) ||
        item.label?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Vergleich</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Lädt Vergleich...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Vergleich</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error || 'Vergleich konnte nicht geladen werden'}
        </div>
      </div>
    );
  }

  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vergleich</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt</CardDescription>
            <CardTitle className="text-3xl">{summary.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Match</CardDescription>
            <CardTitle className="text-3xl text-green-600">{summary.match || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Explore</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{summary.explore || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Boundary</CardDescription>
            <CardTitle className="text-3xl text-red-600">{summary.boundary || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
          {/* Bucket Filter */}
          <div className="flex flex-wrap gap-2">
            {BUCKET_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={bucketFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setBucketFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={riskOnly}
                onChange={(e) => setRiskOnly((e.target as HTMLInputElement).checked)}
                className="rounded border-input"
              />
              <span className="text-sm">Nur Risiko-Items</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(e) => setFlaggedOnly((e.target as HTMLInputElement).checked)}
                className="rounded border-input"
              />
              <span className="text-sm">Nur markierte Items</span>
            </label>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Suchen..."
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredItems.length} {filteredItems.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Keine Ergebnisse für die aktuellen Filter
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {item.label || item.question_text || item.question_id}
                    </CardTitle>
                    {item.help && (
                      <CardDescription className="mt-1">{item.help}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={
                      item.pair_status === "MATCH" ? "default" :
                      item.pair_status === "EXPLORE" ? "secondary" :
                      "destructive"
                    }>
                      {item.pair_status}
                    </Badge>
                    {item.flag_low_comfort_high_interest && (
                      <Badge variant="destructive">⚠️ Risiko</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Person A */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Person A</h4>
                    <div className="text-sm text-muted-foreground">
                      {renderAnswer(item.a, item.schema)}
                    </div>
                  </div>
                  {/* Person B */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Person B</h4>
                    <div className="text-sm text-muted-foreground">
                      {renderAnswer(item.b, item.schema)}
                    </div>
                  </div>
                </div>

                {/* Conversation Prompts */}
                {item.prompts && item.prompts.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">💬 Gesprächs-Ideen:</h4>
                    <ul className="space-y-1">
                      {item.prompts.map((prompt: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">• {prompt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function renderAnswer(answer: any, schema?: string): string {
  if (!answer) return "Keine Antwort";
  
  if (schema === "consent_rating" && typeof answer === "object") {
    return `${answer.status || "?"} | Interesse: ${answer.interest || "?"} | Komfort: ${answer.comfort || "?"}`;
  }
  
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  
  return String(answer);
}

