import { describe, it, expect } from 'vitest';
import { validateResponses, isValid } from '../../../../src/services/validation/validator';
import type { Template } from '../../../../src/types';
import type { ResponseMap } from '../../../../src/types/form';

describe('Validation Service', () => {
  const createTemplate = (questions: any[]): Template => ({
    id: 'test',
    name: 'Test',
    version: 1,
    modules: [
      {
        id: 'mod1',
        name: 'Module 1',
        description: '',
        questions,
      },
    ],
  });

  describe('validateResponses', () => {
    it('should return empty errors/warnings for null template', () => {
      const result = validateResponses(null, {});
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should return empty errors/warnings for null responses', () => {
      const template = createTemplate([]);
      const result = validateResponses(template, null);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should warn about unknown question IDs', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'text', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        unknown_id: { value: 'test' },
      };

      const result = validateResponses(template, responses);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('Unbekannte Frage-ID');
    });
  });

  describe('scale_1_10 validation', () => {
    it('should validate values in range 1-10', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_1_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: { value: 5 },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toEqual([]);
    });

    it('should error on values outside range', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_1_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: { value: 11 },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('zwischen 1 und 10');
    });

    it('should error on values below range', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_1_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: { value: 0 },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('consent_rating validation - standard variant', () => {
    it('should validate complete valid response', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'YES',
          interest: 3,
          comfort: 3,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toEqual([]);
    });

    it('should require conditions for MAYBE status', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'MAYBE',
          interest: 2,
          comfort: 2,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('conditions');
      expect(result.errors[0]?.message).toContain('Bedingungen');
    });

    it('should accept conditions for MAYBE status', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'MAYBE',
          interest: 2,
          comfort: 2,
          conditions: 'Only with specific conditions',
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toEqual([]);
    });

    it('should warn on high interest + low comfort', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'YES',
          interest: 3,
          comfort: 2,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('Hohes Interesse');
      expect(result.warnings[0]?.message).toContain('niedriger Komfort');
    });

    it('should error on interest out of range', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'YES',
          interest: 5,
          comfort: 2,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('interest');
    });

    it('should warn on high-risk YES without conditions', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'C', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'YES',
          interest: 3,
          comfort: 3,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('High-Risk');
    });
  });

  describe('consent_rating validation - dom/sub variant', () => {
    it('should validate dom/sub responses', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          dom_status: 'YES',
          dom_interest: 3,
          dom_comfort: 3,
          sub_status: 'NO',
          sub_interest: 1,
          sub_comfort: 1,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toEqual([]);
    });

    it('should require conditions for dom MAYBE', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          dom_status: 'MAYBE',
          dom_interest: 2,
          dom_comfort: 2,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('dom_conditions');
    });

    it('should require conditions for sub MAYBE', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          sub_status: 'MAYBE',
          sub_interest: 2,
          sub_comfort: 2,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('sub_conditions');
    });

    it('should warn on high dom interest + low comfort', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          dom_status: 'YES',
          dom_interest: 4,
          dom_comfort: 1,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.field).toBe('dom_interest');
    });
  });

  describe('consent_rating validation - active/passive variant', () => {
    it('should validate active/passive responses', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          active_status: 'YES',
          active_interest: 3,
          active_comfort: 3,
          passive_status: 'NO',
          passive_interest: 1,
          passive_comfort: 1,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toEqual([]);
    });

    it('should require conditions for active MAYBE', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          active_status: 'MAYBE',
          active_interest: 2,
          active_comfort: 2,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('active_conditions');
    });

    it('should require conditions for passive MAYBE', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          passive_status: 'MAYBE',
          passive_interest: 2,
          passive_comfort: 2,
        },
      };

      const result = validateResponses(template, responses);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('passive_conditions');
    });
  });

  describe('isValid helper', () => {
    it('should return true for valid responses', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'YES',
          interest: 3,
          comfort: 3,
        },
      };

      expect(isValid(template, responses)).toBe(true);
    });

    it('should return false for invalid responses', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'MAYBE',
          interest: 2,
          comfort: 2,
          // Missing conditions
        },
      };

      expect(isValid(template, responses)).toBe(false);
    });

    it('should ignore warnings when checking validity', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'C', tags: [], label: 'Q1' },
      ]);
      const responses: ResponseMap = {
        q1: {
          status: 'YES',
          interest: 3,
          comfort: 3,
          // No conditions (warning only)
        },
      };

      expect(isValid(template, responses)).toBe(true); // Warnings don't affect validity
    });
  });
});
