import { useState, useEffect, useRef } from "preact/hooks";
import {
  Settings,
  X,
  Save,
  Download,
  Upload,
  ShieldAlert,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from "lucide-preact";
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
  const [showApiKey, setShowApiKey] = useState(false);
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
      const date = new Date().toISOString().split("T")[0];
      downloadFile(data, `gamex-backup-${date}.json`, "application/json");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
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
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(
        "Import fehlgeschlagen: " + (err instanceof Error ? err.message : "Ungültige Datei")
      );
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
      console.error("Failed to save settings:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Speichern der Einstellungen");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      loadSettings();
      setError(null);
      setSuccess(false);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={handleClose}>
      <div
        data-dialog="sheet"
        className="dialog-container fixed bottom-0 left-0 right-0 z-50 w-full max-h-[90vh] overflow-y-auto
                   sm:fixed sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] 
                   sm:max-w-lg sm:max-h-[85vh] sm:rounded-xl sm:bottom-auto sm:right-auto
                   animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="elevated" className="border-border/40 m-0 rounded-t-2xl sm:rounded-xl">
          {/* Mobile Bottom Sheet Handle */}
          <div className="w-full flex justify-center pt-3 sm:hidden">
            <div className="w-8 h-1 bg-border/60 rounded-full" />
          </div>

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-primary" />
                  Einstellungen
                </CardTitle>
                <CardDescription>Verwalte deine Daten und KI-Optionen.</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={loading}
                className="rounded-full h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            {/* Appearance Section */}
            <div className="space-y-3">
              <h3 className="section-title flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Erscheinungsbild
              </h3>
              <p className="section-subtitle">
                Passe die Darstellung an deine Umgebung an
              </p>
              <Button
                variant="outline"
                className="w-full h-12 flex-row justify-between gap-3 rounded-xl"
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

            <div className="section-divider" />

            {/* Backup Section */}
            <div className="space-y-3">
              <h3 className="section-title flex items-center gap-2">
                <Download className="h-4 w-4" />
                Datensicherung & Backup
              </h3>
              <p className="section-subtitle">
                Exportiere deine Daten als JSON oder importiere ein Backup
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 flex-row items-center justify-center gap-2 rounded-xl"
                  onClick={handleExport}
                >
                  <Download className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Exportieren</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex-row items-center justify-center gap-2 rounded-xl"
                  onClick={handleImportClick}
                >
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Importieren</span>
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleFileImport}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center italic">
                Deine Daten werden als JSON-Datei lokal auf dein Gerät gespeichert.
              </p>
            </div>

            <div className="section-divider" />

            {/* AI Configuration Section */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="section-title flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                KI-Konfiguration (OpenRouter)
              </h3>
              <p className="section-subtitle">
                Konfiguriere deine API-Zugänge und Modelle für KI-Funktionen
              </p>

              {/* API Key Input */}
              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium block">
                  OpenRouter API-Key
                </label>
                <div className="relative">
                  <input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                    placeholder="sk-or-v1-..."
                    disabled={loading}
                    className="flex h-12 w-full rounded-xl border border-border/40 bg-surface 
                               px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 
                               focus:ring-primary/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={loading}
                    className="absolute right-1 top-1 h-10 px-2 rounded-lg"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dein Key wird lokal gespeichert und niemals an unsere Server gesendet
                </p>
              </div>

              {/* Model Inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="help-model" className="text-sm font-medium block">
                    Hilfe-Modell
                  </label>
                  <input
                    id="help-model"
                    type="text"
                    value={helpModel}
                    onInput={(e) => setHelpModel((e.target as HTMLInputElement).value)}
                    disabled={loading}
                    placeholder="z.B. anthropic/claude-3-haiku"
                    className="flex h-11 w-full rounded-lg border border-border/40 bg-surface 
                               px-3 py-2 text-sm focus:outline-none focus:ring-2 
                               focus:ring-primary/20 transition-all"
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird für interaktive Hilfe verwendet
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="report-model" className="text-sm font-medium block">
                    Report-Modell
                  </label>
                  <input
                    id="report-model"
                    type="text"
                    value={reportModel}
                    onInput={(e) => setReportModel((e.target as HTMLInputElement).value)}
                    disabled={loading}
                    placeholder="z.B. anthropic/claude-3-sonnet"
                    className="flex h-11 w-full rounded-lg border border-border/40 bg-surface 
                               px-3 py-2 text-sm focus:outline-none focus:ring-2 
                               focus:ring-primary/20 transition-all"
                  />
                  <p className="text-xs text-muted-foreground">Für Analyse-Berichte</p>
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
                  <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 p-4 text-sm text-emerald-200 text-center font-medium flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Aktion erfolgreich!
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full sm:w-auto h-12"
                >
                  Schließen
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !apiKey.trim()}
                  className="gap-2 rounded-xl h-12 px-6 w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
