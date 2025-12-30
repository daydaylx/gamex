import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeForDisplay,
  validateSessionName,
  validateApiKey,
  validateTextInput,
  validateNumber,
  validateEmail,
  validateJSON,
  validateUUID,
  sanitizeObject,
} from '../../../src/services/validation';

describe('sanitizeString', () => {
  it('should return empty string for non-string input', () => {
    expect(sanitizeString('')).toBe('');
    expect(sanitizeString(null as any)).toBe('');
    expect(sanitizeString(undefined as any)).toBe('');
  });

  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeString(input)).toBe('Hello  World');
  });

  it('should remove HTML tags', () => {
    const input = '<div>Hello</div> <span>World</span>';
    expect(sanitizeString(input)).toBe('Hello World');
  });

  it('should escape HTML entities', () => {
    const input = 'Test & "quoted" text';
    const result = sanitizeString(input);
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toContain('hello');
  });
});

describe('sanitizeForDisplay', () => {
  it('should return empty string for non-string input', () => {
    expect(sanitizeForDisplay('')).toBe('');
    expect(sanitizeForDisplay(null as any)).toBe('');
  });

  it('should remove script tags', () => {
    const input = 'Text <script>malicious()</script> more';
    expect(sanitizeForDisplay(input)).toBe('Text  more');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click</div>';
    expect(sanitizeForDisplay(input)).not.toContain('onclick');
  });

  it('should remove javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    expect(sanitizeForDisplay(input)).not.toContain('javascript:');
  });
});

describe('validateSessionName', () => {
  it('should reject empty names', () => {
    expect(validateSessionName('')).toEqual({ valid: false, error: 'Name ist erforderlich' });
    expect(validateSessionName('   ')).toEqual({ valid: false, error: 'Name ist erforderlich' });
  });

  it('should reject names over 100 characters', () => {
    const longName = 'a'.repeat(101);
    expect(validateSessionName(longName).valid).toBe(false);
    expect(validateSessionName(longName).error).toContain('100 Zeichen');
  });

  it('should reject names with script tags', () => {
    expect(validateSessionName('<script>alert(1)</script>').valid).toBe(false);
  });

  it('should accept valid names', () => {
    expect(validateSessionName('My Session')).toEqual({ valid: true });
    expect(validateSessionName('Session 2024-12-30')).toEqual({ valid: true });
  });
});

describe('validateApiKey', () => {
  it('should reject empty keys', () => {
    expect(validateApiKey('')).toEqual({ valid: false, error: 'API-Key ist erforderlich' });
  });

  it('should reject keys that are too short', () => {
    expect(validateApiKey('short').valid).toBe(false);
    expect(validateApiKey('short').error).toContain('zu kurz');
  });

  it('should reject keys not starting with sk-or-', () => {
    expect(validateApiKey('sk-openai-1234567890').valid).toBe(false);
    expect(validateApiKey('sk-openai-1234567890').error).toContain('sk-or-');
  });

  it('should accept valid OpenRouter keys', () => {
    expect(validateApiKey('sk-or-v1-abcdef1234567890')).toEqual({ valid: true });
  });
});

describe('validateTextInput', () => {
  it('should handle empty input based on required flag', () => {
    expect(validateTextInput('', { required: false })).toEqual({ valid: true, sanitized: '' });
    expect(validateTextInput('', { required: true }).valid).toBe(false);
  });

  it('should sanitize the input', () => {
    const result = validateTextInput('<script>bad</script>text');
    expect(result.sanitized).not.toContain('<script>');
    expect(result.sanitized).toContain('text');
  });

  it('should reject text exceeding maxLength', () => {
    const result = validateTextInput('a'.repeat(100), { maxLength: 50 });
    expect(result.valid).toBe(false);
    expect(result.sanitized.length).toBe(50);
  });

  it('should accept valid text', () => {
    const result = validateTextInput('Valid text input', { maxLength: 100 });
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Valid text input');
  });
});

describe('validateNumber', () => {
  it('should handle null/undefined based on required flag', () => {
    expect(validateNumber(null, { required: false })).toEqual({ valid: true, value: null });
    expect(validateNumber(null, { required: true }).valid).toBe(false);
  });

  it('should reject non-numeric values', () => {
    expect(validateNumber('abc').valid).toBe(false);
    expect(validateNumber('abc').error).toContain('Ungültige Zahl');
  });

  it('should validate min constraint', () => {
    expect(validateNumber(5, { min: 10 }).valid).toBe(false);
    expect(validateNumber(15, { min: 10 }).valid).toBe(true);
  });

  it('should validate max constraint', () => {
    expect(validateNumber(15, { max: 10 }).valid).toBe(false);
    expect(validateNumber(5, { max: 10 }).valid).toBe(true);
  });

  it('should validate min and max together', () => {
    expect(validateNumber(5, { min: 1, max: 10 })).toEqual({ valid: true, value: 5 });
    expect(validateNumber(0, { min: 1, max: 10 }).valid).toBe(false);
  });

  it('should parse string numbers', () => {
    expect(validateNumber('42')).toEqual({ valid: true, value: 42 });
  });
});

describe('validateEmail', () => {
  it('should reject empty email', () => {
    expect(validateEmail('')).toEqual({ valid: false, error: 'E-Mail ist erforderlich' });
  });

  it('should reject invalid email formats', () => {
    expect(validateEmail('invalid').valid).toBe(false);
    expect(validateEmail('missing@domain').valid).toBe(false);
    expect(validateEmail('@nodomain.com').valid).toBe(false);
  });

  it('should accept valid emails', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
    expect(validateEmail('user.name@sub.domain.com')).toEqual({ valid: true });
  });
});

describe('validateJSON', () => {
  it('should reject empty input', () => {
    expect(validateJSON('').valid).toBe(false);
    expect(validateJSON(null as any).valid).toBe(false);
  });

  it('should reject invalid JSON', () => {
    expect(validateJSON('{invalid}').valid).toBe(false);
    expect(validateJSON('{"key": value}').valid).toBe(false);
  });

  it('should parse valid JSON', () => {
    const result = validateJSON('{"key": "value", "num": 123}');
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({ key: 'value', num: 123 });
  });

  it('should handle arrays', () => {
    const result = validateJSON('[1, 2, 3]');
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual([1, 2, 3]);
  });
});

describe('validateUUID', () => {
  it('should reject empty/invalid input', () => {
    expect(validateUUID('')).toBe(false);
    expect(validateUUID(null as any)).toBe(false);
    expect(validateUUID('not-a-uuid')).toBe(false);
  });

  it('should accept valid UUIDs', () => {
    expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(validateUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
  });
});

describe('sanitizeObject', () => {
  it('should return input for non-objects', () => {
    expect(sanitizeObject(null as any)).toBeNull();
    expect(sanitizeObject('string' as any)).toBe('string');
  });

  it('should sanitize string values', () => {
    const input = { name: '<script>bad</script>Test' };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain('<script>');
    expect(result.name).toContain('Test');
  });

  it('should sanitize nested objects', () => {
    const input = {
      level1: {
        level2: {
          value: '<script>xss</script>clean'
        }
      }
    };
    const result = sanitizeObject(input);
    expect((result.level1 as any).level2.value).not.toContain('<script>');
  });

  it('should sanitize arrays', () => {
    const input = {
      items: ['<script>1</script>one', 'two']
    };
    const result = sanitizeObject(input);
    expect(result.items[0]).not.toContain('<script>');
  });

  it('should preserve non-string values', () => {
    const input = {
      number: 42,
      boolean: true,
      nullValue: null
    };
    const result = sanitizeObject(input);
    expect(result.number).toBe(42);
    expect(result.boolean).toBe(true);
    expect(result.nullValue).toBeNull();
  });
});
