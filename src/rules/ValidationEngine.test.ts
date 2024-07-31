import { describe, it, expect } from 'vitest';
import ValidationEngine from './ValidationEngine';
import RequiredValidationRule from './RequiredValidationRule';
import IValidationRule from "./IValidationRule.ts";

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
        class CustomRule implements IValidationRule {
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
});
