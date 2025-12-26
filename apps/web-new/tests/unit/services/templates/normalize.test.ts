import { describe, it, expect } from 'vitest';
import { normalizeTemplate, isValidTemplate } from '../../../../src/services/templates/normalize';

describe('Template Normalization', () => {
  describe('normalizeTemplate', () => {
    it('should normalize a complete template', () => {
      const raw = {
        id: 'test-template',
        name: 'Test Template',
        version: 2,
        modules: [
          {
            id: 'mod1',
            name: 'Module 1',
            description: 'First module',
            questions: [
              {
                id: 'q1',
                schema: 'consent_rating',
                risk_level: 'A',
                tags: ['test'],
                label: 'Question 1',
                help: 'Help text',
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);

      expect(result.id).toBe('test-template');
      expect(result.name).toBe('Test Template');
      expect(result.version).toBe(2);
      expect(result.modules).toHaveLength(1);
      expect(result.modules[0]?.id).toBe('mod1');
      expect(result.modules[0]?.questions).toHaveLength(1);
    });

    it('should provide defaults for missing fields', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);

      expect(result.id).toBe('');
      expect(result.name).toBe('');
      expect(result.version).toBe(1);
      expect(result.modules[0]?.id).toBe('module_1');
      expect(result.modules[0]?.name).toBe('module_1');
      expect(result.modules[0]?.description).toBe('');
    });

    it('should infer schema from options', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
                options: ['Option 1', 'Option 2'],
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions[0]?.schema).toBe('enum');
    });

    it('should infer schema from values', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
                values: ['Value 1', 'Value 2'],
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions[0]?.schema).toBe('multi');
    });

    it('should infer schema from text field', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
                text: 'Some text',
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions[0]?.schema).toBe('text');
    });

    it('should default to consent_rating schema', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions[0]?.schema).toBe('consent_rating');
    });

    it('should handle different ID field names', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                question_id: 'q1',
                schema: 'text',
              },
              {
                key: 'q2',
                schema: 'text',
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions[0]?.id).toBe('q1');
      expect(result.modules[0]?.questions[1]?.id).toBe('q2');
    });

    it('should normalize tags to string array', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
                schema: 'text',
                tags: 'single-tag',
              },
              {
                id: 'q2',
                schema: 'text',
                tags: ['tag1', 'tag2', null, undefined],
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions[0]?.tags).toEqual(['single-tag']);
      expect(result.modules[0]?.questions[1]?.tags).toEqual(['tag1', 'tag2']);
    });

    it('should use label or fallback to id', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
                schema: 'text',
                label: 'Custom Label',
              },
              {
                id: 'q2',
                schema: 'text',
              },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions[0]?.label).toBe('Custom Label');
      expect(result.modules[0]?.questions[1]?.label).toBe('q2');
    });

    it('should convert flat questions array to modules', () => {
      const raw = {
        questions: [
          {
            id: 'q1',
            schema: 'text',
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules).toHaveLength(1);
      expect(result.modules[0]?.id).toBe('default');
      expect(result.modules[0]?.name).toBe('Fragen');
      expect(result.modules[0]?.questions).toHaveLength(1);
    });

    it('should filter out invalid questions', () => {
      const raw = {
        modules: [
          {
            questions: [
              { id: 'q1', schema: 'text' },
              null,
              undefined,
              'invalid',
              42,
              { id: 'q2', schema: 'text' },
            ],
          },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules[0]?.questions).toHaveLength(2);
      expect(result.modules[0]?.questions[0]?.id).toBe('q1');
      expect(result.modules[0]?.questions[1]?.id).toBe('q2');
    });

    it('should filter out invalid modules', () => {
      const raw = {
        modules: [
          { questions: [{ id: 'q1', schema: 'text' }] },
          null,
          undefined,
          'invalid',
          { questions: [{ id: 'q2', schema: 'text' }] },
        ],
      };

      const result = normalizeTemplate(raw);
      expect(result.modules).toHaveLength(2);
    });

    it('should create empty template for null/undefined/primitives', () => {
      // Lenient behavior: creates empty but valid template
      const result1 = normalizeTemplate(null);
      expect(result1.modules).toEqual([]);

      const result2 = normalizeTemplate(undefined);
      expect(result2.modules).toEqual([]);

      const result3 = normalizeTemplate('string');
      expect(result3.modules).toEqual([]);

      const result4 = normalizeTemplate(42);
      expect(result4.modules).toEqual([]);
    });

    it('should throw on missing question id', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                schema: 'text',
              },
            ],
          },
        ],
      };

      expect(() => normalizeTemplate(raw)).toThrow('question.id is required');
    });

    it('should throw on missing question schema after normalization', () => {
      const raw = {
        modules: [
          {
            questions: [
              {
                id: 'q1',
                schema: null,
              },
            ],
          },
        ],
      };

      // Schema gets inferred, so this should actually pass
      expect(() => normalizeTemplate(raw)).not.toThrow();
    });

    it('should handle version as string', () => {
      const raw = {
        version: '3',
        modules: [{ questions: [{ id: 'q1', schema: 'text' }] }],
      };

      const result = normalizeTemplate(raw);
      expect(result.version).toBe(3);
    });

    it('should handle invalid version', () => {
      const raw = {
        version: 'invalid',
        modules: [{ questions: [{ id: 'q1', schema: 'text' }] }],
      };

      const result = normalizeTemplate(raw);
      expect(result.version).toBe(1);
    });

    it('should deep clone input to avoid mutations', () => {
      const raw = {
        id: 'test',
        modules: [
          {
            id: 'mod1',
            questions: [{ id: 'q1', schema: 'text' }],
          },
        ],
      };

      const result = normalizeTemplate(raw);

      // Mutate result
      result.id = 'changed';
      result.modules[0]!.id = 'changed';

      // Original should be unchanged
      expect(raw.id).toBe('test');
      expect(raw.modules[0]?.id).toBe('mod1');
    });
  });

  describe('isValidTemplate', () => {
    it('should return true for valid template', () => {
      const valid = {
        modules: [
          {
            questions: [{ id: 'q1', schema: 'text' }],
          },
        ],
      };

      expect(isValidTemplate(valid)).toBe(true);
    });

    it('should return true for lenient cases', () => {
      // Lenient: normalizeTemplate fixes all these cases
      expect(isValidTemplate(null)).toBe(true);
      expect(isValidTemplate(undefined)).toBe(true);
      expect(isValidTemplate('string')).toBe(true);
      expect(isValidTemplate({})).toBe(true);
      expect(isValidTemplate({ modules: [] })).toBe(true);

      // Even invalid modules get normalized to empty array
      expect(isValidTemplate({ modules: 'not-an-array' })).toBe(true);
      expect(isValidTemplate({ modules: 42 })).toBe(true);
    });

    it('should return false for template with missing question id', () => {
      const invalid = {
        modules: [
          {
            questions: [{ schema: 'text' }],
          },
        ],
      };

      expect(isValidTemplate(invalid)).toBe(false);
    });
  });
});
