import { useState, useEffect } from "preact/hooks";
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
  const [status, setStatus] = useState<ConsentStatus>(value?.status || "");
  const [interest, setInterest] = useState<number | null>(value?.interest ?? null);
  const [comfort, setComfort] = useState<number | null>(value?.comfort ?? null);

  useEffect(() => {
    if (status !== "" && interest !== null && comfort !== null) {
      onChange({
        status: status as YesMaybeNo | "HARD_LIMIT",
        interest,
        comfort,
      });
    }
  }, [status, interest, comfort]);

  return (
    <div className="space-y-6">
      {/* Status Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Deine Einstellung</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              disabled={disabled}
              className={`
                px-4 py-3 rounded-lg font-medium text-white transition-all
                ${status === option.value ? option.color + ' ring-2 ring-offset-2 ring-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interest Scale */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Interesse (1 = gering, 5 = hoch)
        </label>
        <div className="flex gap-2">
          {SCALE_OPTIONS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setInterest(num)}
              disabled={disabled}
              className={`
                flex-1 h-12 rounded-lg font-semibold transition-all
                ${interest === num 
                  ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Comfort Scale */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Komfort (1 = unbehaglich, 5 = sehr wohl)
        </label>
        <div className="flex gap-2">
          {SCALE_OPTIONS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setComfort(num)}
              disabled={disabled}
              className={`
                flex-1 h-12 rounded-lg font-semibold transition-all
                ${comfort === num 
                  ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

