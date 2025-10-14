/**
 * Demonstration of null safety improvements in oop-validator v0.3.0
 * This script shows how validation rules now safely handle null/undefined inputs
 * without throwing runtime exceptions.
 */

import { EmailValidationRule, CreditCardValidationRule, ValidationEngine } from './src/index'

console.log('=== OOP Validator Null Safety Demonstration ===\n')

// Test individual validation rules
const emailRule = new EmailValidationRule()
const creditCardRule = new CreditCardValidationRule()

console.log('1. Testing EmailValidationRule with unsafe inputs:')
console.log('   null input:', emailRule.isValid(null as any))
console.log('   undefined input:', emailRule.isValid(undefined as any))
console.log('   number input:', emailRule.isValid(123 as any))
console.log('   object input:', emailRule.isValid({} as any))
console.log()

console.log('2. Testing CreditCardValidationRule with unsafe inputs:')
console.log('   null input:', creditCardRule.isValid(null as any))
console.log('   undefined input:', creditCardRule.isValid(undefined as any))
console.log('   boolean input:', creditCardRule.isValid(true as any))
console.log('   array input:', creditCardRule.isValid([] as any))
console.log()

// Test ValidationEngine with null safety
console.log('3. Testing ValidationEngine with null/undefined values:')
const emailEngine = new ValidationEngine(['email'])
const creditEngine = new ValidationEngine(['creditcard'])

console.log('   Email validation with null:', emailEngine.validateValue(null))
console.log('   Email validation with undefined:', emailEngine.validateValue(undefined))
console.log('   Credit card validation with null:', creditEngine.validateValue(null))
console.log('   Credit card validation with undefined:', creditEngine.validateValue(undefined))
console.log()

console.log('✅ All operations completed without throwing exceptions!')
console.log('🛡️  Your application is now protected from null/undefined validation crashes!')