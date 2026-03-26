import { describe, it, expect } from 'vitest';
import NumericMinValidationRule from './NumericMinValidationRule';

describe('NumericMinValidationRule', () => {
  it('should pass when value >= min', () => {
    const rule = new NumericMinValidationRule();
    rule.setParams({ value: 18 });
    expect(rule.isValid(18)[0]).toBe(true);
    expect(rule.isValid(25)[0]).toBe(true);
    expect(rule.isValid(100)[0]).toBe(true);
  });

  it('should fail when value < min', () => {
    const rule = new NumericMinValidationRule();
    rule.setParams({ value: 18 });
    expect(rule.isValid(17)[0]).toBe(false);
    expect(rule.isValid(0)[0]).toBe(false);
    expect(rule.isValid(-5)[0]).toBe(false);
  });

  it('should pass for null/undefined/empty (let required handle presence)', () => {
    const rule = new NumericMinValidationRule();
    rule.setParams({ value: 18 });
    expect(rule.isValid(null as any)[0]).toBe(true);
    expect(rule.isValid(undefined as any)[0]).toBe(true);
    expect(rule.isValid('' as any)[0]).toBe(true);
  });

  it('should handle string numbers', () => {
    const rule = new NumericMinValidationRule();
    rule.setParams({ value: 10 });
    expect(rule.isValid('15' as any)[0]).toBe(true);
    expect(rule.isValid('5' as any)[0]).toBe(false);
  });

  it('should fail for non-numeric strings', () => {
    const rule = new NumericMinValidationRule();
    rule.setParams({ value: 0 });
    expect(rule.isValid('abc' as any)[0]).toBe(false);
  });

  it('should handle decimal values', () => {
    const rule = new NumericMinValidationRule();
    rule.setParams({ value: 0.5 });
    expect(rule.isValid(0.6)[0]).toBe(true);
    expect(rule.isValid(0.4)[0]).toBe(false);
  });

  it('should support custom error messages', () => {
    const rule = new NumericMinValidationRule();
    rule.setParams({ value: 18 });
    rule.setErrorMessage('Must be 18+');
    const [, msg] = rule.isValid(10);
    expect(msg).toBe('Must be 18+');
  });

  it('should match type "numericmin"', () => {
    const rule = new NumericMinValidationRule();
    expect(rule.isMatch('numericmin')).toBe(true);
    expect(rule.isMatch('min')).toBe(false);
  });

  it('should have ruleKey "min"', () => {
    const rule = new NumericMinValidationRule();
    expect(rule.ruleKey).toBe('min');
  });
});
