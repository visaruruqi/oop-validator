import IValidationRule from "./IValidationRule";

export default class DomainValidationRule implements IValidationRule {
    private errorMessage: string = "This field must be a valid domain.";

    isValid(param: string): [boolean, string] {
        // Safely handle null, undefined, or non-string values
        if (param == null || typeof param !== 'string') {
            return [false, this.errorMessage];
        }
        
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

