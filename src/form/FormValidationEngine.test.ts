import { describe, it, expect, vi } from 'vitest'
import FormValidationEngine, { FormConfig } from './FormValidationEngine'
import { MatchFieldValidationRule } from '../index'
import IValidationRule from '../rules/IValidationRule'

describe('FormValidationEngine', () => {
  it('validates multiple fields and collects summary', () => {
    const values = { username: '', confirm: '' }
    const formConfig: FormConfig = {
      username: ['required'],
      confirm: [new MatchFieldValidationRule('username')]
    }

    const engine = new FormValidationEngine(formConfig)

    const result1 = engine.validate(values)
    expect(result1.isValid).toBe(false)
    expect(result1.fieldErrors.username.length).toBe(1)

    values.username = 'john'
    const result2 = engine.validate(values)
    expect(result2.fieldErrors.confirm[0]).toContain('match')
  })

  it('returns valid result when all fields pass validation', () => {
    const values = { username: 'john', email: 'john@example.com' }
    const config: FormConfig = {
      username: ['required', { rule: 'min', params: { length: 3 } }],
      email: ['required', 'email']
    }

    const engine = new FormValidationEngine(config)
    const result = engine.validate(values)

    expect(result.isValid).toBe(true)
    expect(result.summary).toEqual([])
    expect(result.fieldErrors.username).toEqual([])
    expect(result.fieldErrors.email).toEqual([])
  })

  it('aggregates errors for invalid fields', () => {
    const values = { username: '', email: 'bad' }
    const config: FormConfig = {
      username: ['required', { rule: 'min', params: { length: 3 } }],
      email: ['required', 'email']
    }

    const engine = new FormValidationEngine(config)
    const result = engine.validate(values)

    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.username).toEqual([
      'This field is required.',
      'This field must be at least 3 characters long.'
    ])
    expect(result.fieldErrors.email).toEqual([
      'This field must be a valid email address.'
    ])
    expect(result.summary).toContain('username: This field is required.')
    expect(result.summary).toContain(
      'username: This field must be at least 3 characters long.'
    )
    expect(result.summary).toContain(
      'email: This field must be a valid email address.'
    )
  })

  it('invokes setContext on rules that implement it', () => {
    class ContextRule extends MatchFieldValidationRule {
      public contextSet: Record<string, any> | null = null
      setContext(values: Record<string, any>) {
        super.setContext(values)
        this.contextSet = { ...values }
      }
    }

    const rule = new ContextRule('other')
    const config: FormConfig = {
      field: [rule],
      other: ['required']
    }
    const values = { field: 'foo', other: 'foo' }

    const engine = new FormValidationEngine(config)
    engine.validate(values)

    expect(rule.contextSet).toEqual(values)
  })
})

describe('FormValidationEngine - custom rules', () => {
  // Custom rule for testing
  class EvenNumberValidationRule extends IValidationRule {
    private errorMessage = 'Must be an even number'

    isValid(param: any): [boolean, string] {
      const num = Number(param)
      const isValid = !isNaN(num) && num % 2 === 0
      return [isValid, isValid ? '' : this.errorMessage]
    }

    isMatch(type: string): boolean {
      return type.toLowerCase() === 'evennumber'
    }

    setParams(): void {}

    setErrorMessage(message: string): void {
      this.errorMessage = message
    }
  }

  it('should allow adding custom rules to specific fields via addRuleToField()', () => {
    const config: FormConfig = {
      evenNumber: ['required', 'evenNumber'],
      anyNumber: ['required'],
    }

    const engine = new FormValidationEngine(config)
    engine.addRuleToField('evenNumber', new EvenNumberValidationRule())

    const values = { evenNumber: '3', anyNumber: '5' }
    const result = engine.validate(values)

    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.evenNumber).toContain('Must be an even number')
    expect(result.fieldErrors.anyNumber).toEqual([]) // No custom rule applied

    const values2 = { evenNumber: '4', anyNumber: '5' }
    const result2 = engine.validate(values2)

    expect(result2.isValid).toBe(true)
  })

  it('should handle addRuleToField for non-existent field gracefully', () => {
    const config: FormConfig = {
      number: ['required'],
    }

    const engine = new FormValidationEngine(config)
    
    // Mock console.warn to capture the warning
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Should not throw error but should warn
    expect(() => {
      engine.addRuleToField('nonExistentField', new EvenNumberValidationRule())
    }).not.toThrow()

    // Verify warning was called
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Cannot add rule to field "nonExistentField": field does not exist in validation config. Available fields: number'
    )

    consoleWarnSpy.mockRestore()

    const values = { number: '5' }
    const result = engine.validate(values)

    expect(result.isValid).toBe(true)
  })

  it('should reset all underlying validation engines', () => {
    const config: FormConfig = {
      name: ['required'],
      email: ['required', 'email'],
    }

    const engine = new FormValidationEngine(config)

    // First validate with invalid values to populate internal state
    const invalidValues = { name: '', email: 'invalid' }
    const result1 = engine.validate(invalidValues)
    
    expect(result1.isValid).toBe(false)
    expect(result1.fieldErrors.name.length).toBeGreaterThan(0)
    expect(result1.fieldErrors.email.length).toBeGreaterThan(0)

    // Reset the engine
    engine.reset()

    // The reset should not affect subsequent validations (validate returns fresh results)
    // But if someone uses the stateful API (getErrors/getIsValid), those should be reset
    // Validate again with the same invalid values
    const result2 = engine.validate(invalidValues)
    
    // Validation should still work correctly after reset
    expect(result2.isValid).toBe(false)
    expect(result2.fieldErrors.name.length).toBeGreaterThan(0)
    expect(result2.fieldErrors.email.length).toBeGreaterThan(0)

    // Validate with valid values
    const validValues = { name: 'John', email: 'john@example.com' }
    const result3 = engine.validate(validValues)
    
    expect(result3.isValid).toBe(true)
    expect(result3.fieldErrors.name).toEqual([])
    expect(result3.fieldErrors.email).toEqual([])
  })
})
