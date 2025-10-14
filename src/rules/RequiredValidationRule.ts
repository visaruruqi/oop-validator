import IValidationRule from './IValidationRule';

export default class RequiredValidationRule implements IValidationRule {
    private errorMessage: string = "This field is required.";

    isValid(param: string): [boolean, string] {
        // Safely handle null, undefined, or non-string values
        if (param == null || typeof param !== 'string') {
            return [false, this.errorMessage];
        }
        
        const isValid = param.trim().length > 0;
        return [isValid, isValid ? "" : this.errorMessage];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'required';
    }

    // @ts-ignore
    setParams(params: any): void {
        // No parameters needed for required rule
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

