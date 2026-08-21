import { describe, it, expect } from 'vitest';
import RegexValidationRule from "./RegexValidationRule";

describe('RegexValidationRule', () => {
    it('should return true for string that matches the given regex', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]+$");
        const [isValid, errorMessage] = rule.isValid('test');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should return true and empty message for an empty string (defers to `required`)', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]+$");
        const [isValid, errorMessage] = rule.isValid('');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should defer to `required` for null and undefined', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]+$");
        expect(rule.isValid(null as any)).toEqual([true, '']);
        expect(rule.isValid(undefined as any)).toEqual([true, '']);
    });

    it('should test numbers by their string form (model values from JSON)', () => {
        const rule = new RegexValidationRule("^[0-9.]+$");
        expect(rule.isValid(0 as any)[0]).toBe(true);
        expect(rule.isValid(100 as any)[0]).toBe(true);
        expect(rule.isValid(1.5 as any)[0]).toBe(true);
        // Coerced, then genuinely tested — a number can still fail the pattern
        const letters = new RegexValidationRule("^[a-zA-Z]+$");
        expect(letters.isValid(123 as any)[0]).toBe(false);
    });

    it('should treat non-coercible non-string values as invalid', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]+$");
        expect(rule.isValid(true as any)[0]).toBe(false);
        expect(rule.isValid({} as any)[0]).toBe(false);
        expect(rule.isValid([] as any)[0]).toBe(false);
    });

    it('should return false for string that doesn\'t match the given regex', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]$");
        const [isValid, errorMessage] = rule.isValid('test123');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('Field is invalid.');
    });
});
