import ValidationEngine from '../rules/ValidationEngine'
import IValidationRule from '../rules/IValidationRule'

export type FieldRules = Array<string | { rule: string, params: any, message?: string } | IValidationRule>
export type FormConfig = Record<string, FieldRules>

export interface FormValidationResult {
  isValid: boolean
  fieldErrors: Record<string, string[]>
  fieldErrorsByRule: Record<string, Record<string, boolean>>
  summary: string[]
}

export default class FormValidationEngine {
  private engines: Record<string, ValidationEngine> = {}

  constructor(config: FormConfig) {
    Object.entries(config).forEach(([field, rules]) => {
      this.engines[field] = new ValidationEngine(rules)
    })
  }

  validate(values: Record<string, any>): FormValidationResult {
    const fieldErrors: Record<string, string[]> = {}
    const fieldErrorsByRule: Record<string, Record<string, boolean>> = {}
    const summary: string[] = []

    Object.entries(this.engines).forEach(([field, engine]) => {
      engine.getRules().forEach(rule => {
        const withContext = rule as unknown as { setContext?: (v: Record<string, any>) => void }
        if (withContext.setContext) {
          withContext.setContext(values)
        }
      })
      const fieldValue = values[field] !== undefined ? values[field] : ''
      const result = engine.validateValue(fieldValue)
      fieldErrors[field] = result.errors
      fieldErrorsByRule[field] = result.errorsByRule
      if (!result.isValid) {
        summary.push(...result.errors.map(err => `${field}: ${err}`))
      }
    })

    return {
      isValid: summary.length === 0,
      fieldErrors,
      fieldErrorsByRule,
      summary
    }
  }

  validateField(fieldName: string, value: any, allValues?: Record<string, any>): { isValid: boolean; errors: string[]; errorsByRule?: Record<string, boolean> } {
    const engine = this.engines[fieldName]

    if (!engine) {
      return { isValid: true, errors: [], errorsByRule: {} }
    }

    if (allValues) {
      engine.getRules().forEach(rule => {
        const withContext = rule as unknown as { setContext?: (v: Record<string, any>) => void }
        if (withContext.setContext) {
          withContext.setContext(allValues)
        }
      })
    }

    return engine.validateValue(value)
  }

  addRuleToField(fieldName: string, rule: IValidationRule): void {
    const engine = this.engines[fieldName]
    if (engine) {
      engine.addRule(rule)
    } else {
      console.warn(`Cannot add rule to field "${fieldName}": field does not exist in validation config. Available fields: ${Object.keys(this.engines).join(', ')}`)
    }
  }

  removeRuleFromField(fieldName: string, ruleKey: string): void {
    const engine = this.engines[fieldName]
    if (engine) {
      engine.removeRule(ruleKey)
    }
  }

  addField(fieldName: string, rules: FieldRules = []): void {
    if (!this.engines[fieldName]) {
      this.engines[fieldName] = new ValidationEngine(rules)
    }
  }

  removeField(fieldName: string): void {
    delete this.engines[fieldName]
  }

  getFieldEngine(fieldName: string): ValidationEngine | undefined {
    return this.engines[fieldName]
  }

  reset(): void {
    Object.values(this.engines).forEach(engine => engine.reset())
  }
}
