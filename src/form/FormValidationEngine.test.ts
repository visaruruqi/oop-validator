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
