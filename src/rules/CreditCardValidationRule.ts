import IValidationRule from './IValidationRule'

export default class CreditCardValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid credit card number.'

  private luhnCheck(num: string): boolean {
    let sum = 0
    let shouldDouble = false
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i), 10)
      if (shouldDouble) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
      shouldDouble = !shouldDouble
    }
    return sum % 10 === 0
  }

  isValid(param: string): [boolean, string] {
    // Safely handle null, undefined, or non-string values
    if (param == null || typeof param !== 'string') {
      return [false, this.errorMessage]
    }
    
    const digits = param.replace(/[^0-9]/g, '')
    const isValid = /^[0-9]{13,19}$/.test(digits) && this.luhnCheck(digits)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'creditcard'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
