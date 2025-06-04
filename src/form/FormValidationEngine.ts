import ValidationEngine from '../rules/ValidationEngine.ts'
import IValidationRule from '../rules/IValidationRule.ts'

export type FieldRules = Array<string | { rule: string, params: any, message?: string } | IValidationRule>
export type FormConfig = Record<string, FieldRules>

export interface FormValidationResult {
  isValid: boolean
  fieldErrors: Record<string, string[]>
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
    const summary: string[] = []

    Object.entries(this.engines).forEach(([field, engine]) => {
      engine.getRules().forEach(rule => {
        const withContext = rule as unknown as { setContext?: (v: Record<string, any>) => void }
        if (withContext.setContext) {
          withContext.setContext(values)
        }
      })
      const result = engine.validateValue(values[field])
      fieldErrors[field] = result.errors
      if (!result.isValid) {
        summary.push(...result.errors.map(err => `${field}: ${err}`))
      }
    })

    return {
      isValid: summary.length === 0,
      fieldErrors,
      summary
    }
  }
}
