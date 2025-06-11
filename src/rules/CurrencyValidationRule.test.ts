import { describe, it, expect } from 'vitest'
import CurrencyValidationRule from './CurrencyValidationRule'

describe('CurrencyValidationRule', () => {
  it('accepts currency format', () => {
    const rule = new CurrencyValidationRule()
    expect(rule.isValid('$10.00')).toEqual([true, ''])
  })

  it('rejects invalid currency', () => {
    const rule = new CurrencyValidationRule()
    expect(rule.isValid('ten')).toEqual([false, 'This field must be a valid currency amount.'])
  })
})
