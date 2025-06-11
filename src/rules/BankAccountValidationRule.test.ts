import { describe, it, expect } from 'vitest'
import BankAccountValidationRule from './BankAccountValidationRule'

describe('BankAccountValidationRule', () => {
  it('validates numeric account numbers', () => {
    const rule = new BankAccountValidationRule()
    expect(rule.isValid('12345678')).toEqual([true, ''])
  })

  it('rejects invalid account numbers', () => {
    const rule = new BankAccountValidationRule()
    expect(rule.isValid('abc')).toEqual([false, 'This field must be a valid bank account number.'])
  })
})
