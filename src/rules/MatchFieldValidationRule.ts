import IValidationRule from './IValidationRule'

/**
 * Validation rule to ensure a field matches the value of another field.
 * The other field value is provided via a function so the rule can access
 * the latest form state when validation runs.
 */
export default class MatchFieldValidationRule implements IValidationRule {
  private otherFieldGetter: (() => any) | null = null
  private otherFieldName?: string
  private context: Record<string, any> = {}
  private errorMessage = 'Fields do not match.'

  constructor(getterOrField?: (() => any) | string) {
    if (typeof getterOrField === 'function') {
      this.otherFieldGetter = getterOrField
    } else if (typeof getterOrField === 'string') {
      this.otherFieldName = getterOrField
    }
  }

  setContext(values: Record<string, any>): void {
    this.context = values
  }

  private getOtherValue(): any {
    if (this.otherFieldGetter) {
      return this.otherFieldGetter()
    }
    if (this.otherFieldName) {
      return this.context[this.otherFieldName]
    }
    return undefined
  }

  isValid(param: string): [boolean, string] {
    const otherValue = this.getOtherValue()
    const isValid = param === otherValue
    return [isValid, isValid ? '' : this.errorMessage]
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'matchfield'
  }

  setParams(params: any): void {
    if (typeof params.getter === 'function') {
      this.otherFieldGetter = params.getter
      this.otherFieldName = undefined
    }
    if (typeof params.otherField === 'string') {
      this.otherFieldName = params.otherField
      this.otherFieldGetter = null
    }
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message
  }
}
