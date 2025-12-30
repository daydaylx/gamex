import { describe, it, expect } from 'vitest';
import { cn } from '../../../src/lib/utils';

describe('cn (className utility)', () => {
  it('should merge multiple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should filter out falsy values', () => {
    expect(cn('class1', undefined, 'class2', null, false, 'class3')).toBe('class1 class2 class3');
  });

  it('should return empty string for all falsy values', () => {
    expect(cn(undefined, null, false)).toBe('');
  });

  it('should handle single class', () => {
    expect(cn('single-class')).toBe('single-class');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled'
    )).toBe('base-class active');
  });
});
