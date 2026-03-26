import IValidationRule from "./IValidationRule";

export default class NumericMinValidationRule extends IValidationRule {
    ruleKey: string = 'min';
    private minValue: number = 0;
    private errorMessage: string = "";

    isValid(param: any): [boolean, string] {
        if (param == null || param === '') {
            return [true, ""];
        }
        const num = Number(param);
        if (isNaN(num)) {
            return [false, this.errorMessage || `This field must be a valid number.`];
        }
        const isValid = num >= this.minValue;
        return [isValid, isValid ? "" : this.errorMessage || `This field must be at least ${this.minValue}.`];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'numericmin';
    }

    setParams(params: any): void {
        if (params && typeof params === 'object' && typeof params.value === 'number') {
            this.minValue = params.value;
        }
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}
