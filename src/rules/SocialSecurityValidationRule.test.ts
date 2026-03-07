import { describe, it, expect } from 'vitest'
import SocialSecurityValidationRule from './SocialSecurityValidationRule'

describe('SocialSecurityValidationRule', () => {
  it('accepts valid ssn', () => {
    const rule = new SocialSecurityValidationRule()
    expect(rule.isValid('123-45-6789')).toEqual([true, ''])
  })

  it('rejects invalid ssn', () => {
    const rule = new SocialSecurityValidationRule()
    expect(rule.isValid('123')).toEqual([false, 'This field must be a valid SSN.'])
    expect(rule.isValid('123456789')[0]).toBe(false)
    expect(rule.isValid('123-456789')[0]).toBe(false)
    expect(rule.isValid('123456-78')[0]).toBe(false)
  })
})
