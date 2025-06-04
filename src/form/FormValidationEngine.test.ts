import { describe, it, expect } from 'vitest'
import FormValidationEngine, { FormConfig } from './FormValidationEngine'
import { MatchFieldValidationRule } from '../index'

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
})
