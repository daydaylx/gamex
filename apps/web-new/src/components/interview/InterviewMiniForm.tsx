/**
 * Interview Mini Form Component
 * Structured answer form with primary, comfort, emotion, conditions, notes
 */

import { useEffect, useState } from "preact/hooks";
import { ChevronDown, ChevronUp, Send, SkipForward } from "lucide-preact";
import { Button } from "../ui/button";
import { ScaleInput } from "../form/ScaleInput";
import { EmotionChips } from "./EmotionChips";
import { haptics } from "../../platform/capacitor";
import type { InterviewAnswer, InterviewScenario } from "../../types/interview";

interface InterviewMiniFormProps {
  scenario: InterviewScenario;
  answer?: Partial<InterviewAnswer> | null;
  person: "A" | "B";
  onChange: (answer: Partial<InterviewAnswer>) => void;
  onSubmit?: (override?: Partial<InterviewAnswer>) => void;
  onSkip?: () => void;
  autoAdvance?: boolean;
  disabled?: boolean;
}

export function InterviewMiniForm({
  scenario,
  answer,
  person: _person,
  onChange,
  onSubmit,
  onSkip,
  autoAdvance = false,
  disabled = false,
}: InterviewMiniFormProps) {
  void _person; // Reserved for person-specific styling
  const [showOptional, setShowOptional] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  // Initialize form values from answer or defaults
  const primary = answer?.primary ?? null;
  const comfort = answer?.comfort ?? undefined;
  const emotion = answer?.emotion ?? [];
  const conditions = answer?.conditions ?? "";
  const notes = answer?.notes ?? "";
  const hasOptional = Boolean(conditions.trim() || notes.trim());

  useEffect(() => {
    setShowOptional(hasOptional);
    setAutoSubmitted(false);
  }, [scenario.id, hasOptional]);

  useEffect(() => {
    if (hasOptional && !showOptional) {
      setShowOptional(true);
    }
  }, [hasOptional, showOptional]);

  async function handlePrimaryChange(value: number | string) {
    onChange({ primary: value });
    // Haptic feedback based on answer type
    if (typeof value === "string") {
      // Yes/Maybe/No - different feedback per choice
      if (value === "ja") await haptics.success();
      else if (value === "vielleicht") await haptics.light();
      else if (value === "nein") await haptics.medium();
    } else {
      // Likert scale - light feedback
      await haptics.light();
    }

    if (autoAdvance && onSubmit && !autoSubmitted) {
      setAutoSubmitted(true);
      setTimeout(() => onSubmit({ primary: value }), 220);
    }
  }

  function handleComfortChange(value: number) {
    onChange({ comfort: value });
  }

  function handleEmotionChange(emotions: string[]) {
    onChange({ emotion: emotions });
  }

  function handleConditionsChange(text: string) {
    onChange({ conditions: text });
  }

  function handleNotesChange(text: string) {
    onChange({ notes: text });
  }

  // Render primary answer input based on type
  function renderPrimaryInput() {
    if (scenario.primary_answer_type === "likert5") {
      return (
        <div className="rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{scenario.primary_label}</span>
            <span>1 = gar nicht, 5 = sehr</span>
          </div>
          <ScaleInput
            value={typeof primary === "number" ? primary : undefined}
            onChange={(val) => handlePrimaryChange(val)}
            min={1}
            max={5}
            disabled={disabled}
          />
          <div className="text-[11px] text-muted-foreground">Sende automatisch nach Auswahl.</div>
        </div>
      );
    }

    if (scenario.primary_answer_type === "yes_maybe_no") {
      const options: Array<{ value: string; label: string; variant: "yes" | "maybe" | "no" }> = [
        { value: "ja", label: "Ja", variant: "yes" },
        { value: "vielleicht", label: "Vielleicht", variant: "maybe" },
        { value: "nein", label: "Nein", variant: "no" },
      ];

      return (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-semibold">{scenario.primary_label}</div>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isSelected = primary === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePrimaryChange(opt.value)}
                  disabled={disabled}
                  className={`
                    inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all shadow-sm
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground hover:bg-muted border-border"
                    }
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-muted-foreground">Tippe eine Antwort an, um automatisch fortzufahren.</div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-6">
      {/* Primary Answer (Required) */}
      {renderPrimaryInput()}

      {/* Comfort Scale (Optional but recommended) */}
      <div className="rounded-2xl bg-muted/60 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">Komfort/Sicherheit</label>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Optional</span>
        </div>
        <ScaleInput
          value={comfort}
          onChange={handleComfortChange}
          min={1}
          max={5}
          labels={{ min: "Unwohl", max: "Sehr wohl" }}
          disabled={disabled}
        />
      </div>

      {/* Emotion Chips (Optional) */}
      <EmotionChips
        value={emotion}
        onChange={handleEmotionChange}
        disabled={disabled}
        label="Emotionen (optional)"
        helper="Füge bis zu zwei Gefühle als Nachricht hinzu."
      />

      {/* Optional Fields (Collapsible) */}
      <div className="border-t pt-4 space-y-2">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          disabled={disabled}
          aria-expanded={showOptional}
        >
          {showOptional ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showOptional ? "Details ausblenden" : "Freitext & Bedingungen"}
        </button>

        {!showOptional && (
          <p className="text-xs text-muted-foreground">Teile Grenzen oder Notizen als Chat-Beitrag.</p>
        )}

        {showOptional && (
          <div className="mt-4 space-y-4">
            {/* Conditions */}
            <div className="space-y-2 rounded-2xl bg-background/80 border px-3 py-3">
              <label htmlFor="conditions" className="text-sm font-medium">
                Bedingungen/Grenzen
              </label>
              <textarea
                id="conditions"
                value={conditions}
                onInput={(e) => handleConditionsChange((e.target as HTMLTextAreaElement).value)}
                disabled={disabled}
                placeholder="z.B. Nur wenn ich jederzeit stoppen kann..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 rounded-2xl bg-background/80 border px-3 py-3">
              <label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                Freitext-Nachricht
              </label>
              <textarea
                id="notes"
                value={notes}
                onInput={(e) => handleNotesChange((e.target as HTMLTextAreaElement).value)}
                disabled={disabled}
                placeholder="Schreib eine kurze Notiz, sie erscheint als gesendete Nachricht."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <div className="flex justify-between items-center pt-1 text-[11px] text-muted-foreground">
                <span>Optional – wird zusammen mit der Antwort gespeichert.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  disabled={!primary || disabled}
                  onClick={() => onSubmit?.()}
                >
                  <Send className="h-3.5 w-3.5" /> Senden
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <SkipForward className="h-4 w-4" />
          <button
            type="button"
            onClick={() => onSkip?.()}
            className="underline decoration-dotted underline-offset-4"
          >
            Szene überspringen
          </button>
        </div>
        {!autoAdvance && onSubmit && (
          <Button type="button" size="sm" onClick={() => onSubmit()}>Weiter</Button>
        )}
      </div>
    </div>
  );
}
