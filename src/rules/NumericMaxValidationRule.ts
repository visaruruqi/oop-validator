import IValidationRule from "./IValidationRule";

export default class NumericMaxValidationRule extends IValidationRule {
    ruleKey: string = 'max';
    private maxValue: number = Infinity;
    private errorMessage: string = "";

    isValid(param: any): [boolean, string] {
        if (param == null || param === '') {
            return [true, ""];
        }
        const num = Number(param);
        if (isNaN(num)) {
            return [false, this.errorMessage || `This field must be a valid number.`];
        }
        const isValid = num <= this.maxValue;
        return [isValid, isValid ? "" : this.errorMessage || `This field must be no more than ${this.maxValue}.`];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'numericmax';
    }

    setParams(params: any): void {
        if (params && typeof params === 'object' && typeof params.value === 'number') {
            this.maxValue = params.value;
        }
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}
