import { describe, it, expect } from 'vitest'
import PasswordStrengthValidationRule from './PasswordStrengthValidationRule'

describe('PasswordStrengthValidationRule', () => {
  it('accepts strong password', () => {
    const rule = new PasswordStrengthValidationRule()
    expect(rule.isValid('Aa1!aaaa')).toEqual([true, ''])
  })

  it('rejects weak password', () => {
    const rule = new PasswordStrengthValidationRule()
    expect(rule.isValid('weak')).toEqual([false, 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'])
  })
})
