import IValidationRule from './IValidationRule.ts'

export default class SocialSecurityValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid SSN.'

  isValid(param: string): [boolean, string] {
    const pattern = /^\d{3}-?\d{2}-?\d{4}$/
    const isValid = pattern.test(param)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'ssn'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
