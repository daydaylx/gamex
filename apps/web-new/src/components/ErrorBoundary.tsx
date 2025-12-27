/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays fallback UI
 */

import { Component, type ComponentChildren } from "preact";
import { AlertTriangle, RefreshCw, Home } from "lucide-preact";
import { Button } from "./ui/button";

interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentChildren;
  onError?: (error: Error, errorInfo: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    const errorInfoString = errorInfo.componentStack || "No stack trace available";

    this.setState({ errorInfo: errorInfoString });

    // Call optional error handler
    this.props.onError?.(error, errorInfoString);

    // Log to console in development
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfoString);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">
                Etwas ist schiefgelaufen
              </h1>
              <p className="text-sm text-muted-foreground">
                Ein unerwarteter Fehler ist aufgetreten. Deine Daten sind sicher gespeichert.
              </p>
            </div>

            {/* Error Details (collapsible in production) */}
            {this.state.error && (
              <details className="text-left bg-surface/50 rounded-lg p-4 border border-border/40">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Technische Details anzeigen
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-[10px] font-mono text-muted-foreground overflow-auto max-h-32 mt-2">
                      {this.state.errorInfo}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Zur Startseite
              </Button>
              <Button
                onClick={this.handleReload}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Seite neu laden
              </Button>
            </div>

            {/* Reassurance */}
            <p className="text-xs text-muted-foreground">
              Wenn das Problem weiterhin besteht, versuche die App neu zu starten.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: (props: P) => ComponentChildren,
  fallback?: ComponentChildren
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
