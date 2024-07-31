import { describe, it, expect } from 'vitest';
import DomainValidationRule from './DomainValidationRule';

describe('DomainValidationRule', () => {
    it('should return true for valid domain', () => {
        const rule = new DomainValidationRule();
        const [isValid, errorMessage] = rule.isValid('example.com');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should return false for invalid domain', () => {
        const rule = new DomainValidationRule();
        const [isValid, errorMessage] = rule.isValid('invalid-domain');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('This field must be a valid domain.');
    });
});
