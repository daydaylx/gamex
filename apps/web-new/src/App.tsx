/**
 * Root App Component
 * Mobile-first routing and layout
 */

import { Router, Route, Switch } from "wouter-preact";
import { HomeScreen } from "./screens/HomeScreen";
import { SessionView } from "./views/SessionView";
import { InterviewScreen } from "./screens/InterviewScreen";
import { useCapacitorBackButton } from "./platform/capacitor";
import { Settings } from "lucide-preact";
import { useState } from "preact/hooks";
import { SettingsDialog } from "./components/SettingsDialog";

export function App() {
  const [showSettings, setShowSettings] = useState(false);

  // Handle Android back button
  useCapacitorBackButton();

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      {/* Main Content */}
      <main className="pb-safe">
        <Router>
          <Switch>
            <Route path="/" component={HomeScreen} />
            <Route path="/sessions/:sessionId" component={SessionView} />
            <Route path="/sessions/:sessionId/interview/:person">
              {(params: { sessionId?: string; person?: string } | undefined) => (
                <InterviewScreen
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
  );
}

