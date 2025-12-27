import { useState } from "preact/hooks";
import { Check, Calendar, Heart, Sparkles } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
      selected: idx < 3 && item.pair_status === "MATCH"
    }));
  });

  const selectedItems = actionItems.filter(item => item.selected);
  const doableItems = actionItems.filter(item => 
    item.pair_status === "MATCH" || item.pair_status === "EXPLORE"
  );

  function toggleItem(id: string) {
    setActionItems(prev => 
      prev.map(item => 
        item.question_id === id 
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  }

  function exportAsText() {
    const text = [
      "🎯 Unser Action Plan",
      "===================",
      "",
      ...selectedItems.map((item, idx) => {
        const prompts = item.prompts?.join('\n   ') || '';
        return `${idx + 1}. ${item.label || item.question_text}\n   ${prompts}`;
      }),
      "",
      "Erstellt mit: Intimacy Tool"
    ].join('\n');

    // Create download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'action-plan.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (doableItems.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Action Plan: Was als Nächstes?
            </CardTitle>
            <CardDescription>
              Wählt 2-3 Dinge aus, die ihr in den nächsten Wochen ausprobieren wollt
            </CardDescription>
          </div>
          {selectedItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsText}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Exportieren
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Summary */}
        {selectedItems.length > 0 && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                {selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'} ausgewählt
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Plant ein Date oder einen ruhigen Abend, um eure Auswahl zu erkunden
            </p>
          </div>
        )}

        {/* Doable Items List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Verfügbare Items ({doableItems.length})
          </h4>
          
          {doableItems.map((item) => {
            const isMatch = item.pair_status === "MATCH";
            const prompts = item.prompts || [];
            
            return (
              <div
                key={item.question_id}
                className={`
                  p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${item.selected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
                onClick={() => toggleItem(item.question_id)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div 
                    className={`
                      h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                      ${item.selected 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground/30'
                      }
                    `}
                  >
                    {item.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="font-medium text-sm leading-tight">
                        {item.label || item.question_text}
                      </h5>
                      <Badge 
                        variant={isMatch ? "default" : "secondary"}
                        className="flex-shrink-0"
                      >
                        {isMatch ? "Match" : "Explore"}
                      </Badge>
                    </div>

                    {/* Prompts */}
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

                    {/* Risk Level Indicator */}
                    {item.risk_level && item.risk_level !== "A" && (
                      <div className="mt-2">
                        <Badge 
                          variant={item.risk_level === "C" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {item.risk_level === "C" ? "⚠️ High Risk" : "Medium Risk"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        {selectedItems.length > 0 && (
          <div className="pt-4 border-t">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">
                💡 Tipp: So nutzt ihr den Action Plan
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Legt einen Termin fest (Date Night / Quality Time)</li>
                <li>• Startet mit dem leichtesten Item, um Vertrauen aufzubauen</li>
                <li>• Besprecht vorher: Was brauche ich, um mich sicher zu fühlen?</li>
                <li>• Nach jedem Item: Kurzes Debrief (Was war gut? Was ändern?)</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

