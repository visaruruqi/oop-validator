import IValidationRule from './IValidationRule'

export default class IpAddressValidationRule implements IValidationRule {
  private errorMessage = 'This field must be a valid IP address.'

  isValid(param: string): [boolean, string] {
    const ipv4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/
    const ipv6 = /^[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7}$/
    const isValid = ipv4.test(param) || ipv6.test(param)
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'ip'
  }

  // @ts-ignore
  setParams(params: any): void {}

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
