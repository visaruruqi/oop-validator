import IValidationRule from "./IValidationRule";
import { coerceToValidatableString } from "./coerceToString";

export default class MinValidationRule extends IValidationRule {
    private minLength: number = 0;
    private errorMessage: string = "";

    isValid(param: string): [boolean, string] {
        // Pass validation for null/undefined - let required rule handle presence
        if (param == null) {
            return [true, ""];
        }
        
        // Numbers are measured by their string form; other non-strings fail.
        const value = coerceToValidatableString(param);
        if (value === null) {
            return [false, this.errorMessage || `This field must be a string.`];
        }

        const isValid = value.length >= this.minLength;
        return [isValid, isValid ? "" : this.errorMessage || `This field must be at least ${this.minLength} characters long.`];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'min';
    }

    setParams(params: any): void {
        if (params && typeof params === 'object' && typeof params.length === 'number') {
            if (params.length >= 0 && !isNaN(params.length)) {
                this.minLength = params.length;
            }
        }
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

