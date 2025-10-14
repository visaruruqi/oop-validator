import IValidationRule from './IValidationRule'

export default class PhoneNumberValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid phone number.'

  isValid(param: string): [boolean, string] {
    const pattern = /^\+?[1-9]\d{1,14}$/
    const isValid = pattern.test(param)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'phone'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
