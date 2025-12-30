/**
 * Interview Mini Form Component
 * Structured answer form with primary, comfort, emotion, conditions, notes
 */

import { useEffect, useState } from "preact/hooks";
import { ChevronDown, ChevronUp } from "lucide-preact";
import { Button } from "../ui/button";
import { ScaleInput } from "../form/ScaleInput";
import { EmotionChips } from "./EmotionChips";
import { haptics } from "../../platform/capacitor";
import type { InterviewAnswer, InterviewScenario } from "../../types/interview";

interface InterviewMiniFormProps {
  scenario: InterviewScenario;
  answer?: InterviewAnswer | null;
  person: "A" | "B";
  onChange: (answer: Partial<InterviewAnswer>) => void;
  disabled?: boolean;
}

export function InterviewMiniForm({
  scenario,
  answer,
  person: _person,
  onChange,
  disabled = false,
}: InterviewMiniFormProps) {
  void _person; // Reserved for person-specific styling
  const [showOptional, setShowOptional] = useState(false);

  // Initialize form values from answer or defaults
  const primary = answer?.primary ?? null;
  const comfort = answer?.comfort ?? undefined;
  const emotion = answer?.emotion ?? [];
  const conditions = answer?.conditions ?? "";
  const notes = answer?.notes ?? "";
  const hasOptional = Boolean(conditions.trim() || notes.trim());

  useEffect(() => {
    setShowOptional(hasOptional);
  }, [scenario.id]);

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
    const header = (
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">1) {scenario.primary_label}</label>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Pflicht</span>
      </div>
    );

    if (scenario.primary_answer_type === "likert5") {
      return (
        <div className="space-y-3">
          {header}
          <p className="text-xs text-muted-foreground">1 = gar nicht, 5 = sehr.</p>
          <ScaleInput
            value={typeof primary === "number" ? primary : undefined}
            onChange={(val) => handlePrimaryChange(val)}
            min={1}
            max={5}
            disabled={disabled}
          />
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
          {header}
          <p className="text-xs text-muted-foreground">Wähle eine Option.</p>
          <div className="grid grid-cols-3 gap-3">
            {options.map((opt) => {
              const isSelected = primary === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={isSelected ? opt.variant : "outline"}
                  size="lg"
                  onClick={() => handlePrimaryChange(opt.value)}
                  disabled={disabled}
                  ripple={isSelected}
                  aria-pressed={isSelected}
                  className={`
                    min-h-[56px] h-14 text-base transition-all duration-200
                    ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-offset-background scale-[1.02]"
                        : "active:scale-95"
                    }
                  `}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">2) Komfort/Sicherheit</label>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Optional</span>
        </div>
        <p className="text-xs text-muted-foreground">Wie wohl fühlst du dich dabei?</p>
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
        label="3) Emotionen (optional)"
        helper="Wähle bis zu zwei Gefühle, die gerade passen."
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
          {showOptional ? "Details ausblenden" : "Mehr Details (optional)"}
        </button>

        {!showOptional && (
          <p className="text-xs text-muted-foreground">
            Bedingungen, Grenzen oder Notizen ergänzen.
          </p>
        )}

        {showOptional && (
          <div className="mt-4 space-y-4">
            {/* Conditions */}
            <div className="space-y-2">
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
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notizen
              </label>
              <textarea
                id="notes"
                value={notes}
                onInput={(e) => handleNotesChange((e.target as HTMLTextAreaElement).value)}
                disabled={disabled}
                placeholder="z.B. Kommt sehr auf Stimmung an..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
