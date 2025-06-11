import { describe, it, expect } from 'vitest'
import PasswordStrengthValidationRule from './PasswordStrengthValidationRule'

describe('PasswordStrengthValidationRule', () => {
  it('accepts strong password', () => {
    const rule = new PasswordStrengthValidationRule()
    expect(rule.isValid('Aa1!aaaa')).toEqual([true, ''])
  })

  it('rejects weak password', () => {
    const rule = new PasswordStrengthValidationRule()
    expect(rule.isValid('weak')).toEqual([false, 'Password is too weak.'])
  })
})
