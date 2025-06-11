import { describe, it, expect } from 'vitest'
import PhoneNumberValidationRule from './PhoneNumberValidationRule'

describe('PhoneNumberValidationRule', () => {
  it('accepts valid phone', () => {
    const rule = new PhoneNumberValidationRule()
    expect(rule.isValid('+1234567890')).toEqual([true, ''])
  })

  it('rejects invalid phone', () => {
    const rule = new PhoneNumberValidationRule()
    expect(rule.isValid('abc')).toEqual([false, 'This field must be a valid phone number.'])
  })
})
