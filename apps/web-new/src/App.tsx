/**
 * Root App Component
 * Mobile-first routing and layout
 */

import { Router, Route, Switch, useLocation } from "wouter-preact";
import { HomeScreen } from "./screens/HomeScreen";
import { SessionView } from "./views/SessionView";
import { UnifiedInterviewScreen } from "./screens/UnifiedInterviewScreen";
import { ComparisonView } from "./components/ComparisonView";
import { Settings } from "lucide-preact";
import { useState } from "preact/hooks";
import { SettingsDialog } from "./components/SettingsDialog";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useCapacitorBackButton } from "./platform/capacitor";
import { logger } from "./services/logger";
import { SkipLink } from "./components/a11y";

export function App() {
  const [showSettings, setShowSettings] = useState(false);

  // Handle Android back button
  useCapacitorBackButton();

  const handleError = (error: Error, errorInfo: string) => {
    logger.error("Uncaught error in React tree", error, { componentStack: errorInfo });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          {/* Skip Link for Keyboard Navigation */}
          <SkipLink />

          {/* Fixed Header for Mobile */}
          <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border border-primary/40 bg-primary/10 text-primary font-semibold flex items-center justify-center">
                  IT
                </div>
                <div className="leading-tight">
                  <h1 className="text-base font-semibold">Intimacy Tool</h1>
                  <p className="text-xs text-muted-foreground">Privat & lokal</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Einstellungen"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Main Content */}
          <main id="main-content" className="pb-safe" tabIndex={-1}>
            <Router>
              <Switch>
                <Route path="/" component={HomeScreen} />
                <Route path="/sessions/:sessionId" component={SessionView} />
                <Route path="/sessions/:sessionId/interview/:person">
                  {(params: { sessionId?: string; person?: string } | undefined) => (
                    <UnifiedInterviewScreen
                      sessionId={params?.sessionId || ""}
                      person={(params?.person as "A" | "B") || "A"}
                    />
                  )}
                </Route>
                <Route path="/sessions/:sessionId/compare">
                  {(params: { sessionId?: string } | undefined) => (
                    <ComparisonRoute sessionId={params?.sessionId || ""} />
                  )}
                </Route>
                <Route>
                  <div className="p-4 text-center text-muted-foreground">Seite nicht gefunden</div>
                </Route>
              </Switch>
            </Router>
          </main>

          {/* Settings Dialog */}
          <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function ComparisonRoute({ sessionId }: { sessionId: string }) {
  const [, setLocation] = useLocation();

  return (
    <ComparisonView
      sessionId={sessionId}
      onClose={() => setLocation(`/sessions/${sessionId}`)}
    />
  );
}
