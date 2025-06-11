import { describe, it, expect } from 'vitest'
import IpAddressValidationRule from './IpAddressValidationRule'

describe('IpAddressValidationRule', () => {
  it('accepts valid ipv4', () => {
    const rule = new IpAddressValidationRule()
    expect(rule.isValid('192.168.0.1')).toEqual([true, ''])
  })

  it('rejects invalid ip', () => {
    const rule = new IpAddressValidationRule()
    expect(rule.isValid('999.999.999.999')).toEqual([false, 'This field must be a valid IP address.'])
  })
})
