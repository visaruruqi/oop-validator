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
