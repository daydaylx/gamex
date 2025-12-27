import { useState, useEffect, useRef } from "preact/hooks";
import { Settings, X, Save, Download, Upload, Trash2, ShieldAlert, Sun, Moon } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { getAISettings, saveAISettings, validateSettings } from "../services/settings";
import { exportAllData, importAllData, downloadFile } from "../services/storage-migration";
import { useTheme } from "../contexts/ThemeContext";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { theme, toggleTheme } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [helpModel, setHelpModel] = useState("");
  const [reportModel, setReportModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleExport() {
    try {
      const data = exportAllData();
      const date = new Date().toISOString().split('T')[0];
      downloadFile(data, `gamex-backup-${date}.json`, "application/json");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError("Export fehlgeschlagen");
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (confirm("Möchtest du wirklich alle aktuellen Daten mit diesem Backup überschreiben?")) {
        importAllData(text);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          window.location.reload(); // Reload to apply imported data
        }, 1500);
      }
    } catch (err) {
      setError("Import fehlgeschlagen: " + (err instanceof Error ? err.message : "Ungültige Datei"));
    }
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm px-4" onClick={handleClose}>
      <div 
        className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="elevated" className="border-border/40">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Settings className="h-5 w-5 text-primary" />
                  Einstellungen
                </CardTitle>
                <CardDescription>
                  Verwalte deine Daten und KI-Optionen
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={loading}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Appearance Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Erscheinungsbild
              </h3>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex-row justify-between gap-3 rounded-xl"
                onClick={toggleTheme}
              >
                <div className="flex items-center gap-2">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span className="text-sm font-medium">
                    {theme === "dark" ? "Dunkler Modus" : "Heller Modus"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Tippen zum Wechseln</span>
              </Button>
            </div>

            <div className="h-px bg-border/40" />

            {/* Backup Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Download className="h-4 w-4" />
                Datensicherung & Backup
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 rounded-xl"
                  onClick={handleExport}
                >
                  <Download className="h-5 w-5 text-primary" />
                  <div className="text-xs font-medium">Exportieren</div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 rounded-xl"
                  onClick={handleImportClick}
                >
                  <Upload className="h-5 w-5 text-primary" />
                  <div className="text-xs font-medium">Importieren</div>
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json"
                  onChange={handleFileImport}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">
                Deine Daten werden als JSON-Datei lokal auf dein Gerät geladen.
              </p>
            </div>

            <div className="h-px bg-border/40" />

            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                KI-Konfiguration (OpenRouter)
              </h3>
              
              {/* API Key Input */}
              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  OpenRouter API-Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                  placeholder="sk-or-v1-..."
                  disabled={loading}
                  className="flex h-11 w-full rounded-xl border border-border/40 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Model Inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="help-model" className="text-sm font-medium">
                    Hilfe-Modell
                  </label>
                  <input
                    id="help-model"
                    type="text"
                    value={helpModel}
                    onInput={(e) => setHelpModel((e.target as HTMLInputElement).value)}
                    disabled={loading}
                    className="flex h-10 w-full rounded-lg border border-border/40 bg-surface px-3 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="report-model" className="text-sm font-medium">
                    Report-Modell
                  </label>
                  <input
                    id="report-model"
                    type="text"
                    value={reportModel}
                    onInput={(e) => setReportModel((e.target as HTMLInputElement).value)}
                    disabled={loading}
                    className="flex h-10 w-full rounded-lg border border-border/40 bg-surface px-3 text-xs"
                  />
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-500 bg-green-500/10 p-3 text-sm text-green-700 text-center font-medium">
                  Aktion erfolgreich!
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Schließen
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !apiKey.trim()}
                  className="gap-2 rounded-xl h-11 px-6"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


