import { describe, it, expect } from 'vitest';
import NumericMaxValidationRule from './NumericMaxValidationRule';

describe('NumericMaxValidationRule', () => {
  it('should pass when value <= max', () => {
    const rule = new NumericMaxValidationRule();
    rule.setParams({ value: 120 });
    expect(rule.isValid(100)[0]).toBe(true);
    expect(rule.isValid(120)[0]).toBe(true);
    expect(rule.isValid(0)[0]).toBe(true);
  });

  it('should fail when value > max', () => {
    const rule = new NumericMaxValidationRule();
    rule.setParams({ value: 120 });
    expect(rule.isValid(121)[0]).toBe(false);
    expect(rule.isValid(999)[0]).toBe(false);
  });

  it('should pass for null/undefined/empty', () => {
    const rule = new NumericMaxValidationRule();
    rule.setParams({ value: 100 });
    expect(rule.isValid(null as any)[0]).toBe(true);
    expect(rule.isValid(undefined as any)[0]).toBe(true);
    expect(rule.isValid('' as any)[0]).toBe(true);
  });

  it('should handle string numbers', () => {
    const rule = new NumericMaxValidationRule();
    rule.setParams({ value: 100 });
    expect(rule.isValid('50' as any)[0]).toBe(true);
    expect(rule.isValid('200' as any)[0]).toBe(false);
  });

  it('should fail for non-numeric strings', () => {
    const rule = new NumericMaxValidationRule();
    rule.setParams({ value: 100 });
    expect(rule.isValid('abc' as any)[0]).toBe(false);
  });

  it('should handle decimal values', () => {
    const rule = new NumericMaxValidationRule();
    rule.setParams({ value: 1.5 });
    expect(rule.isValid(1.4)[0]).toBe(true);
    expect(rule.isValid(1.6)[0]).toBe(false);
  });

  it('should support custom error messages', () => {
    const rule = new NumericMaxValidationRule();
    rule.setParams({ value: 100 });
    rule.setErrorMessage('Max 100');
    const [, msg] = rule.isValid(200);
    expect(msg).toBe('Max 100');
  });

  it('should match type "numericmax"', () => {
    const rule = new NumericMaxValidationRule();
    expect(rule.isMatch('numericmax')).toBe(true);
    expect(rule.isMatch('max')).toBe(false);
  });

  it('should have ruleKey "max"', () => {
    const rule = new NumericMaxValidationRule();
    expect(rule.ruleKey).toBe('max');
  });
});
