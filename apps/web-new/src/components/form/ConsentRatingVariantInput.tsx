import { ConsentRatingInput } from "./ConsentRatingInput";
import type { ConsentRatingValue } from "../../types/form";

type VariantType = "dom_sub" | "active_passive";

interface ConsentRatingVariantInputProps {
  variant: VariantType;
  value?: ConsentRatingValue;
  onChange: (value: ConsentRatingValue) => void;
  disabled?: boolean;
}

const VARIANT_CONFIG: Record<
  VariantType,
  { left: { key: "dom" | "active"; label: string }; right: { key: "sub" | "passive"; label: string } }
> = {
  dom_sub: {
    left: { key: "dom", label: "Dom" },
    right: { key: "sub", label: "Sub" },
  },
  active_passive: {
    left: { key: "active", label: "Aktiv" },
    right: { key: "passive", label: "Passiv" },
  },
};

function toSideValue(
  source: ConsentRatingValue | undefined,
  key: "dom" | "sub" | "active" | "passive"
): ConsentRatingValue | undefined {
  if (!source) return undefined;
  return {
    status: source[`${key}_status`],
    interest: source[`${key}_interest`],
    comfort: source[`${key}_comfort`],
  };
}

function mergeSideValue(
  source: ConsentRatingValue | undefined,
  key: "dom" | "sub" | "active" | "passive",
  next: ConsentRatingValue
): ConsentRatingValue {
  return {
    ...(source || {}),
    [`${key}_status`]: next.status,
    [`${key}_interest`]: next.interest,
    [`${key}_comfort`]: next.comfort,
  };
}

export function ConsentRatingVariantInput({
  variant,
  value,
  onChange,
  disabled,
}: ConsentRatingVariantInputProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{config.left.label}</p>
        <ConsentRatingInput
          value={toSideValue(value, config.left.key)}
          onChange={(next) => onChange(mergeSideValue(value, config.left.key, next))}
          disabled={disabled}
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{config.right.label}</p>
        <ConsentRatingInput
          value={toSideValue(value, config.right.key)}
          onChange={(next) => onChange(mergeSideValue(value, config.right.key, next))}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
