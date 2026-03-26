import IValidationRule from './IValidationRule'

export default class RegexValidationRule extends IValidationRule {
    private errorMessage: string = 'Field is invalid.'
    private regexString: string = '';

    constructor(regex: string) {
        super()
        this.regexString = regex
    }

    isValid(param: string): [boolean, string] {
        // Safely handle null, undefined, or non-string values
        if (param == null || typeof param !== 'string') {
            return [false, this.errorMessage]
        }
        
        // added the check param && param.length because we shouldn't validate the empty string
        const isValid = param && param.length ? new RegExp(this.regexString).test(param) : true
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
