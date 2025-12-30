import { useState, useEffect } from "preact/hooks";
import { ChevronDown, ChevronUp } from "lucide-preact";
import { haptics } from "../../platform/capacitor";
import type { ConsentRatingValue } from "../../types/form";
import type { YesMaybeNo } from "../../types/common";

interface ConsentRatingInputProps {
  value?: ConsentRatingValue;
  onChange: (value: ConsentRatingValue) => void;
  disabled?: boolean;
}

type ConsentStatus = YesMaybeNo | "HARD_LIMIT" | "";

const STATUS_OPTIONS = [
  { value: "YES" as const, label: "Ja", color: "bg-green-500 hover:bg-green-600" },
  { value: "MAYBE" as const, label: "Vielleicht", color: "bg-yellow-500 hover:bg-yellow-600" },
  { value: "NO" as const, label: "Nein", color: "bg-red-500 hover:bg-red-600" },
  { value: "HARD_LIMIT" as const, label: "Hard Limit", color: "bg-red-900 hover:bg-red-950" },
] as const;

const SCALE_OPTIONS = [1, 2, 3, 4, 5];

export function ConsentRatingInput({ value, onChange, disabled }: ConsentRatingInputProps) {
  const [status, setStatus] = useState<ConsentStatus>((value?.status as ConsentStatus) || "");
  const [interest, setInterest] = useState<number | null>(value?.interest ?? null);
  const [comfort, setComfort] = useState<number | null>(value?.comfort ?? null);
  const [showComfort, setShowComfort] = useState(false);

  // Update when value prop changes (e.g., when loading saved responses)
  useEffect(() => {
    if (!value) {
      setStatus("");
      setInterest(null);
      setComfort(null);
      setShowComfort(false);
      return;
    }

    setStatus((value.status as ConsentStatus) || "");
    setInterest(value.interest ?? null);
    setComfort(value.comfort ?? null);

    const hasComfort = value.comfort !== null && value.comfort !== undefined;
    setShowComfort(hasComfort);
  }, [value?.status, value?.interest, value?.comfort]);

  // Notify parent when main answer (status + interest) changes
  useEffect(() => {
    if (status !== "" && interest !== null) {
      const newValue: ConsentRatingValue = {
        status: status as YesMaybeNo | "HARD_LIMIT",
        interest,
      };
      // Include comfort only if it's set
      if (comfort !== null) {
        newValue.comfort = comfort;
      }
      onChange(newValue);
    }
  }, [status, interest, comfort]);

  return (
    <div className="space-y-6">
      {/* Status Selection - Main Answer Part 1 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Deine Einstellung</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                haptics.light();
                setStatus(option.value);
              }}
              disabled={disabled}
              className={`
                px-4 py-3 rounded-lg font-medium text-white transition-all
                ${status === option.value ? option.color + " ring-2 ring-offset-2 ring-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interest Scale - Main Answer Part 2 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Interesse (1 = gering, 5 = hoch)</label>
        <div className="flex gap-2">
          {SCALE_OPTIONS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                haptics.light();
                setInterest(num);
              }}
              disabled={disabled}
              aria-pressed={interest === num}
              className={`
                flex-1 h-12 rounded-lg font-semibold transition-all border
                ${
                  interest === num
                    ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary border-primary/70"
                    : "bg-surface text-foreground border-border/70 hover:border-primary/40 hover:bg-accent"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Comfort Scale - Optional, Collapsible */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            haptics.light();
            setShowComfort(!showComfort);
          }}
          disabled={disabled}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {showComfort ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Komfort ausblenden
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Komfort hinzufügen (optional)
            </>
          )}
        </button>

        {showComfort && (
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">Komfort (1 = unbehaglich, 5 = sehr wohl)</label>
            <div className="flex gap-2">
              {SCALE_OPTIONS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setComfort(num);
                  }}
                  disabled={disabled}
                  aria-pressed={comfort === num}
                  className={`
                    flex-1 h-12 rounded-lg font-semibold transition-all border
                    ${
                      comfort === num
                        ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary border-primary/70"
                        : "bg-surface text-foreground border-border/70 hover:border-primary/40 hover:bg-accent"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
