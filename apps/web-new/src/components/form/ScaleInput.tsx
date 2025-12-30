import { haptics } from "../../platform/capacitor";

interface ScaleInputProps {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: { min?: string; max?: string };
  disabled?: boolean;
}

export function ScaleInput({
  value,
  onChange,
  min = 1,
  max = 5,
  labels,
  disabled,
}: ScaleInputProps) {
  const selected = value ?? null;
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => {
              haptics.light();
              onChange(num);
            }}
            disabled={disabled}
            aria-pressed={selected === num}
            className={`
              flex-1 min-h-[56px] h-14 rounded-lg font-semibold text-lg transition-all duration-150 touch-feedback border
              ${
                selected === num
                  ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary scale-105 shadow-lg shadow-primary/25 border-primary/70"
                  : "bg-surface text-foreground border-border/70 hover:border-primary/40 hover:bg-accent active:scale-95"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {num}
          </button>
        ))}
      </div>

      {labels && (labels.min || labels.max) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{labels.min || ""}</span>
          <span>{labels.max || ""}</span>
        </div>
      )}
    </div>
  );
}
