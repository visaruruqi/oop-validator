import { describe, it, expect } from 'vitest';
import MaxValidationRule from './MaxValidationRule';

describe('MaxValidationRule', () => {
    it('should return true for string shorter than max length', () => {
        const rule = new MaxValidationRule();
        rule.setParams({ length: 10 });
        const [isValid, errorMessage] = rule.isValid('test');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should return false for string longer than max length', () => {
        const rule = new MaxValidationRule();
        rule.setParams({ length: 3 });
        const [isValid, errorMessage] = rule.isValid('test');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('This field must be no more than 3 characters long.');
    });
});

describe('MaxValidationRule - numeric model values', () => {
    it('should measure numbers by their string form', () => {
        const rule = new MaxValidationRule();
        rule.setParams({ length: 7 });
        expect(rule.isValid(0 as any)[0]).toBe(true);          // "0" -> 1 char
        expect(rule.isValid(1234567 as any)[0]).toBe(true);    // 7 chars
        expect(rule.isValid(12345678 as any)[0]).toBe(false);  // 8 chars
    });

    it('should still reject non-coercible non-strings', () => {
        const rule = new MaxValidationRule();
        rule.setParams({ length: 7 });
        expect(rule.isValid(true as any)[0]).toBe(false);
        expect(rule.isValid({} as any)[0]).toBe(false);
    });
});
