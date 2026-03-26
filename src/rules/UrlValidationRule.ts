import IValidationRule from './IValidationRule'

export default class UrlValidationRule extends IValidationRule {
  private errorMessage = 'This field must be a valid URL.'

  isValid(param: string): [boolean, string] {
    // Allow null, undefined, or empty string (optional field)
    if (param == null || param === '') {
      return [true, '']
    }
    
    // Ensure it's a string
    if (typeof param !== 'string') {
      return [false, this.errorMessage]
    }
    
    try {
      const url = new URL(param)
      const isValid = url.protocol === 'http:' || url.protocol === 'https:'
      return [isValid, isValid ? '' : this.errorMessage]
    } catch {
      return [false, this.errorMessage]
    }
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'url'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
