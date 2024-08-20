import { describe, it, expect } from 'vitest';
import RegexValidationRule from "./RegexValidationRule.ts";

describe('MinValidationRule', () => {
    it('should return true for string that matches the given regex', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]+$");
        const [isValid, errorMessage] = rule.isValid('test');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should return false for string that doesn\'t match the given regex', () => {
        const rule = new RegexValidationRule("^[a-zA-Z]$");
        const [isValid, errorMessage] = rule.isValid('test123');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('Field is invalid.');
    });
});
