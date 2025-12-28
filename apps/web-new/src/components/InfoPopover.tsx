import { useState } from "preact/hooks";
import { Info, X } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface InfoPopoverProps {
  title?: string;
  content?: string;
  infoDetails?: string;
  help?: string;
  examples?: string[];
  className?: string;
}

export function InfoPopover({
  title,
  content,
  infoDetails,
  help,
  examples,
  className = "",
}: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fallback text when no info_details are provided
  const explanation =
    content || infoDetails || "Für diese Frage sind keine zusätzlichen Informationen verfügbar.";

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Info Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[44px] min-w-[44px] rounded-full hover:bg-primary/10"
        aria-label="Mehr Informationen"
      >
        <Info className="h-5 w-5 text-primary" />
      </Button>

      {/* Popover Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />

          {/* Popover Card */}
          <div className="absolute left-0 top-8 z-50 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto">
            <Card variant="elevated" className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold pr-8">
                    {title || "Informationen zur Frage"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                {/* Was bedeutet die Frage? - Explanation */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Was bedeutet die Frage?</h4>
                  <CardDescription className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {explanation}
                  </CardDescription>
                </div>

                {/* Wie antworten? - How to answer */}
                {help && (
                  <div className="pt-2 border-t">
                    <h4 className="font-semibold text-foreground mb-2">Wie antworten?</h4>
                    <CardDescription className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {help}
                    </CardDescription>
                  </div>
                )}

                {/* Beispiele - Examples */}
                {examples && examples.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="font-semibold text-foreground mb-2">Beispiele</h4>
                    <ul className="space-y-1.5">
                      {examples.map((example, idx) => (
                        <li key={idx} className="text-foreground/90 pl-4 relative">
                          <span className="absolute left-0 top-0.5 text-primary">•</span>
                          <span className="whitespace-pre-wrap leading-relaxed">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
