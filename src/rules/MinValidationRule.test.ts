import { describe, it, expect } from 'vitest';
import MinValidationRule from './MinValidationRule';

describe('MinValidationRule', () => {
    it('should return true for string longer than min length', () => {
        const rule = new MinValidationRule();
        rule.setParams({ length: 3 });
        const [isValid, errorMessage] = rule.isValid('test');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should return false for string shorter than min length', () => {
        const rule = new MinValidationRule();
        rule.setParams({ length: 5 });
        const [isValid, errorMessage] = rule.isValid('test');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('This field must be at least 5 characters long.');
    });

    it('should pass an empty string so an optional field cleared by the user is valid', () => {
        const rule = new MinValidationRule();
        rule.setParams({ length: 2 });
        const [isValid, errorMessage] = rule.isValid('');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should still fail whitespace shorter than min length', () => {
        const rule = new MinValidationRule();
        rule.setParams({ length: 2 });
        expect(rule.isValid(' ')[0]).toBe(false);
    });
});

describe('MinValidationRule - numeric model values', () => {
    it('should measure numbers by their string form', () => {
        const rule = new MinValidationRule();
        rule.setParams({ length: 2 });
        expect(rule.isValid(42 as any)[0]).toBe(true);   // "42" -> 2 chars
        expect(rule.isValid(7 as any)[0]).toBe(false);   // "7" -> 1 char
    });

    it('should still reject non-coercible non-strings', () => {
        const rule = new MinValidationRule();
        rule.setParams({ length: 2 });
        expect(rule.isValid(true as any)[0]).toBe(false);
        expect(rule.isValid({} as any)[0]).toBe(false);
    });
});
