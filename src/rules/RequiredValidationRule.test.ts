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
