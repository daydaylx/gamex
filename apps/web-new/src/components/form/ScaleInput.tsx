import { useState, useEffect } from "preact/hooks";

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
  const [selected, setSelected] = useState<number | null>(value ?? null);

  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    if (selected !== null) {
      onChange(selected);
    }
  }, [selected]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {options.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setSelected(num)}
            disabled={disabled}
            className={`
              flex-1 min-h-[56px] h-14 rounded-lg font-semibold text-lg transition-all duration-150 touch-feedback
              ${
                selected === num
                  ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary scale-105 shadow-lg shadow-primary/25"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground active:scale-95"
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
