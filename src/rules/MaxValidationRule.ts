import IValidationRule from "./IValidationRule";

export default class MaxValidationRule extends IValidationRule {
    private maxLength: number = Infinity;
    private errorMessage: string = "";

    isValid(param: string): [boolean, string] {
        // Pass validation for null/undefined - let required rule handle presence
        if (param == null) {
            return [true, ""];
        }
        
        // Reject non-string values
        if (typeof param !== 'string') {
            return [false, this.errorMessage || `This field must be a string.`];
        }
        
        const isValid = param.length <= this.maxLength;
        return [isValid, isValid ? "" : this.errorMessage || `This field must be no more than ${this.maxLength} characters long.`];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'max';
    }

    setParams(params: any): void {
        if (params && typeof params === 'object' && typeof params.length === 'number') {
            if (params.length >= 0 && !isNaN(params.length)) {
                this.maxLength = params.length;
            }
        }
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

