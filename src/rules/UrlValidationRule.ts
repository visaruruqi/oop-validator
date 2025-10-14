import IValidationRule from './IValidationRule'

export default class UrlValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid URL.'

  isValid(param: string): [boolean, string] {
    // Safely handle null, undefined, or non-string values
    if (param == null || typeof param !== 'string') {
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
