import { useState, useEffect } from "preact/hooks";
import { Settings, X, Save } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { getAISettings, saveAISettings, validateSettings } from "../services/settings";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [helpModel, setHelpModel] = useState("");
  const [reportModel, setReportModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  function loadSettings() {
    const settings = getAISettings();
    setApiKey(settings.apiKey);
    setHelpModel(settings.helpModel);
    setReportModel(settings.reportModel);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    const validation = validateSettings({
      apiKey,
      helpModel,
      reportModel,
    });

    if (!validation.valid) {
      setError(validation.error || "Ungültige Einstellungen");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      saveAISettings({
        apiKey: apiKey.trim(),
        helpModel: helpModel.trim(),
        reportModel: reportModel.trim(),
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Einstellungen');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      loadSettings(); // Reset to saved values
      setError(null);
      setSuccess(false);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={handleClose}>
      <div 
        className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  KI-Einstellungen
                </CardTitle>
                <CardDescription>
                  Konfiguriere deinen OpenRouter API-Key und die verwendeten Modelle
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={loading}
                className="h-6 w-6 rounded-md"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* API Key Input */}
              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  OpenRouter API-Key <span className="text-destructive">*</span>
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                  placeholder="sk-or-v1-..."
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Du kannst deinen API-Key auf{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    openrouter.ai/keys
                  </a>{" "}
                  erstellen.
                </p>
              </div>

              {/* Help Model Input */}
              <div className="space-y-2">
                <label htmlFor="help-model" className="text-sm font-medium">
                  Modell für Hilfe-Popup
                </label>
                <input
                  id="help-model"
                  type="text"
                  value={helpModel}
                  onInput={(e) => setHelpModel((e.target as HTMLInputElement).value)}
                  placeholder="z.B. openai/gpt-4o-mini"
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Modell-ID von OpenRouter (z.B. openai/gpt-4o-mini, anthropic/claude-3-haiku)
                </p>
              </div>

              {/* Report Model Input */}
              <div className="space-y-2">
                <label htmlFor="report-model" className="text-sm font-medium">
                  Modell für Auswertung
                </label>
                <input
                  id="report-model"
                  type="text"
                  value={reportModel}
                  onInput={(e) => setReportModel((e.target as HTMLInputElement).value)}
                  placeholder="z.B. openai/gpt-4o-mini"
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Modell-ID von OpenRouter für die KI-Auswertung
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="rounded-md border border-green-500 bg-green-500/10 p-3 text-sm text-green-700">
                  Einstellungen erfolgreich gespeichert!
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !apiKey.trim() || !helpModel.trim() || !reportModel.trim()}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Speichert...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

