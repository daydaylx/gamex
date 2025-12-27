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
      console.error('Failed to load templates:', err);
      setError('Fehler beim Laden der Templates');
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein');
      return;
    }

    if (!selectedTemplate) {
      setError('Bitte wähle ein Template aus');
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
      console.error('Failed to create session:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Session');
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
        className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle>Neue Session erstellen</CardTitle>
                <CardDescription>
                  Wähle einen Namen und ein Fragebogen-Template aus
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.version ? `(${template.version})` : ''}
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
                  disabled={loading || loadingTemplates || !name.trim() || !selectedTemplate}
                >
                  {loading ? 'Erstellt...' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

