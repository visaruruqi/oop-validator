import IValidationRule from "./IValidationRule";

export default class MinValidationRule implements IValidationRule {
    private minLength: number = 0;
    private errorMessage: string = "";

    isValid(param: string = ''): [boolean, string] {
        // Reject null, undefined, or non-string values
        if (param == null || typeof param !== 'string') {
            return [false, this.errorMessage || `This field must be at least ${this.minLength} characters long.`];
        }
        
        const isValid = param.length >= this.minLength;
        return [isValid, isValid ? "" : this.errorMessage || `This field must be at least ${this.minLength} characters long.`];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'min';
    }

    setParams(params: any): void {
        if (typeof params.length === 'number') {
            this.minLength = params.length;
        }
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

