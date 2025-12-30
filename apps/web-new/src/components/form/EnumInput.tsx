import { haptics } from "../../platform/capacitor";

interface EnumInputProps {
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export function EnumInput({ value, onChange, options, disabled }: EnumInputProps) {
  const selected = value || "";

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            haptics.light();
            onChange(option.value);
          }}
          disabled={disabled}
          className={`
            w-full text-left px-4 py-3 rounded-lg border transition-all
            ${
              selected === option.value
                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50 hover:bg-accent"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${selected === option.value ? "border-primary" : "border-muted-foreground"}
            `}
            >
              {selected === option.value && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="font-medium">{option.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
