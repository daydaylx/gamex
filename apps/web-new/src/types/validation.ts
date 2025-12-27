/**
 * Validation Types
 */

export interface ValidationError {
  question_id: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
}

