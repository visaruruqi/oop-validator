import IValidationRule from './IValidationRule'

export default class UsernameValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid username.'

  isValid(param: string): [boolean, string] {
    // Allow null, undefined, or empty string (optional field)
    if (param == null || param === '') {
      return [true, '']
    }
    
    const pattern = /^[A-Za-z0-9_]{3,20}$/
    const isValid = pattern.test(param)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'username'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
