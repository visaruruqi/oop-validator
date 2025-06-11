import { describe, it, expect } from 'vitest'
import ZipCodeValidationRule from './ZipCodeValidationRule'

describe('ZipCodeValidationRule', () => {
  it('accepts valid zip', () => {
    const rule = new ZipCodeValidationRule()
    expect(rule.isValid('12345')).toEqual([true, ''])
  })

  it('rejects invalid zip', () => {
    const rule = new ZipCodeValidationRule()
    expect(rule.isValid('12-34')).toEqual([false, 'This field must be a valid ZIP code.'])
  })
})
