import { describe, it, expect } from 'vitest';
import {
  flattenTemplateQuestions,
  normalizeOptions,
  getQuickRepliesForQuestion,
  getQuestionTitle,
  getScaleValue,
  getEnumValue,
  getMultiValues,
  getTextValue,
  normalizeResponseForSave,
  isMainAnswerValid,
  formatResponseForChat,
  getAnsweredQuestionCount,
  QUICK_REPLIES,
} from '../../../src/lib/questionnaire';
import type { Question, Template } from '../../../src/types';
import type { ResponseValue, ConsentRatingValue } from '../../../src/types/form';

describe('questionnaire utilities', () => {
  describe('flattenTemplateQuestions', () => {
    it('should return empty arrays for null/undefined template', () => {
      expect(flattenTemplateQuestions(null)).toEqual({ allQuestions: [], moduleStartIndices: [] });
      expect(flattenTemplateQuestions(undefined)).toEqual({ allQuestions: [], moduleStartIndices: [] });
    });

    it('should return empty arrays for template without modules', () => {
      const template = { id: 't1', name: 'Test' } as Template;
      expect(flattenTemplateQuestions(template)).toEqual({ allQuestions: [], moduleStartIndices: [] });
    });

    it('should flatten questions from multiple modules', () => {
      const template: Template = {
        id: 't1',
        name: 'Test Template',
        version: '1.0',
        modules: [
          { id: 'm1', name: 'Module 1', questions: [
            { id: 'q1', text: 'Q1', schema: 'text' },
            { id: 'q2', text: 'Q2', schema: 'scale' }
          ]},
          { id: 'm2', name: 'Module 2', questions: [
            { id: 'q3', text: 'Q3', schema: 'enum' }
          ]}
        ]
      };

      const result = flattenTemplateQuestions(template);
      
      expect(result.allQuestions).toHaveLength(3);
      expect(result.moduleStartIndices).toEqual([0, 2]);
      expect(result.allQuestions[0]).toMatchObject({ id: 'q1', moduleId: 'm1', moduleIndex: 0 });
      expect(result.allQuestions[2]).toMatchObject({ id: 'q3', moduleId: 'm2', moduleIndex: 1 });
    });

    it('should handle modules without questions', () => {
      const template: Template = {
        id: 't1',
        name: 'Test',
        version: '1.0',
        modules: [
          { id: 'm1', name: 'Module 1', questions: [] },
          { id: 'm2', name: 'Module 2', questions: [{ id: 'q1', text: 'Q1', schema: 'text' }] }
        ]
      };

      const result = flattenTemplateQuestions(template);
      expect(result.allQuestions).toHaveLength(1);
      expect(result.moduleStartIndices).toEqual([0, 0]);
    });
  });

  describe('normalizeOptions', () => {
    it('should return empty array for empty input', () => {
      expect(normalizeOptions([])).toEqual([]);
    });

    it('should convert string array to value/label objects', () => {
      const result = normalizeOptions(['Option A', 'Option B']);
      expect(result).toEqual([
        { value: 'Option A', label: 'Option A' },
        { value: 'Option B', label: 'Option B' }
      ]);
    });

    it('should pass through existing value/label objects', () => {
      const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' }
      ];
      expect(normalizeOptions(options)).toEqual(options);
    });
  });

  describe('getQuickRepliesForQuestion', () => {
    it('should return hard limits replies for hard_limits tag', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text', tags: ['hard_limits'] };
      expect(getQuickRepliesForQuestion(question)).toBe(QUICK_REPLIES.hardLimits);
    });

    it('should return hard limits replies for label containing "hard limit"', () => {
      const question: Question = { id: 'q1', text: 'Was sind deine Hard Limits?', schema: 'text' };
      expect(getQuickRepliesForQuestion(question)).toBe(QUICK_REPLIES.hardLimits);
    });

    it('should return aftercare replies for aftercare tag', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text', tags: ['aftercare'] };
      expect(getQuickRepliesForQuestion(question)).toBe(QUICK_REPLIES.aftercare);
    });

    it('should return safewords replies for safewords tag', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text', tags: ['safewords'] };
      expect(getQuickRepliesForQuestion(question)).toBe(QUICK_REPLIES.safewords);
    });

    it('should return allergies replies for health-related questions', () => {
      const question: Question = { id: 'q1', text: 'Hast du Allergien?', schema: 'text' };
      expect(getQuickRepliesForQuestion(question)).toBe(QUICK_REPLIES.allergies);
    });

    it('should return default notes replies when no specific match', () => {
      const question: Question = { id: 'q1', text: 'Allgemeine Frage', schema: 'text' };
      expect(getQuickRepliesForQuestion(question)).toBe(QUICK_REPLIES.notes);
    });
  });

  describe('getQuestionTitle', () => {
    it('should return text if available', () => {
      const question: Question = { id: 'q1', text: 'Question Text', label: 'Label', schema: 'text' };
      expect(getQuestionTitle(question)).toBe('Question Text');
    });

    it('should fall back to label if no text', () => {
      const question = { id: 'q1', label: 'Label', schema: 'text' } as Question;
      expect(getQuestionTitle(question)).toBe('Label');
    });

    it('should return "Frage" for undefined question', () => {
      expect(getQuestionTitle(undefined)).toBe('Frage');
    });
  });

  describe('getScaleValue', () => {
    it('should return null for null/undefined', () => {
      expect(getScaleValue(null)).toBeNull();
      expect(getScaleValue(undefined as unknown as ResponseValue)).toBeNull();
    });

    it('should extract value from object with value property', () => {
      expect(getScaleValue({ value: 5 })).toBe(5);
      expect(getScaleValue({ value: null })).toBeNull();
    });

    it('should handle direct number input', () => {
      expect(getScaleValue(7 as unknown as ResponseValue)).toBe(7);
    });
  });

  describe('getEnumValue', () => {
    it('should return null for null/undefined', () => {
      expect(getEnumValue(null)).toBeNull();
      expect(getEnumValue(undefined as unknown as ResponseValue)).toBeNull();
    });

    it('should extract value from object', () => {
      expect(getEnumValue({ value: 'option_a' })).toBe('option_a');
    });

    it('should handle direct string input', () => {
      expect(getEnumValue('direct_value' as unknown as ResponseValue)).toBe('direct_value');
    });
  });

  describe('getMultiValues', () => {
    it('should return empty array for null/undefined', () => {
      expect(getMultiValues(null)).toEqual([]);
      expect(getMultiValues(undefined as unknown as ResponseValue)).toEqual([]);
    });

    it('should extract values from object', () => {
      expect(getMultiValues({ values: ['a', 'b', 'c'] })).toEqual(['a', 'b', 'c']);
    });

    it('should handle direct array input', () => {
      expect(getMultiValues(['x', 'y'] as unknown as ResponseValue)).toEqual(['x', 'y']);
    });
  });

  describe('getTextValue', () => {
    it('should return empty string for null/undefined', () => {
      expect(getTextValue(null)).toBe('');
      expect(getTextValue(undefined as unknown as ResponseValue)).toBe('');
    });

    it('should extract text from object', () => {
      expect(getTextValue({ text: 'Hello World' })).toBe('Hello World');
    });

    it('should handle direct string input', () => {
      expect(getTextValue('Direct text' as unknown as ResponseValue)).toBe('Direct text');
    });
  });

  describe('normalizeResponseForSave', () => {
    it('should return null for null/undefined response', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'scale' };
      expect(normalizeResponseForSave(question, null)).toBeNull();
      expect(normalizeResponseForSave(question, undefined as any)).toBeUndefined();
    });

    it('should wrap number in object for scale questions', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'scale_1_10' };
      expect(normalizeResponseForSave(question, 7)).toEqual({ value: 7 });
    });

    it('should wrap string in object for enum questions', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'enum' };
      expect(normalizeResponseForSave(question, 'option_a')).toEqual({ value: 'option_a' });
    });

    it('should wrap array in object for multi questions', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'multi' };
      expect(normalizeResponseForSave(question, ['a', 'b'])).toEqual({ values: ['a', 'b'] });
    });

    it('should wrap string in object for text questions', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text' };
      expect(normalizeResponseForSave(question, 'My answer')).toEqual({ text: 'My answer' });
    });

    it('should pass through already-normalized responses', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'scale' };
      const normalized = { value: 5 };
      expect(normalizeResponseForSave(question, normalized)).toBe(normalized);
    });
  });

  describe('isMainAnswerValid', () => {
    it('should return false for null/undefined response', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text' };
      expect(isMainAnswerValid(question, null)).toBe(false);
      expect(isMainAnswerValid(question, undefined as unknown as ResponseValue)).toBe(false);
    });

    it('should validate scale responses', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'scale_1_10' };
      expect(isMainAnswerValid(question, { value: 5 })).toBe(true);
      expect(isMainAnswerValid(question, { value: null })).toBe(false);
    });

    it('should validate enum responses', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'enum' };
      expect(isMainAnswerValid(question, { value: 'option_a' })).toBe(true);
      expect(isMainAnswerValid(question, { value: '' })).toBe(false);
      expect(isMainAnswerValid(question, { value: null })).toBe(false);
    });

    it('should validate multi responses', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'multi' };
      expect(isMainAnswerValid(question, { values: ['a', 'b'] })).toBe(true);
      expect(isMainAnswerValid(question, { values: [] })).toBe(false);
    });

    it('should validate text responses', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text' };
      expect(isMainAnswerValid(question, { text: 'Some answer' })).toBe(true);
      expect(isMainAnswerValid(question, { text: '   ' })).toBe(false);
      expect(isMainAnswerValid(question, { text: '' })).toBe(false);
    });

    it('should validate consent_rating responses', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'consent_rating' };
      const validConsent: ConsentRatingValue = { status: 'YES', interest: 4 };
      const invalidConsent: ConsentRatingValue = { status: 'YES' };
      
      expect(isMainAnswerValid(question, validConsent)).toBe(true);
      expect(isMainAnswerValid(question, invalidConsent)).toBe(false);
    });

    it('should validate dom/sub consent_rating', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'consent_rating', has_dom_sub: true };
      const valid: ConsentRatingValue = { 
        dom_status: 'YES', dom_interest: 4,
        sub_status: 'MAYBE', sub_interest: 3
      };
      const invalid: ConsentRatingValue = { dom_status: 'YES' };
      
      expect(isMainAnswerValid(question, valid)).toBe(true);
      expect(isMainAnswerValid(question, invalid)).toBe(false);
    });
  });

  describe('formatResponseForChat', () => {
    it('should return "Keine Antwort" for null/undefined', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text' };
      expect(formatResponseForChat(question, null)).toBe('Keine Antwort');
    });

    it('should format scale response', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'scale_1_10' };
      expect(formatResponseForChat(question, { value: 7 })).toBe('7/10');
    });

    it('should format scale with custom max', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'scale', max: 3 };
      expect(formatResponseForChat(question, { value: 2 })).toBe('2/3');
    });

    it('should format enum response with label', () => {
      const question: Question = { 
        id: 'q1', 
        text: 'Test', 
        schema: 'enum',
        options: [{ value: 'opt_a', label: 'Option A' }]
      };
      expect(formatResponseForChat(question, { value: 'opt_a' })).toBe('Option A');
    });

    it('should format multi response', () => {
      const question: Question = { 
        id: 'q1', 
        text: 'Test', 
        schema: 'multi',
        options: [
          { value: 'a', label: 'Choice A' },
          { value: 'b', label: 'Choice B' }
        ]
      };
      expect(formatResponseForChat(question, { values: ['a', 'b'] })).toBe('Choice A, Choice B');
    });

    it('should format text response', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'text' };
      expect(formatResponseForChat(question, { text: 'My detailed answer' })).toBe('My detailed answer');
    });

    it('should format consent_rating response', () => {
      const question: Question = { id: 'q1', text: 'Test', schema: 'consent_rating' };
      const consent: ConsentRatingValue = { status: 'YES', interest: 4, comfort: 5 };
      expect(formatResponseForChat(question, consent)).toBe('Ja, Interesse 4/5, Komfort 5/5');
    });
  });

  describe('getAnsweredQuestionCount', () => {
    it('should return 0 for null template or responses', () => {
      expect(getAnsweredQuestionCount(null, {})).toBe(0);
      expect(getAnsweredQuestionCount({ id: 't', name: 'T', version: '1', modules: [] }, null)).toBe(0);
    });

    it('should count valid answers', () => {
      const template: Template = {
        id: 't1',
        name: 'Test',
        version: '1.0',
        modules: [{
          id: 'm1',
          name: 'Module 1',
          questions: [
            { id: 'q1', text: 'Q1', schema: 'text' },
            { id: 'q2', text: 'Q2', schema: 'scale' },
            { id: 'q3', text: 'Q3', schema: 'enum' }
          ]
        }]
      };

      const responses = {
        q1: { text: 'Answer' },
        q2: { value: 5 },
        q3: null // Not answered
      };

      expect(getAnsweredQuestionCount(template, responses)).toBe(2);
    });
  });
});
