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
}

export function EmotionChips({ value = [], onChange, disabled }: EmotionChipsProps) {
  const [selected, setSelected] = useState<string[]>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  function toggleEmotion(emotion: string) {
    if (disabled) return;

    const newSelected = selected.includes(emotion)
      ? selected.filter((e) => e !== emotion)
      : selected.length < 2
        ? [...selected, emotion]
        : [selected[1], emotion]; // Replace last if already 2 selected

    setSelected(newSelected);
    onChange(newSelected);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Emotionen (max. 2):</label>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_EMOTIONS.map((emotion) => {
          const isSelected = selected.includes(emotion);
          return (
            <button
              key={emotion}
              type="button"
              onClick={() => toggleEmotion(emotion)}
              disabled={disabled || (!isSelected && selected.length >= 2)}
              className={`
                px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all duration-150 touch-feedback
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/50 shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95"
                }
                ${
                  disabled || (!isSelected && selected.length >= 2)
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
