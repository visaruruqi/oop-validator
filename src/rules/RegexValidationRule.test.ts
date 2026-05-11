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

    it('should treat non-string values as invalid', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]+$");
        expect(rule.isValid(123 as any)[0]).toBe(false);
        expect(rule.isValid(true as any)[0]).toBe(false);
        expect(rule.isValid({} as any)[0]).toBe(false);
    });

    it('should return false for string that doesn\'t match the given regex', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]$");
        const [isValid, errorMessage] = rule.isValid('test123');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('Field is invalid.');
    });
});
