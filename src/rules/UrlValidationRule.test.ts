import { describe, it, expect } from 'vitest'
import UrlValidationRule from './UrlValidationRule'

describe('UrlValidationRule', () => {
  it('accepts valid url', () => {
    const rule = new UrlValidationRule()
    expect(rule.isValid('https://example.com')).toEqual([true, ''])
  })

  it('rejects invalid url', () => {
    const rule = new UrlValidationRule()
    expect(rule.isValid('not a url')).toEqual([false, 'This field must be a valid URL.'])
  })
})
