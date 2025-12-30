import { haptics } from "../../platform/capacitor";

interface MultiInputProps {
  value?: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export function MultiInput({ value, onChange, options, disabled }: MultiInputProps) {
  const selected = value || [];

  function toggleOption(optionValue: string) {
    haptics.light();
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  }

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            disabled={disabled}
            className={`
              w-full text-left px-4 py-3 rounded-lg border transition-all
              ${
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                w-4 h-4 rounded border-2 flex items-center justify-center
                ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}
              `}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="font-medium">{option.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
