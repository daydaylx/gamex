/**
 * Response Validation Service
 * Validates questionnaire responses against template schema
 */

import type { Template, Question, RiskLevel } from '../../types';
import type { ResponseMap, ResponseValue, ConsentRatingValue } from '../../types/form';
import type { ValidationError } from '../../types/validation';

interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates that a value is within the specified range
 */
function validateRange(
  qid: string,
  _label: string,
  field: string,
  value: unknown,
  min: number,
  max: number,
  errors: ValidationError[],
  fieldLabel: string
): void {
  if (value !== null && value !== undefined) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      errors.push({
        question_id: qid,
        field,
        message: `${fieldLabel} muss zwischen ${min} und ${max} liegen`,
        severity: 'error',
      });
    }
  }
}

/**
 * Validates scale_0_10 question responses
 */
function validateScale(
  qid: string,
  respData: ResponseValue,
  label: string,
  errors: ValidationError[]
): void {
  if (typeof respData === 'object' && respData !== null && 'value' in respData) {
    const value = respData.value;
    if (value !== null && value !== undefined) {
      validateRange(qid, label, 'value', value, 0, 10, errors, 'Wert');
    }
  }
}

/**
 * Validates consent_rating question responses (most complex validation)
 */
function validateConsentRating(
  qid: string,
  respData: ResponseValue,
  label: string,
  riskLevel: RiskLevel,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (typeof respData !== 'object' || respData === null) return;

  const data = respData as ConsentRatingValue & Record<string, unknown>;

  // Check which variant we're using
  const hasDomSub = data.dom_status || data.sub_status;
  const hasActivePassive = data.active_status || data.passive_status;

  if (hasDomSub) {
    // Dom/Sub variant
    const domStatus = data.dom_status;
    const subStatus = data.sub_status;
    const conditions = (data.dom_conditions || data.conditions || '').toString().trim();

    if (domStatus === 'MAYBE' && !conditions) {
      errors.push({
        question_id: qid,
        field: 'dom_conditions',
        message: "Dom Status 'VIELLEICHT' erfordert Bedingungen",
        severity: 'error',
      });
    }
    if (subStatus === 'MAYBE' && !conditions) {
      errors.push({
        question_id: qid,
        field: 'sub_conditions',
        message: "Sub Status 'VIELLEICHT' erfordert Bedingungen",
        severity: 'error',
      });
    }

    // Validate dom and sub interest/comfort
    for (const variant of ['dom', 'sub'] as const) {
      const interest = data[`${variant}_interest`];
      const comfort = data[`${variant}_comfort`];
      const variantLabel = variant.charAt(0).toUpperCase() + variant.slice(1);

      validateRange(qid, label, `${variant}_interest`, interest, 0, 4, errors, `${variantLabel} Interesse`);
      validateRange(qid, label, `${variant}_comfort`, comfort, 0, 4, errors, `${variantLabel} Komfort`);

      // Warn if high interest but low comfort
      if (typeof interest === 'number' && typeof comfort === 'number' && interest >= 3 && comfort <= 2) {
        warnings.push({
          question_id: qid,
          field: `${variant}_interest`,
          message: `${variantLabel}: Hohes Interesse (${interest}) aber niedriger Komfort (${comfort})`,
          severity: 'warning',
        });
      }
    }
  } else if (hasActivePassive) {
    // Active/Passive variant
    const activeStatus = data.active_status;
    const passiveStatus = data.passive_status;
    const conditions = (data.active_conditions || data.passive_conditions || data.conditions || '').toString().trim();

    if (activeStatus === 'MAYBE' && !conditions) {
      errors.push({
        question_id: qid,
        field: 'active_conditions',
        message: "Aktiv Status 'VIELLEICHT' erfordert Bedingungen",
        severity: 'error',
      });
    }
    if (passiveStatus === 'MAYBE' && !conditions) {
      errors.push({
        question_id: qid,
        field: 'passive_conditions',
        message: "Passiv Status 'VIELLEICHT' erfordert Bedingungen",
        severity: 'error',
      });
    }

    // Validate active and passive interest/comfort
    for (const variant of ['active', 'passive'] as const) {
      const interest = data[`${variant}_interest`];
      const comfort = data[`${variant}_comfort`];
      const variantLabel = variant.charAt(0).toUpperCase() + variant.slice(1);

      validateRange(qid, label, `${variant}_interest`, interest, 0, 4, errors, `${variantLabel} Interesse`);
      validateRange(qid, label, `${variant}_comfort`, comfort, 0, 4, errors, `${variantLabel} Komfort`);

      // Warn if high interest but low comfort
      if (typeof interest === 'number' && typeof comfort === 'number' && interest >= 3 && comfort <= 2) {
        warnings.push({
          question_id: qid,
          field: `${variant}_interest`,
          message: `${variantLabel}: Hohes Interesse (${interest}) aber niedriger Komfort (${comfort})`,
          severity: 'warning',
        });
      }
    }
  } else {
    // Standard variant
    const status = data.dom_status || data.status;
    const conditions = (data.dom_conditions || data.conditions || '').toString().trim();
    const interest = data.interest;
    const comfort = data.comfort;

    if (status === 'MAYBE' && !conditions) {
      errors.push({
        question_id: qid,
        field: 'conditions',
        message: "Bei Status 'VIELLEICHT' müssen Bedingungen angegeben werden",
        severity: 'error',
      });
    }

    validateRange(qid, label, 'interest', interest, 0, 4, errors, 'Interesse');
    validateRange(qid, label, 'comfort', comfort, 0, 4, errors, 'Komfort');

    // Warn if high interest but low comfort
    if (typeof interest === 'number' && typeof comfort === 'number' && interest >= 3 && comfort <= 2) {
      warnings.push({
        question_id: qid,
        field: 'interest',
        message: `Hohes Interesse (${interest}) aber niedriger Komfort (${comfort})`,
        severity: 'warning',
      });
    }

    // High-risk warning for YES without conditions
    if (riskLevel === 'C' && status === 'YES' && !conditions) {
      warnings.push({
        question_id: qid,
        field: 'conditions',
        message: 'High-Risk Frage: Bitte Bedingungen für Sicherheit notieren',
        severity: 'warning',
      });
    }
  }
}

/**
 * Validates all responses against the template
 */
export function validateResponses(
  template: Template | null | undefined,
  responses: ResponseMap | null | undefined
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!template || !template.modules) {
    return { errors, warnings };
  }

  // Build question map for quick lookup
  const questionMap: Record<string, Question> = {};
  for (const mod of template.modules || []) {
    for (const q of mod.questions || []) {
      questionMap[q.id] = q;
    }
  }

  // Validate each response
  for (const [qid, respData] of Object.entries(responses || {})) {
    if (!respData || (typeof respData !== 'object' && typeof respData !== 'number' && typeof respData !== 'string')) {
      continue;
    }

    const question = questionMap[qid];
    if (!question) {
      warnings.push({
        question_id: qid,
        field: undefined,
        message: 'Unbekannte Frage-ID (kann von anderer Template-Version sein)',
        severity: 'warning',
      });
      continue;
    }

    const schema = question.schema;
    const riskLevel = question.risk_level || 'A';
    const label = question.label || qid;

    if (schema === 'consent_rating') {
      validateConsentRating(qid, respData, label, riskLevel, errors, warnings);
    } else if (schema === 'scale_0_10') {
      validateScale(qid, respData, label, errors);
    }
    // Other schemas don't have validation rules yet
  }

  return { errors, warnings };
}

/**
 * Checks if responses are valid (no errors)
 */
export function isValid(template: Template | null | undefined, responses: ResponseMap | null | undefined): boolean {
  const result = validateResponses(template, responses);
  return result.errors.length === 0;
}
