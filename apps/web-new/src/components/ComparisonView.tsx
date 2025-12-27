import { useState, useEffect } from "preact/hooks";
import { Filter, Search, X, CheckCircle2, AlertCircle, Info, MessageSquare, ShieldCheck } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ActionPlan } from "./ActionPlan";
import { AIReportSection } from "./AIReportSection";
import { compareSession, getSessionInfo, loadResponses, loadScenarios } from "../services/api";
import { getCombinedSession } from "../services/interview-storage";
import type { CompareResponse, ComparisonResult, MatchLevel } from "../types/compare";
import type { ResponseMap } from "../types/form";
import type { SessionInfo } from "../types/session";
import type { InterviewAnswer } from "../types/interview";

interface ComparisonViewProps {
  sessionId: string;
  onClose?: () => void;
}

const BUCKET_OPTIONS: { value: MatchLevel | "ALL"; label: string; color: string }[] = [
  { value: "ALL", label: "Alle", color: "secondary" },
  { value: "MATCH", label: "Match", color: "default" },
  { value: "EXPLORE", label: "Erkunden", color: "secondary" },
  { value: "BOUNDARY", label: "Grenze", color: "destructive" },
];

export function ComparisonView({ sessionId, onClose }: ComparisonViewProps) {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [scenarioResults, setScenarioResults] = useState<ComparisonResult[]>([]);
  
  // Filters
  const [bucketFilter, setBucketFilter] = useState<MatchLevel | "ALL">("ALL");
  const [riskOnly, setRiskOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAllComparisonData();
  }, [sessionId]);

  async function loadAllComparisonData() {
    setLoading(true);
    setError(null);
    try {
      // 1. Load Session and Questionnaire Comparison
      const [session, questionnaireCompare, allScenarios] = await Promise.all([
        getSessionInfo(sessionId),
        compareSession(sessionId),
        loadScenarios()
      ]);
      
      setSessionInfo(session);

      // 2. Load and Process Scenarios
      const combinedInterview = getCombinedSession(sessionId);
      const scenarioItems: ComparisonResult[] = [];

      if (combinedInterview && combinedInterview.answers) {
        // Group answers by scenario_id
        const answersByScenario: Record<string, { a?: InterviewAnswer, b?: InterviewAnswer }> = {};
        combinedInterview.answers.forEach(ans => {
          if (!answersByScenario[ans.scenario_id]) answersByScenario[ans.scenario_id] = {};
          if (ans.person === 'A') answersByScenario[ans.scenario_id].a = ans;
          if (ans.person === 'B') answersByScenario[ans.scenario_id].b = ans;
        });

        // Map to ComparisonResult
        Object.entries(answersByScenario).forEach(([sid, pair]) => {
          const scenarioMeta = allScenarios.scenarios.find(s => s.id === sid);
          if (!pair.a && !pair.b) return;

          const isMatch = pair.a?.primary === pair.b?.primary;
          // Simple logic: if either has a 'boundary' risk type option selected, it might be a boundary
          // For now, let's stick to match/explore
          
          scenarioItems.push({
            question_id: sid,
            label: scenarioMeta?.title || sid,
            question_text: scenarioMeta?.description,
            schema: 'scenario',
            risk_level: 'B',
            module_id: 'scenarios',
            pair_status: isMatch ? 'MATCH' : 'EXPLORE',
            value_a: pair.a?.primary || null,
            value_b: pair.b?.primary || null,
            comfort_a: pair.a?.comfort || null,
            comfort_b: pair.b?.comfort || null,
            flags: [],
            a: pair.a,
            b: pair.b
          });
        });
      }

      setScenarioResults(scenarioItems);
      setData(questionnaireCompare);
    } catch (err) {
      console.error('Failed to load comparison:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Vergleich');
    } finally {
      setLoading(false);
    }
  }

  function getFilteredItems(): ComparisonResult[] {
    if (!data?.items) return [];

    // Combine both sources
    let allItems = [...data.items, ...scenarioResults];

    // Bucket filter
    if (bucketFilter !== "ALL") {
      allItems = allItems.filter(item => item.pair_status === bucketFilter);
    }

    // Risk filter
    if (riskOnly) {
      allItems = allItems.filter(item =>
        item.risk_level === 'C' || 
        item.flags.includes('low_comfort_high_interest') ||
        (item.comfort_a !== null && item.comfort_a <= 2) ||
        (item.comfort_b !== null && item.comfort_b <= 2)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allItems = allItems.filter(item => 
        item.label?.toLowerCase().includes(query) ||
        item.question_text?.toLowerCase().includes(query)
      );
    }

    return allItems;
  }

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Berechne Vergleich...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
          {error || 'Vergleich konnte nicht geladen werden'}
        </div>
        <Button variant="outline" className="mt-4" onClick={onClose}>Zurück</Button>
      </div>
    );
  }

  // Recalculate summary based on combined data
  const combinedTotal = data.items.length + scenarioResults.length;
  const combinedMatch = data.items.filter(i => i.pair_status === 'MATCH').length + scenarioResults.filter(i => i.pair_status === 'MATCH').length;
  const combinedExplore = data.items.filter(i => i.pair_status === 'EXPLORE').length + scenarioResults.filter(i => i.pair_status === 'EXPLORE').length;
  const combinedBoundary = data.items.filter(i => i.pair_status === 'BOUNDARY').length + scenarioResults.filter(i => i.pair_status === 'BOUNDARY').length;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold">Vergleich & Auswertung</h2>
          <p className="text-xs text-muted-foreground">{sessionInfo?.name}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        )}
      </header>

      {/* Stats Dashboard - Zen Colors */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Gesamt" value={combinedTotal} />
        <StatCard label="Matches" value={combinedMatch} color="text-emerald-500" />
        <StatCard label="Offen" value={combinedExplore} color="text-amber-500" />
        <StatCard label="Grenzen" value={combinedBoundary} color="text-red-500" />
      </div>

      {/* Action Plan Component */}
      {data.action_plan && data.action_plan.length > 0 && (
        <ActionPlan suggestions={data.action_plan} />
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {BUCKET_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={bucketFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setBucketFilter(option.value)}
              className="rounded-full whitespace-nowrap"
            >
              {option.label}
            </Button>
          ))}
          <Button
            variant={riskOnly ? "destructive" : "outline"}
            size="sm"
            onClick={() => setRiskOnly(!riskOnly)}
            className="rounded-full whitespace-nowrap gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Risiko
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Nach Themen suchen..."
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/40 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              Keine Einträge für diese Filter gefunden.
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <ComparisonItemCard key={`${item.question_id}-${index}`} item={item} />
          ))
        )}
      </div>

      {/* AI Deep Dive */}
      {sessionInfo?.template && (
        <AIReportSection
          sessionId={sessionId}
          template={sessionInfo.template}
          responsesA={data.items.reduce((acc, i) => ({ ...acc, [i.question_id]: i.a }), {})}
          responsesB={data.items.reduce((acc, i) => ({ ...acc, [i.question_id]: i.b }), {})}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color = "text-foreground" }: { label: string, value: number, color?: string }) {
  return (
    <Card className="border-border/20 bg-surface/50">
      <CardContent className="p-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ComparisonItemCard({ item }: { item: ComparisonResult }) {
  const isMatch = item.pair_status === "MATCH";
  const isBoundary = item.pair_status === "BOUNDARY";
  
  const statusConfig = {
    MATCH: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Match" },
    EXPLORE: { icon: Info, color: "text-amber-500", bg: "bg-amber-500/10", label: "Diskussion" },
    BOUNDARY: { icon: ShieldCheck, color: "text-red-500", bg: "bg-red-500/10", label: "Grenze" },
  }[item.pair_status];

  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`border-border/40 overflow-hidden transition-all active:scale-[0.99] ${isMatch ? 'border-l-4 border-l-emerald-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
               <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusConfig.bg} ${statusConfig.color}`}>
                 {statusConfig.label}
               </div>
               {item.risk_level === 'C' && (
                 <Badge variant="destructive" className="h-5 text-[10px]">High Risk</Badge>
               )}
            </div>
            <CardTitle className="text-base leading-tight">
              {item.label}
            </CardTitle>
          </div>
          <StatusIcon className={`h-5 w-5 flex-shrink-0 ${statusConfig.color}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.question_text && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">{item.question_text}</p>
        )}

        <div className="grid grid-cols-2 gap-4 bg-background/50 rounded-lg p-3 border border-border/20">
          <div className="space-y-1">
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Person A</p>
            <div className="text-sm font-medium">
              {renderFormattedAnswer(item.value_a || item.status_a, item.schema)}
            </div>
            {item.comfort_a !== null && (
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-1 w-2 rounded-full ${i <= (item.comfort_a || 0) ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Person B</p>
            <div className="text-sm font-medium">
              {renderFormattedAnswer(item.value_b || item.status_b, item.schema)}
            </div>
            {item.comfort_b !== null && (
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-1 w-2 rounded-full ${i <= (item.comfort_b || 0) ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        {item.prompts && item.prompts.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
              <MessageSquare className="h-3 w-3" />
              Gesprächsimpuls
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-5 relative before:content-['\"'] before:absolute before:left-0 before:text-lg before:top-[-4px] before:opacity-20">
              {item.prompts[0]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function renderFormattedAnswer(val: any, schema?: string): string {
  if (val === null || val === undefined) return "Keine Antwort";
  
  if (schema === "scenario") {
    // A, B, C, D to readable text if possible, but for now just the ID
    return `Option ${val}`;
  }

  if (Array.isArray(val)) return val.join(", ");
  
  const translations: Record<string, string> = {
    'YES': 'Ja',
    'MAYBE': 'Vielleicht',
    'NO': 'Nein',
    'HARD_LIMIT': 'Tabu'
  };

  return translations[String(val).toUpperCase()] || String(val);
}


