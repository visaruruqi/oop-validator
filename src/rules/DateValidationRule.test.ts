import { describe, it, expect } from 'vitest'
import DateValidationRule from './DateValidationRule'

describe('DateValidationRule', () => {
  it('accepts valid date', () => {
    const rule = new DateValidationRule()
    expect(rule.isValid('2024-01-01')).toEqual([true, ''])
  })

  it('rejects invalid date', () => {
    const rule = new DateValidationRule()
    expect(rule.isValid('2024-13-01')).toEqual([false, 'This field must be a valid date.'])
  })
})
