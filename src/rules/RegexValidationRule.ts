import IValidationRule from './IValidationRule.ts'

export default class RegexValidationRule implements IValidationRule {
    private errorMessage: string = 'Field is invalid.'
    private regexString: string = '';

    constructor(regex: string) {
        this.regexString = regex
    }

    isValid(param: string): [boolean, string] {
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