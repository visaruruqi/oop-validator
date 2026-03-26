import { describe, it, expect } from 'vitest';
import NumberValidationRule from './NumberValidationRule';

describe('NumberValidationRule', () => {
  it('should pass for valid integers', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid(42)[0]).toBe(true);
    expect(rule.isValid(-5)[0]).toBe(true);
  });

  it('should pass for valid floats', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid(3.14)[0]).toBe(true);
    expect(rule.isValid(-0.5)[0]).toBe(true);
  });

  it('should pass for zero', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid(0)[0]).toBe(true);
  });

  it('should pass for negative numbers', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid(-100)[0]).toBe(true);
  });

  it('should fail for NaN', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid(NaN)[0]).toBe(false);
  });

  it('should fail for non-numeric strings', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid('abc' as any)[0]).toBe(false);
  });

  it('should pass for numeric strings like "123"', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid('123' as any)[0]).toBe(true);
  });

  it('should pass for empty/null (let required handle)', () => {
    const rule = new NumberValidationRule();
    expect(rule.isValid('' as any)[0]).toBe(true);
    expect(rule.isValid(null as any)[0]).toBe(true);
    expect(rule.isValid(undefined as any)[0]).toBe(true);
  });

  it('should match type "number"', () => {
    const rule = new NumberValidationRule();
    expect(rule.isMatch('number')).toBe(true);
    expect(rule.isMatch('numericmin')).toBe(false);
  });

  it('should have ruleKey "number"', () => {
    const rule = new NumberValidationRule();
    expect(rule.ruleKey).toBe('number');
  });

  it('should support custom error messages', () => {
    const rule = new NumberValidationRule();
    rule.setErrorMessage('Must be a number');
    const [, msg] = rule.isValid('abc' as any);
    expect(msg).toBe('Must be a number');
  });
});
