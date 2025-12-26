import { describe, it, expect } from 'vitest';
import { compare } from '../../../../src/services/comparison/compare';
import type { Template } from '../../../../src/types';
import type { ResponseMap } from '../../../../src/types/form';

describe('Comparison Service', () => {
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

  describe('compare', () => {
    it('should return empty result for null template', () => {
      const result = compare(null, {}, {});
      expect(result.items).toEqual([]);
      expect(result.action_plan).toEqual([]);
    });

    it('should return empty result for null responses', () => {
      const template = createTemplate([]);
      const result = compare(template, null, null);
      expect(result.items).toEqual([]);
      expect(result.action_plan).toEqual([]);
    });

    it('should skip questions not in template', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'text', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { text: 'A' },
        unknown: { text: 'Unknown' },
      };
      const respB: ResponseMap = {
        q1: { text: 'B' },
      };

      const result = compare(template, respA, respB);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.question_id).toBe('q1');
    });
  });

  describe('consent_rating - standard variant', () => {
    it('should return MATCH for both YES', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.pair_status).toBe('MATCH');
      expect(result.items[0]?.status_a).toBe('YES');
      expect(result.items[0]?.status_b).toBe('YES');
    });

    it('should return BOUNDARY for YES/NO mismatch', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'NO', interest: 1, comfort: 1 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('BOUNDARY');
    });

    it('should return BOUNDARY for HARD_LIMIT', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'HARD_LIMIT', interest: 0, comfort: 0 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('BOUNDARY');
      expect(result.items[0]?.flags).toContain('hard_limit_violation');
    });

    it('should return EXPLORE for MAYBE', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'MAYBE', interest: 2, comfort: 2, conditions: 'Some conditions' },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
    });

    it('should calculate deltas correctly', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 1, comfort: 2 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.delta_interest).toBe(3);
      expect(result.items[0]?.delta_comfort).toBe(1);
    });

    it('should flag big delta in interest', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 1, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.flags).toContain('big_delta');
    });

    it('should flag low comfort + high interest for person A', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 1 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.flags).toContain('low_comfort_high_interest');
    });

    it('should flag low comfort + high interest for person B', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 2 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.flags).toContain('low_comfort_high_interest');
    });

    it('should flag high risk (level C)', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'C', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.flags).toContain('high_risk');
    });
  });

  describe('consent_rating - dom/sub variant', () => {
    it('should use dom status for comparison', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: {
          dom_status: 'YES',
          dom_interest: 3,
          dom_comfort: 3,
          sub_status: 'NO',
          sub_interest: 1,
          sub_comfort: 1,
        },
      };
      const respB: ResponseMap = {
        q1: {
          dom_status: 'YES',
          dom_interest: 4,
          dom_comfort: 4,
          sub_status: 'YES',
          sub_interest: 2,
          sub_comfort: 2,
        },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.status_a).toBe('YES');
      expect(result.items[0]?.status_b).toBe('YES');
      expect(result.items[0]?.pair_status).toBe('MATCH');
      expect(result.items[0]?.interest_a).toBe(3);
      expect(result.items[0]?.interest_b).toBe(4);
    });
  });

  describe('consent_rating - active/passive variant', () => {
    it('should use active status for comparison', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: {
          active_status: 'YES',
          active_interest: 3,
          active_comfort: 3,
          passive_status: 'NO',
          passive_interest: 1,
          passive_comfort: 1,
        },
      };
      const respB: ResponseMap = {
        q1: {
          active_status: 'YES',
          active_interest: 4,
          active_comfort: 4,
          passive_status: 'YES',
          passive_interest: 2,
          passive_comfort: 2,
        },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.status_a).toBe('YES');
      expect(result.items[0]?.status_b).toBe('YES');
      expect(result.items[0]?.pair_status).toBe('MATCH');
      expect(result.items[0]?.interest_a).toBe(3);
      expect(result.items[0]?.interest_b).toBe(4);
    });
  });

  describe('scale_0_10 schema', () => {
    it('should return MATCH for close values (delta <= 2)', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_0_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { value: 7 },
      };
      const respB: ResponseMap = {
        q1: { value: 8 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('MATCH');
      expect(result.items[0]?.value_a).toBe(7);
      expect(result.items[0]?.value_b).toBe(8);
    });

    it('should return EXPLORE for distant values (delta > 2)', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_0_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { value: 2 },
      };
      const respB: ResponseMap = {
        q1: { value: 8 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
    });

    it('should flag big delta (>= 3)', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_0_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { value: 1 },
      };
      const respB: ResponseMap = {
        q1: { value: 5 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.flags).toContain('big_delta');
    });

    it('should handle missing values', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_0_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { value: 5 },
      };
      const respB: ResponseMap = {
        q1: {},
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
      expect(result.items[0]?.value_a).toBe(5);
      expect(result.items[0]?.value_b).toBeNull();
    });
  });

  describe('enum schema', () => {
    it('should return MATCH for same value', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'enum', risk_level: 'A', tags: [], label: 'Q1', options: ['A', 'B', 'C'] },
      ]);
      const respA: ResponseMap = {
        q1: { value: 'B' },
      };
      const respB: ResponseMap = {
        q1: { value: 'B' },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('MATCH');
      expect(result.items[0]?.value_a).toBe('B');
      expect(result.items[0]?.value_b).toBe('B');
    });

    it('should return EXPLORE for different values', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'enum', risk_level: 'A', tags: [], label: 'Q1', options: ['A', 'B', 'C'] },
      ]);
      const respA: ResponseMap = {
        q1: { value: 'A' },
      };
      const respB: ResponseMap = {
        q1: { value: 'C' },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
    });
  });

  describe('multi schema', () => {
    it('should return MATCH for overlapping values', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'multi', risk_level: 'A', tags: [], label: 'Q1', values: ['A', 'B', 'C'] },
      ]);
      const respA: ResponseMap = {
        q1: { values: ['A', 'B'] },
      };
      const respB: ResponseMap = {
        q1: { values: ['B', 'C'] },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('MATCH');
    });

    it('should return EXPLORE for no overlap', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'multi', risk_level: 'A', tags: [], label: 'Q1', values: ['A', 'B', 'C'] },
      ]);
      const respA: ResponseMap = {
        q1: { values: ['A'] },
      };
      const respB: ResponseMap = {
        q1: { values: ['C'] },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
    });

    it('should handle empty arrays', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'multi', risk_level: 'A', tags: [], label: 'Q1', values: ['A', 'B'] },
      ]);
      const respA: ResponseMap = {
        q1: { values: [] },
      };
      const respB: ResponseMap = {
        q1: { values: ['A'] },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
    });
  });

  describe('text schema', () => {
    it('should always return EXPLORE', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'text', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { text: 'Same text' },
      };
      const respB: ResponseMap = {
        q1: { text: 'Same text' },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
      expect(result.items[0]?.value_a).toBe('Same text');
      expect(result.items[0]?.value_b).toBe('Same text');
    });
  });

  describe('scenario schema', () => {
    it('should return MATCH when both select same scenario', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scenario', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { scenario_id: 'sc1', status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { scenario_id: 'sc1', status: 'YES', interest: 4, comfort: 4 },
      };
      const scenarios = {
        sc1: { status: 'YES' },
      };

      const result = compare(template, respA, respB, scenarios);
      expect(result.items[0]?.pair_status).toBe('MATCH');
    });

    it('should return EXPLORE when different scenarios selected', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scenario', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { scenario_id: 'sc1' },
      };
      const respB: ResponseMap = {
        q1: { scenario_id: 'sc2' },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
    });
  });

  describe('sorting', () => {
    it('should sort BOUNDARY > EXPLORE > MATCH', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Match' },
        { id: 'q2', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Explore' },
        { id: 'q3', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Boundary' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
        q2: { status: 'MAYBE', interest: 2, comfort: 2, conditions: 'Test' },
        q3: { status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
        q2: { status: 'YES', interest: 3, comfort: 3 },
        q3: { status: 'NO', interest: 1, comfort: 1 },
      };

      const result = compare(template, respA, respB);
      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.pair_status).toBe('BOUNDARY');
      expect(result.items[1]?.pair_status).toBe('EXPLORE');
      expect(result.items[2]?.pair_status).toBe('MATCH');
    });

    it('should prioritize high risk within same pair_status', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Low Risk' },
        { id: 'q2', schema: 'consent_rating', risk_level: 'C', tags: [], label: 'High Risk' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
        q2: { status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'NO', interest: 1, comfort: 1 },
        q2: { status: 'NO', interest: 1, comfort: 1 },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.risk_level).toBe('C'); // High risk first
      expect(result.items[1]?.risk_level).toBe('A');
    });
  });

  describe('action plan generation', () => {
    it('should generate action plan from MATCH items with high comfort', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Activity 1' },
        { id: 'q2', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Activity 2' },
        { id: 'q3', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Activity 3' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 4 },
        q2: { status: 'YES', interest: 3, comfort: 3 },
        q3: { status: 'YES', interest: 4, comfort: 4 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 4 },
        q2: { status: 'YES', interest: 3, comfort: 3 },
        q3: { status: 'YES', interest: 3, comfort: 3 },
      };

      const result = compare(template, respA, respB);
      expect(result.action_plan).toHaveLength(3);
      expect(result.action_plan).toContain('Activity 1');
    });

    it('should exclude low comfort items from action plan', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Low Comfort' },
        { id: 'q2', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'High Comfort' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 2 }, // Low comfort A
        q2: { status: 'YES', interest: 4, comfort: 4 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 4 },
        q2: { status: 'YES', interest: 4, comfort: 4 },
      };

      const result = compare(template, respA, respB);
      expect(result.action_plan).not.toContain('Low Comfort');
      expect(result.action_plan).toContain('High Comfort');
    });

    it('should limit action plan to 3 items', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Activity 1' },
        { id: 'q2', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Activity 2' },
        { id: 'q3', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Activity 3' },
        { id: 'q4', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Activity 4' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 4 },
        q2: { status: 'YES', interest: 4, comfort: 4 },
        q3: { status: 'YES', interest: 4, comfort: 4 },
        q4: { status: 'YES', interest: 4, comfort: 4 },
      };
      const respB: ResponseMap = {
        q1: { status: 'YES', interest: 4, comfort: 4 },
        q2: { status: 'YES', interest: 4, comfort: 4 },
        q3: { status: 'YES', interest: 4, comfort: 4 },
        q4: { status: 'YES', interest: 4, comfort: 4 },
      };

      const result = compare(template, respA, respB);
      expect(result.action_plan).toHaveLength(3);
    });

    it('should return empty action plan when no suitable matches', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { status: 'YES', interest: 3, comfort: 3 },
      };
      const respB: ResponseMap = {
        q1: { status: 'NO', interest: 1, comfort: 1 },
      };

      const result = compare(template, respA, respB);
      expect(result.action_plan).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle responses with no matching questions', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'text', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q2: { text: 'Text' },
      };
      const respB: ResponseMap = {
        q3: { text: 'Text' },
      };

      const result = compare(template, respA, respB);
      expect(result.items).toEqual([]);
    });

    it('should handle invalid response data', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'consent_rating', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: 'invalid',
      };
      const respB: ResponseMap = {
        q1: null,
      };

      const result = compare(template, respA, respB);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.pair_status).toBe('EXPLORE');
    });

    it('should handle null/undefined values gracefully', () => {
      const template = createTemplate([
        { id: 'q1', schema: 'scale_0_10', risk_level: 'A', tags: [], label: 'Q1' },
      ]);
      const respA: ResponseMap = {
        q1: { value: null },
      };
      const respB: ResponseMap = {
        q1: { value: undefined },
      };

      const result = compare(template, respA, respB);
      expect(result.items[0]?.value_a).toBeNull();
      expect(result.items[0]?.value_b).toBeNull();
    });
  });
});
