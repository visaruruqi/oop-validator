import { describe, it, expect } from 'vitest';
import DomainValidationRule from './DomainValidationRule';

describe('DomainValidationRule', () => {
    it('should return true for valid domains', () => {
        const rule = new DomainValidationRule();
        expect(rule.isValid('example.com')[0]).toBe(true);
        expect(rule.isValid('sub.example.com')[0]).toBe(true);
        expect(rule.isValid('my-site.co.uk')[0]).toBe(true);
        expect(rule.isValid('xn--nxasmq6b.com')[0]).toBe(true);
    });

    it('should return false for invalid domains', () => {
        const rule = new DomainValidationRule();
        expect(rule.isValid('invalid-domain')[0]).toBe(false);
        expect(rule.isValid('...')[0]).toBe(false);
        expect(rule.isValid('hello world.')[0]).toBe(false);
        expect(rule.isValid('not a domain but has a dot.')[0]).toBe(false);
        expect(rule.isValid('-bad.com')[0]).toBe(false);
        expect(rule.isValid('bad-.com')[0]).toBe(false);
        const [isValid, errorMessage] = rule.isValid('nodot');
        expect(isValid).toBe(false);
        expect(errorMessage).toBe('This field must be a valid domain.');
    });

    it('should return true for null, undefined, or empty string', () => {
        const rule = new DomainValidationRule();
        expect(rule.isValid(null as any)[0]).toBe(true);
        expect(rule.isValid(undefined as any)[0]).toBe(true);
        expect(rule.isValid('')[0]).toBe(true);
    });
});
