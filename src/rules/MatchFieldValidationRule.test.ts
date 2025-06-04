import { describe, it, expect } from 'vitest'
import MatchFieldValidationRule from './MatchFieldValidationRule'

describe('MatchFieldValidationRule', () => {
  it('validates equal values using getter', () => {
    const rule = new MatchFieldValidationRule(() => 'abc')
    expect(rule.isValid('abc')).toEqual([true, ''])
  })

  it('returns error when values differ', () => {
    const rule = new MatchFieldValidationRule(() => 'other')
    expect(rule.isValid('abc')).toEqual([false, 'Fields do not match.'])
  })

  it('supports isMatch and setParams', () => {
    const rule = new MatchFieldValidationRule(() => 'x')
    expect(rule.isMatch('matchfield')).toBe(true)
    rule.setParams({ getter: () => 'y' })
    expect(rule.isValid('y')).toEqual([true, ''])
  })

  it('works with field name and context', () => {
    const rule = new MatchFieldValidationRule('other')
    rule.setContext({ other: 'val' })
    expect(rule.isValid('val')).toEqual([true, ''])
    rule.setContext({ other: 'nope' })
    expect(rule.isValid('val')[0]).toBe(false)
  })
})
