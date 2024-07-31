import { describe, it, expect } from 'vitest';
import EmailValidationRule from './EmailValidationRule';

describe('EmailValidationRule', () => {
    it('should return true for valid email', () => {
        const rule = new EmailValidationRule();
        const [isValid, errorMessage] = rule.isValid('test@example.com');
        expect(isValid).toBe(true);
        expect(errorMessage).toBe('');
    });

    it('should return false for invalid email', () => {
        const rule = new EmailValidationRule();
        const [isValid, errorMessage] = rule.isValid('invalid-email');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('This field must be a valid email address.');
    });
});
