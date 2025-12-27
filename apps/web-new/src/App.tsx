/**
 * Root App Component
 * Mobile-first routing and layout
 */

import { Router, Route, Switch } from "wouter-preact";
import { HomeScreen } from "./screens/HomeScreen";
import { SessionView } from "./views/SessionView";
import { UnifiedInterviewScreen } from "./screens/UnifiedInterviewScreen";
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
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <h1 className="text-lg font-semibold text-primary">Intimacy Tool</h1>
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
                <Route>
                  <div className="p-4 text-center text-muted-foreground">
                    Seite nicht gefunden
                  </div>
                </Route>
              </Switch>
            </Router>
          </main>

          {/* Settings Dialog */}
          <SettingsDialog
            open={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

