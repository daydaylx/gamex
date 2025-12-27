import { useState } from "preact/hooks";
import { Info, X } from "lucide-preact";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface InfoPopoverProps {
  title: string;
  content: string;
  sources?: string[];
  className?: string;
}

export function InfoPopover({ title, content, sources, className = "" }: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Info Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 p-0 rounded-full hover:bg-primary/10"
        aria-label="Mehr Informationen"
      >
        <Info className="h-4 w-4 text-primary" />
      </Button>

      {/* Popover Content */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover Card */}
          <div className="absolute left-0 top-8 z-50 w-80 max-w-[90vw]">
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold pr-8">
                    {title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0 -mt-1 -mr-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {/* Main Content */}
                <CardDescription className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {content}
                </CardDescription>

                {/* Sources */}
                {sources && sources.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Quellen:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {sources.map((source, idx) => (
                        <li key={idx} className="list-disc list-inside">
                          {source}
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

