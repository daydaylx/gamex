import { useState, useEffect } from "preact/hooks";
import { X } from "lucide-preact";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { createSession, listTemplates } from "../services/api";
import type { TemplateListItem } from "../types";

interface CreateSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSessionDialog({ open, onClose, onSuccess }: CreateSessionDialogProps) {
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplatesData();
    }
  }, [open]);

  async function loadTemplatesData() {
    setLoadingTemplates(true);
    try {
      const data = await listTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0]!.id);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
      setError("Fehler beim Laden der Templates");
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Bitte gib einen Namen ein");
      return;
    }

    if (!selectedTemplate) {
      setError("Bitte wähle ein Template aus");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createSession({
        name: name.trim(),
        template_id: selectedTemplate,
      });

      // Reset form
      setName("");
      setSelectedTemplate(templates.length > 0 ? templates[0]!.id : "");

      // Notify parent
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create session:", err);
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen der Session");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setName("");
      setError(null);
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
                   sm:max-w-md sm:max-h-[85vh] sm:rounded-xl sm:bottom-auto sm:right-auto
                   animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="elevated" padding="none" className="border-border/40 m-0 rounded-t-2xl sm:rounded-xl">
          <CardHeader padding="comfortable">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-lg">Neue Session erstellen</CardTitle>
                <CardDescription>Wähle einen Namen und ein Fragebogen-Template aus.</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={loading}
                className="h-9 w-9 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent padding="comfortable">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="session-name" className="text-sm font-medium">
                  Session-Name
                </label>
                <input
                  id="session-name"
                  type="text"
                  value={name}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  placeholder="z.B. Dezember Check-in"
                  disabled={loading}
                  className="flex h-12 w-full rounded-lg border border-input bg-surface px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <label htmlFor="template-select" className="text-sm font-medium">
                  Fragebogen-Template
                </label>
                {loadingTemplates ? (
                  <div className="text-sm text-muted-foreground">Lädt Templates...</div>
                ) : (
                  <select
                    id="template-select"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate((e.target as HTMLSelectElement).value)}
                    disabled={loading}
                    className="flex h-12 w-full rounded-lg border border-input bg-surface px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.version ? `(${template.version})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {!loadingTemplates && templates.length === 0 && (
                  <p className="text-sm text-destructive">Keine Templates gefunden</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleClose}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || loadingTemplates || !name.trim() || !selectedTemplate}
                  className="min-w-[120px]"
                >
                  {loading ? "Erstellt..." : "Erstellen"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
