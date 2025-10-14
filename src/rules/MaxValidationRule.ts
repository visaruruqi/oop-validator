import IValidationRule from "./IValidationRule";

export default class MaxValidationRule implements IValidationRule {
    private maxLength: number = Infinity;
    private errorMessage: string = "";

    isValid(param: string): [boolean, string] {
        // Safely handle null, undefined, or non-string values
        if (param == null || typeof param !== 'string') {
            return [false, this.errorMessage || `This field must be no more than ${this.maxLength} characters long.`];
        }
        
        const isValid = param.length <= this.maxLength;
        return [isValid, isValid ? "" : this.errorMessage || `This field must be no more than ${this.maxLength} characters long.`];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'max';
    }

    setParams(params: any): void {
        if (typeof params.length === 'number') {
            this.maxLength = params.length;
        }
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

