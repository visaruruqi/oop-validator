import IValidationRule from './IValidationRule'

export default class PasswordStrengthValidationRule extends IValidationRule {
  private errorMessage = 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'

  isValid(param: string): [boolean, string] {
    // Allow null, undefined, or empty string (optional field)
    if (param == null || param === '') {
      return [true, '']
    }
    
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
    const isValid = pattern.test(param)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'password'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
