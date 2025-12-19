import ValidationEngine from '../rules/ValidationEngine'
import IValidationRule from '../rules/IValidationRule'

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
      const fieldValue = values[field] !== undefined ? values[field] : ''
      const result = engine.validateValue(fieldValue)
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

  /**
   * Validate a single field
   * @param fieldName - The name of the field to validate
   * @param value - The value to validate
   * @param allValues - All form values (needed for cross-field validation like matchField)
   * @returns Validation result for the single field
   */
  validateField(fieldName: string, value: any, allValues?: Record<string, any>): { isValid: boolean; errors: string[] } {
    const engine = this.engines[fieldName]
    
    if (!engine) {
      return { isValid: true, errors: [] }
    }

    // Set context for cross-field validation rules
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

  /**
   * Add a custom validation rule to a specific field engine
   * @param fieldName - The name of the field to add the rule to
   * @param rule - The custom validation rule to add
   */
  addRuleToField(fieldName: string, rule: IValidationRule): void {
    const engine = this.engines[fieldName]
    if (engine) {
      engine.addRule(rule)
    } else {
      console.warn(`Cannot add rule to field "${fieldName}": field does not exist in validation config. Available fields: ${Object.keys(this.engines).join(', ')}`)
    }
  }

  /**
   * Reset validation state for all field engines
   */
  reset(): void {
    Object.values(this.engines).forEach(engine => engine.reset())
  }
}
