import IValidationRule from './IValidationRule';

export default class RequiredValidationRule extends IValidationRule {
    private errorMessage: string = "This field is required.";

    isValid(param: any): [boolean, string] {
        if (param == null) return [false, this.errorMessage]
        if (typeof param === 'boolean') return [param, param ? '' : this.errorMessage]
        if (typeof param === 'number') return [!isNaN(param), isNaN(param) ? this.errorMessage : '']
        if (Array.isArray(param)) return [param.length > 0, param.length > 0 ? '' : this.errorMessage]
        if (typeof param === 'string') {
            const valid = param.trim().length > 0
            return [valid, valid ? '' : this.errorMessage]
        }
        return [true, '']
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

