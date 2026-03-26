import { describe, it, expect } from 'vitest';
import RequiredValidationRule from './RequiredValidationRule';

describe('RequiredValidationRule', () => {
    it('should return true for non-empty string', () => {
        const rule = new RequiredValidationRule();
        const [isValid, errorMessage] = rule.isValid('test');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should return false for empty string', () => {
        const rule = new RequiredValidationRule();
        const [isValid, errorMessage] = rule.isValid('');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('This field is required.');
    });
});

describe('RequiredValidationRule - non-string types', () => {
  it('should pass for number 0 (valid value)', () => {
    const rule = new RequiredValidationRule();
    const [isValid] = rule.isValid(0 as any);
    expect(isValid).toBe(true);
  });

  it('should pass for positive numbers', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid(42 as any)[0]).toBe(true);
  });

  it('should fail for NaN', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid(NaN as any)[0]).toBe(false);
  });

  it('should pass for boolean true (checked checkbox)', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid(true as any)[0]).toBe(true);
  });

  it('should fail for boolean false (unchecked checkbox)', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid(false as any)[0]).toBe(false);
  });

  it('should fail for empty array', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid([] as any)[0]).toBe(false);
  });

  it('should pass for non-empty array', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid([1, 2] as any)[0]).toBe(true);
  });

  it('should fail for null', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid(null as any)[0]).toBe(false);
  });

  it('should fail for undefined', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid(undefined as any)[0]).toBe(false);
  });

  it('should still fail for empty string', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid('')[0]).toBe(false);
  });

  it('should still fail for whitespace-only string', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid('   ')[0]).toBe(false);
  });

  it('should still pass for non-empty string', () => {
    const rule = new RequiredValidationRule();
    expect(rule.isValid('hello')[0]).toBe(true);
  });
});
