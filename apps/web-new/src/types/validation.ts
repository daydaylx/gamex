/**
 * Validation types for form validation
 */

export interface ValidationError {
  question_id: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface QuestionValidationResult {
  question_id: string;
  valid: boolean;
  errors: ValidationError[];
}
