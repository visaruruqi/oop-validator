import IValidationRule from "../IValidationRule.ts";

export default class EmailValidationRule implements IValidationRule {
    private errorMessage: string = "This field must be a valid email address.";

    isValid(param: string): [boolean, string] {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailPattern.test(param);
        return [isValid, isValid ? "" : this.errorMessage];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'email';
    }

    // @ts-ignore
    setParams(params: any): void {
        // No parameters needed for email rule
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

