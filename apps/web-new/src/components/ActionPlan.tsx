import { useState } from "preact/hooks";
import { Check, Calendar, Heart, Sparkles } from "lucide-preact";
import { Button } from "./ui/button";
import type { ComparisonResult } from "../types/compare";

interface ActionPlanProps {
  items: ComparisonResult[];
  className?: string;
}

interface ActionItem extends ComparisonResult {
  selected: boolean;
}

export function ActionPlan({ items, className = "" }: ActionPlanProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    // Pre-select top 3 "DOABLE NOW" items
    return items.map((item, idx) => ({
      ...item,
      selected: idx < 3 && item.pair_status === "MATCH",
    }));
  });

  const selectedItems = actionItems.filter((item) => item.selected);
  const doableItems = actionItems.filter(
    (item) => item.pair_status === "MATCH" || item.pair_status === "EXPLORE"
  );

  function toggleItem(id: string) {
    setActionItems((prev) =>
      prev.map((item) => (item.question_id === id ? { ...item, selected: !item.selected } : item))
    );
  }

  function exportAsText() {
    const text = [
      "🎯 Unser Action Plan",
      "===================",
      "",
      ...selectedItems.map((item, idx) => {
        const prompts = item.prompts?.join("\n   ") || "";
        return `${idx + 1}. ${item.label || item.question_text}\n   ${prompts}`;
      }),
      "",
      "Erstellt mit: Intimacy Tool",
    ].join("\n");

    // Create download
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "action-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (doableItems.length === 0) {
    return null;
  }

  return (
    <section className={`section-card ${className}`}>
      <div className="section-header">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="section-title">Action Plan</p>
          </div>
          <p className="section-subtitle">
            Wählt 2-3 Dinge aus, die ihr in den nächsten Wochen ausprobieren wollt.
          </p>
        </div>
        {selectedItems.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportAsText} className="gap-2">
            <Calendar className="h-4 w-4" />
            Exportieren
          </Button>
        )}
      </div>
      <div className="section-body">
        {selectedItems.length > 0 && (
          <div className="list-card">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Heart className="h-4 w-4 text-primary" />
              <div>
                <p className="list-card-title">
                  {selectedItems.length} {selectedItems.length === 1 ? "Item" : "Items"} ausgewählt
                </p>
                <p className="list-card-meta">
                  Plant einen ruhigen Abend, um eure Auswahl zu erkunden.
                </p>
              </div>
            </div>
            <span className="pill">Auswahl</span>
          </div>
        )}

        <div className="section-divider" />

        <div className="flex items-center justify-between">
          <p className="section-title">Verfügbare Items</p>
          <span className="pill">{doableItems.length}</span>
        </div>

        <div className="space-y-3">
          {doableItems.map((item) => {
            const isMatch = item.pair_status === "MATCH";
            const prompts = item.prompts || [];

            return (
              <button
                key={item.question_id}
                type="button"
                onClick={() => toggleItem(item.question_id)}
                aria-pressed={item.selected}
                className={`list-card w-full text-left items-start ${
                  item.selected ? "ring-2 ring-primary/30" : "card-interactive"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}
                >
                  {item.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="list-card-title">{item.label || item.question_text}</p>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                        isMatch
                          ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                      }`}
                    >
                      {isMatch ? "Match" : "Explore"}
                    </span>
                  </div>

                  {prompts.length > 0 && (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {prompts.slice(0, 2).map((prompt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.risk_level && item.risk_level !== "A" && (
                    <span
                      className={`inline-flex items-center text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                        item.risk_level === "C"
                          ? "bg-rose-500/20 text-rose-200 border border-rose-500/40"
                          : "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                      }`}
                    >
                      {item.risk_level === "C" ? "High Risk" : "Medium Risk"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedItems.length > 0 && (
          <div className="list-card flex-col items-start">
            <p className="list-card-title">Tipp: So nutzt ihr den Action Plan</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Legt einen Termin fest (Date Night / Quality Time)</li>
              <li>• Startet mit dem leichtesten Item, um Vertrauen aufzubauen</li>
              <li>• Besprecht vorher: Was brauche ich, um mich sicher zu fühlen?</li>
              <li>• Nach jedem Item: Kurzes Debrief (Was war gut? Was ändern?)</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
