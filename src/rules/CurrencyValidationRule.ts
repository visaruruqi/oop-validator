import IValidationRule from './IValidationRule'

export default class CurrencyValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid currency amount.'

  isValid(param: string): [boolean, string] {
    // Allow null, undefined, or empty string (optional field)
    if (param == null || param === '') {
      return [true, '']
    }
    
    const pattern = /^\$?\d+(?:\.\d{2})?$/
    const isValid = pattern.test(param)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'currency'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
