import { describe, it, expect } from 'vitest'
import CreditCardValidationRule from './CreditCardValidationRule'

describe('CreditCardValidationRule', () => {
  it('accepts valid card number', () => {
    const rule = new CreditCardValidationRule()
    expect(rule.isValid('4111 1111 1111 1111')).toEqual([true, ''])
  })

  it('rejects invalid card number', () => {
    const rule = new CreditCardValidationRule()
    expect(rule.isValid('1234')).toEqual([false, 'This field must be a valid credit card number.'])
  })
})
