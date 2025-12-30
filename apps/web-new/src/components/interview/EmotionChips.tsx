/**
 * Emotion Chips Component
 * Allows selection of 1-2 emotions
 */

import { useState, useEffect } from "preact/hooks";

const AVAILABLE_EMOTIONS = [
  "neugierig",
  "sicher",
  "unsicher",
  "aufgeregt",
  "entspannt",
  "angstvoll",
  "gelangweilt",
  "interessiert",
];

interface EmotionChipsProps {
  value?: string[];
  onChange: (emotions: string[]) => void;
  disabled?: boolean;
  label?: string;
  helper?: string;
  max?: number;
}

export function EmotionChips({
  value = [],
  onChange,
  disabled,
  label = "Emotionen (max. 2):",
  helper,
  max = 2,
}: EmotionChipsProps) {
  const [selected, setSelected] = useState<string[]>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  function toggleEmotion(emotion: string) {
    if (disabled) return;

    const newSelected = selected.includes(emotion)
      ? selected.filter((e) => e !== emotion)
      : selected.length < max
        ? [...selected, emotion]
        : [...selected.slice(1), emotion]; // Replace oldest if at max

    setSelected(newSelected);
    onChange(newSelected);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">
          {selected.length}/{max} gewählt
        </span>
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_EMOTIONS.map((emotion) => {
          const isSelected = selected.includes(emotion);
          return (
            <button
              key={emotion}
              type="button"
              onClick={() => toggleEmotion(emotion)}
              disabled={disabled || (!isSelected && selected.length >= max)}
              aria-pressed={isSelected}
              className={`
                px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all duration-150 touch-feedback border
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/50 shadow-md shadow-primary/20 border-primary/70"
                    : "bg-surface text-foreground border-border/70 hover:border-primary/40 hover:bg-accent active:scale-95"
                }
                ${
                  disabled || (!isSelected && selected.length >= max)
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
            >
              {emotion}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">Ausgewählt: {selected.join(", ")}</p>
      )}
    </div>
  );
}
