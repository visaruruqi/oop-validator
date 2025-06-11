import IValidationRule from './IValidationRule.ts'

export default class BankAccountValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid bank account number.'

  isValid(param: string): [boolean, string] {
    const pattern = /^\d{8,20}$/
    const isValid = pattern.test(param)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'bankaccount'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
