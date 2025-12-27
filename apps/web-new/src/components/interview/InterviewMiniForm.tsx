/**
 * Interview Mini Form Component
 * Structured answer form with primary, comfort, emotion, conditions, notes
 */

import { useState, useEffect } from "preact/hooks";
import { ChevronDown, ChevronUp } from "lucide-preact";
import { Button } from "../ui/button";
import { ScaleInput } from "../form/ScaleInput";
import { EmotionChips } from "./EmotionChips";
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
  person,
  onChange,
  disabled = false,
}: InterviewMiniFormProps) {
  const [showOptional, setShowOptional] = useState(false);

  // Initialize form values from answer or defaults
  const primary = answer?.primary ?? null;
  const comfort = answer?.comfort ?? undefined;
  const emotion = answer?.emotion ?? [];
  const conditions = answer?.conditions ?? "";
  const notes = answer?.notes ?? "";

  function handlePrimaryChange(value: number | string) {
    onChange({ primary: value });
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
        <div className="space-y-3">
          <label className="text-sm font-medium">{scenario.primary_label}</label>
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
      const options = [
        { value: "ja", label: "Ja" },
        { value: "vielleicht", label: "Vielleicht" },
        { value: "nein", label: "Nein" },
      ];

      return (
        <div className="space-y-3">
          <label className="text-sm font-medium">{scenario.primary_label}</label>
          <div className="grid grid-cols-3 gap-3">
            {options.map((opt) => {
              const isSelected = primary === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="lg"
                  onClick={() => handlePrimaryChange(opt.value)}
                  disabled={disabled}
                  className={`
                    min-h-[56px] h-14 text-base font-semibold transition-all duration-150 touch-feedback
                    ${isSelected 
                      ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/25 scale-[1.02]' 
                      : 'active:scale-95'
                    }
                    ${opt.value === 'ja' && isSelected ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600' : ''}
                    ${opt.value === 'vielleicht' && isSelected ? 'bg-amber-500 hover:bg-amber-400 border-amber-500' : ''}
                    ${opt.value === 'nein' && isSelected ? 'bg-rose-600 hover:bg-rose-500 border-rose-600' : ''}
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
        <label className="text-sm font-medium">
          Komfort/Sicherheit (1-5) <span className="text-muted-foreground">(optional)</span>
        </label>
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
      <EmotionChips value={emotion} onChange={handleEmotionChange} disabled={disabled} />

      {/* Optional Fields (Collapsible) */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          disabled={disabled}
        >
          {showOptional ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showOptional ? "Weniger anzeigen" : "Bedingungen/Grenzen & Notizen hinzufügen"}
        </button>

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

