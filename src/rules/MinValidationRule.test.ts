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
});
