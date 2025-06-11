import { describe, it, expect } from 'vitest'
import UsernameValidationRule from './UsernameValidationRule'

describe('UsernameValidationRule', () => {
  it('accepts valid username', () => {
    const rule = new UsernameValidationRule()
    expect(rule.isValid('user_1')).toEqual([true, ''])
  })

  it('rejects invalid username', () => {
    const rule = new UsernameValidationRule()
    expect(rule.isValid('no')).toEqual([false, 'This field must be a valid username.'])
  })
})
