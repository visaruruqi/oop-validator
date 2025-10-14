import IValidationRule from './IValidationRule'

export default class DateValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid date.'

  isValid(param: string): [boolean, string] {
    const pattern = /^\d{4}-\d{2}-\d{2}$/
    let isValid = false
    if (pattern.test(param)) {
      const date = new Date(param)
      isValid = !isNaN(date.getTime()) && param === date.toISOString().slice(0,10)
    }
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'date'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
