import { describe, it, expect } from 'vitest';
import ValidationEngine from './ValidationEngine';
import RequiredValidationRule from './RequiredValidationRule';
import IValidationRule from "./IValidationRule";

describe('ValidationEngine', () => {
    it('should validate a single value correctly', () => {
        const rules = [
            'required',
            { rule: 'max', params: { length: 15 }, message: "Maximum length is 15 characters." },
            { rule: 'min', params: { length: 3 }, message: "Minimum length is 3 characters." },
            'email'
        ];

        const validationEngine = new ValidationEngine(rules);

        let value = 'Jo';
        let [isValid,error] = validationEngine.isValid(value,'min');

        expect(isValid).toBe(false);
        expect(error).toEqual('Minimum length is 3 characters.');

        value = 'invalid-email';
        let [isEmailValid,emailError] = validationEngine.isValid(value,'email');

        expect(isEmailValid).toBe(false);
        expect(emailError).toEqual('This field must be a valid email address.');
    });

    it('should return no errors for a valid value', () => {
        const rules = [
            'required',
            { rule: 'max', params: { length: 20 }, message: "Maximum length is 15 characters." },
            { rule: 'min', params: { length: 3 }, message: "Minimum length is 3 characters." },
            'email'
        ];

        const validationEngine = new ValidationEngine(rules);

        const value = 'john.doe@example.com';
        const result = validationEngine.validateValue(value);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('should validate a value with a custom rule', () => {
        class CustomRule extends IValidationRule {
            private errorMessage: string = "This field must be 'custom'.";

            isValid(param: string): [boolean, string] {
                const isValid = param === 'custom';
                return [isValid, isValid ? "" : this.errorMessage];
            }

            isMatch(type: string): boolean {
                return type.toLowerCase() === 'custom';
            }

            // @ts-ignore
            setParams(params: any): void {
                // Custom parameters if needed
            }

            setErrorMessage(message: string): void {
                this.errorMessage = message;
            }
        }

        const validationEngine = new ValidationEngine();
        validationEngine.addRule(new CustomRule());

        const value = 'not-custom';
        const result = validationEngine.validateValue(value);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(["This field must be 'custom'."]);
    });

    it('should validate a value with dynamically added rule', () => {
        const validationEngine = new ValidationEngine();
        validationEngine.addRule(new RequiredValidationRule());

        const value = '';
        const result = validationEngine.validateValue(value);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(['This field is required.']);
    });

    it('should create regex rule from configuration', () => {
        const rules = [
            { rule: 'regex', params: { regex: '^[a-z]+$' }, message: 'Only letters allowed.' }
        ];

        const validationEngine = new ValidationEngine(rules);

        const result = validationEngine.validateValue('abc123');

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(['Only letters allowed.']);
    });
});

describe('ValidationEngine - Stateful API', () => {
    it('should store validation errors and state after validateValue', () => {
        const validationEngine = new ValidationEngine(['required', 'email']);
        
        // Validate invalid value
        const result = validationEngine.validateValue('invalid-email');
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        // Check stateful methods
        expect(validationEngine.getIsValid()).toBe(false);
        expect(validationEngine.getErrors()).toEqual(result.errors);
    });
    
    it('should update state on subsequent validations', () => {
        const validationEngine = new ValidationEngine(['required', 'email']);
        
        // First validation - invalid
        validationEngine.validateValue('invalid');
        expect(validationEngine.getIsValid()).toBe(false);
        expect(validationEngine.getErrors().length).toBeGreaterThan(0);
        
        // Second validation - valid
        validationEngine.validateValue('valid@example.com');
        expect(validationEngine.getIsValid()).toBe(true);
        expect(validationEngine.getErrors()).toEqual([]);
    });
    
    it('should reset validation state', () => {
        const validationEngine = new ValidationEngine(['required', 'email']);
        
        // Validate with errors
        validationEngine.validateValue('invalid-email');
        expect(validationEngine.getIsValid()).toBe(false);
        expect(validationEngine.getErrors().length).toBeGreaterThan(0);
        
        // Reset
        validationEngine.reset();
        
        // State should be cleared
        expect(validationEngine.getIsValid()).toBe(true);
        expect(validationEngine.getErrors()).toEqual([]);
    });
    
    it('should not affect returned results from validateValue', () => {
        const validationEngine = new ValidationEngine(['required']);
        
        // Validate
        const result1 = validationEngine.validateValue('');
        expect(result1.isValid).toBe(false);
        
        // Reset
        validationEngine.reset();
        
        // Previous result should not be affected
        expect(result1.isValid).toBe(false);
        expect(result1.errors.length).toBeGreaterThan(0);
        
        // But state should be reset
        expect(validationEngine.getIsValid()).toBe(true);
        expect(validationEngine.getErrors()).toEqual([]);
    });
});
