import IValidationRule from "./IValidationRule";

export default class NumberValidationRule extends IValidationRule {
    ruleKey: string = 'number';
    private errorMessage: string = "";

    isValid(param: any): [boolean, string] {
        if (param == null || param === '') {
            return [true, ""];
        }
        const num = Number(param);
        const isValid = !isNaN(num);
        return [isValid, isValid ? "" : this.errorMessage || `This field must be a valid number.`];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'number';
    }

    setParams(_params: any): void {
        // No parameters needed
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}
