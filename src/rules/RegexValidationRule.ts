import IValidationRule from './IValidationRule'
import { coerceToValidatableString } from './coerceToString'

export default class RegexValidationRule extends IValidationRule {
    private errorMessage: string = 'Field is invalid.'
    private regexString: string = '';

    constructor(regex: string) {
        super()
        this.regexString = regex
    }

    isValid(param: string): [boolean, string] {
        // Defer empty/missing values to the `required` rule
        if (param == null || param === '') {
            return [true, '']
        }

        // Numbers are tested by their string form (the text the user sees in
        // the input); anything else non-string can't be regex-tested.
        const value = coerceToValidatableString(param)
        if (value === null) {
            return [false, this.errorMessage]
        }

        const isValid = new RegExp(this.regexString).test(value)
        return [isValid, isValid ? '' : this.errorMessage]
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'regex'
    }

    // @ts-ignore
    setParams(params: any): void {
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message
    }

    setRegex(regex: string) {
        this.regexString = regex
    }
}
