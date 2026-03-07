import { describe, it, expect } from 'vitest'
import IpAddressValidationRule from './IpAddressValidationRule'

describe('IpAddressValidationRule', () => {
  it('accepts valid ipv4', () => {
    const rule = new IpAddressValidationRule()
    expect(rule.isValid('192.168.0.1')).toEqual([true, ''])
  })

  it('accepts valid ipv6', () => {
    const rule = new IpAddressValidationRule()
    expect(rule.isValid('2001:0db8:0000:0000:0000:0000:0000:0001')[0]).toBe(true)
    expect(rule.isValid('2001:db8::1')[0]).toBe(true)
    expect(rule.isValid('::1')[0]).toBe(true)
    expect(rule.isValid('::')[0]).toBe(true)
    expect(rule.isValid('fe80::1')[0]).toBe(true)
  })

  it('rejects invalid ip', () => {
    const rule = new IpAddressValidationRule()
    expect(rule.isValid('999.999.999.999')).toEqual([false, 'This field must be a valid IP address.'])
    expect(rule.isValid('not-an-ip')[0]).toBe(false)
  })
})
