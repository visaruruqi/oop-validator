import IValidationRule from "../IValidationRule.ts";

export  default class DomainValidationRule implements IValidationRule {
    private errorMessage: string = "This field must be a valid domain.";

    isValid(param: string): [boolean, string] {
        const isValid = param.includes('.');
        return [isValid, isValid ? "" : this.errorMessage];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'domain';
    }

    // @ts-ignore
    setParams(params: any): void {
        // No parameters needed for domain rule
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

