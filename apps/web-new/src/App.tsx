/**
 * Root App Component
 * Mobile-first routing and layout
 */

import { Router, Route, Switch, useLocation } from "wouter-preact";
import { HomeScreen } from "./screens/HomeScreen";
import { SessionView } from "./views/SessionView";
import { UnifiedInterviewScreen } from "./screens/UnifiedInterviewScreen";
import { ComparisonView } from "./components/ComparisonView";
import { Settings, Sparkles } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import { SettingsDialog } from "./components/SettingsDialog";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useCapacitorBackButton } from "./platform/capacitor";
import { logger } from "./services/logger";
import { SkipLink } from "./components/a11y";
import { getActiveSessions } from "./services/api";

export function App() {
  const [showSettings, setShowSettings] = useState(false);

  useCapacitorBackButton();

  const handleError = (error: Error, errorInfo: string) => {
    logger.error("Uncaught error in React tree", error, { componentStack: errorInfo });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <SkipLink />

            <AppHeader onOpenSettings={() => setShowSettings(true)} />

            <OfflineIndicator />

            <main id="main-content" className="pb-safe" tabIndex={-1}>
              <Switch>
                <Route path="/" component={SessionEntryRoute} />
                <Route path="/sessions" component={HomeScreen} />
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
            </main>

            <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
          </div>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <header className="chat-header">
      <button className="chat-brand" onClick={() => setLocation("/sessions")}>
        <div className="chat-brand-avatar">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight text-left">
          <p className="text-xs text-muted-foreground">Guided by</p>
          <p className="font-semibold">Intimacy Guide</p>
        </div>
      </button>

      <div className="header-right">
        <div className="guide-presence" aria-label="Guide online">
          <span className="presence-dot presence-active" aria-hidden />
          <span className="presence-text">Verfügbar</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Einstellungen"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

function SessionEntryRoute() {
  const [, setLocation] = useLocation();
  const [pending, setPending] = useState(true);

  useEffect(() => {
    async function goToLatestSession() {
      try {
        const sessions = await getActiveSessions();
        if (sessions.length > 0) {
          setLocation(`/sessions/${sessions[0].id}`);
          return;
        }
      } catch (error) {
        logger.warn("Could not load sessions for entry redirect", error);
      }

      setLocation("/sessions");
      setPending(false);
    }

    goToLatestSession();
  }, [setLocation]);

  if (pending) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Starte deine Chats …
      </div>
    );
  }

  return null;
}

function ComparisonRoute({ sessionId }: { sessionId: string }) {
  const [, setLocation] = useLocation();

  return <ComparisonView sessionId={sessionId} onClose={() => setLocation(`/sessions/${sessionId}`)} />;
}
