import IValidationRule from './IValidationRule'

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

        // Non-string values can't be regex-tested — treat as invalid
        if (typeof param !== 'string') {
            return [false, this.errorMessage]
        }

        const isValid = new RegExp(this.regexString).test(param)
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
