import { describe, test, expect } from 'vitest'
import RequiredValidationRule from './RequiredValidationRule'

import MatchFieldValidationRule from './MatchFieldValidationRule'

describe('Validation Rules Null Safety', () => {
  const testCases = [
    { rule: new RequiredValidationRule(), name: 'RequiredValidationRule' },
    { rule: new MatchFieldValidationRule(), name: 'MatchFieldValidationRule' }
  ]

  testCases.forEach(({ rule, name }) => {
    describe(name, () => {
      test('should handle null input safely', () => {
        expect(() => {
          const result = rule.isValid(null as any)
          expect(Array.isArray(result)).toBe(true)
          expect(result).toHaveLength(2)
          expect(typeof result[0]).toBe('boolean')
          expect(typeof result[1]).toBe('string')
          // RequiredValidationRule should reject null
          // MatchFieldValidationRule can match null === null
          if (name === 'RequiredValidationRule') {
            expect(result[0]).toBe(false)
          }
        }).not.toThrow()
      })

      test('should handle undefined input safely', () => {
        expect(() => {
          const result = rule.isValid(undefined as any)
          expect(Array.isArray(result)).toBe(true)
          expect(result).toHaveLength(2)
          expect(typeof result[0]).toBe('boolean')
          expect(typeof result[1]).toBe('string')
          // RequiredValidationRule should reject undefined
          // MatchFieldValidationRule can match undefined === undefined
          if (name === 'RequiredValidationRule') {
            expect(result[0]).toBe(false)
          }
        }).not.toThrow()
      })

      test('should handle non-string input safely', () => {
        expect(() => {
          const result = rule.isValid(123 as any)
          expect(Array.isArray(result)).toBe(true)
          expect(result).toHaveLength(2)
          expect(typeof result[0]).toBe('boolean')
          expect(typeof result[1]).toBe('string')
          // Non-string inputs should generally be invalid, but some regex patterns 
          // might accidentally validate string representations (e.g., "123" for usernames)
          // We'll just ensure it doesn't throw - the specific validation result depends on the rule
        }).not.toThrow()
      })
    })
  })
})