/**
 * Interview View Wrapper
 * Handles routing and session loading for interview mode
 * Optimized for mobile with sticky header and full-screen interview
 */

import { useRoute, useLocation } from "wouter-preact";
import { ArrowLeft, X } from "lucide-preact";
import { Link } from "wouter-preact";
import { Button } from "../components/ui/button";
import { InterviewView as InterviewViewComponent } from "../components/interview/InterviewView";

export function InterviewViewPage() {
  const [match, params] = useRoute<{ sessionId: string; person: string }>(
    "/sessions/:sessionId/interview/:person"
  );
  const [, setLocation] = useLocation();

  if (!match || !params) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          Session oder Person nicht gefunden
        </div>
      </div>
    );
  }

  const sessionId = params.sessionId || "";
  const person = (params.person as "A" | "B") || "A";

  function handleClose() {
    setLocation(`/sessions/${sessionId}`);
  }

  return (
    <div className="min-h-screen flex flex-col -m-4">
      {/* Compact Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 pt-safe">
          <Link href={`/sessions/${sessionId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="min-w-[44px] min-h-[44px] touch-feedback"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold">Interview</h1>
            <p className="text-xs text-muted-foreground">Person {person}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] touch-feedback"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Interview Component */}
      <div className="flex-1 px-4 py-2">
        <InterviewViewComponent
          sessionId={sessionId}
          person={person}
          onComplete={() => {
            // Could navigate back or show completion message
          }}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
