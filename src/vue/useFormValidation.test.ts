import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import useFormValidation from './useFormValidation'
import MatchFieldValidationRule from '../rules/MatchFieldValidationRule'

describe('useFormValidation', () => {
  it('should initialize with validation result for initial values', () => {
    const formValues = ref({
      username: '',
      email: 'invalid-email'
    })

    const config = {
      username: ['required'],
      email: ['required', 'email']
    }

    const { errors, isValid, summary } = useFormValidation(formValues, config)

    expect(isValid.value).toBe(false)
    expect(errors.value.username).toContain('This field is required.')
    expect(errors.value.email).toContain('This field must be a valid email address.')
    expect(summary.value.length).toBeGreaterThan(0)
  })

  it('should update validation when form values change', async () => {
    const formValues = ref({
      username: '',
      email: ''
    })

    const config = {
      username: ['required'],
      email: ['required', 'email']
    }

    const { errors, isValid } = useFormValidation(formValues, config)

    // Initially invalid
    expect(isValid.value).toBe(false)

    // Update values to valid ones
    formValues.value.username = 'validuser'
    formValues.value.email = 'valid@example.com'

    await nextTick()

    expect(isValid.value).toBe(true)
    expect(errors.value.username).toEqual([])
    expect(errors.value.email).toEqual([])
  })

  it('should provide field-specific validation helpers', () => {
    const formValues = ref({
      username: '',
      email: 'valid@example.com'
    })

    const config = {
      username: ['required'],
      email: ['required', 'email']
    }

    const { getFieldErrors, isFieldValid } = useFormValidation(formValues, config)

    const usernameErrors = getFieldErrors('username')
    const emailErrors = getFieldErrors('email')
    const isUsernameValid = isFieldValid('username')
    const isEmailValid = isFieldValid('email')

    expect(usernameErrors.value).toContain('This field is required.')
    expect(emailErrors.value).toEqual([])
    expect(isUsernameValid.value).toBe(false)
    expect(isEmailValid.value).toBe(true)
  })

  it('should handle complex validation rules with custom messages', () => {
    const formValues = ref({
      password: 'abc',
      confirmPassword: 'def'
    })

    const config = {
      password: [
        'required',
        { rule: 'min', params: { length: 8 }, message: 'Password must be at least 8 characters long.' }
      ],
      confirmPassword: [
        'required',
        new MatchFieldValidationRule('password')
      ]
    }

    const { errors, summary } = useFormValidation(formValues, config)

    expect(errors.value.password).toContain('Password must be at least 8 characters long.')
    expect(errors.value.confirmPassword).toContain('Fields do not match.')
    expect(summary.value).toEqual([
      'password: Password must be at least 8 characters long.',
      'confirmPassword: Fields do not match.'
    ])
  })

  it('should work with MatchFieldValidationRule that accesses other fields', async () => {
    const formValues = ref({
      password: 'mypassword123',
      confirmPassword: 'different'
    })

    const config = {
      password: ['required'],
      confirmPassword: [
        'required',
        new MatchFieldValidationRule('password')
      ]
    }

    const { errors, isValid } = useFormValidation(formValues, config)

    // Initially passwords don't match
    expect(isValid.value).toBe(false)
    expect(errors.value.confirmPassword).toContain('Fields do not match.')

    // Make passwords match
    formValues.value.confirmPassword = 'mypassword123'

    await nextTick()

    expect(isValid.value).toBe(true)
    expect(errors.value.confirmPassword).toEqual([])
  })

  it('should allow manual validation with custom values', () => {
    const formValues = ref({
      username: 'currentuser'
    })

    const config = {
      username: ['required']
    }

    const { validate } = useFormValidation(formValues, config)

    // Manual validation with different values
    const result = validate({ username: '' })

    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.username).toContain('This field is required.')
    expect(result.summary).toContain('username: This field is required.')
  })

  it('should handle empty form configuration', () => {
    const formValues = ref({})
    const config = {}

    const { errors, isValid, summary } = useFormValidation(formValues, config)

    expect(isValid.value).toBe(true)
    expect(errors.value).toEqual({})
    expect(summary.value).toEqual([])
  })

  it('should handle field that does not exist in form values', () => {
    const formValues = ref({
      username: 'testuser'
      // email field intentionally missing
    })

    const config = {
      username: ['required'],
      email: ['required'] // email field not in formValues
    }

    const { errors, getFieldErrors } = useFormValidation(formValues, config)

    expect(errors.value.email).toContain('This field is required.')
    
    const emailErrors = getFieldErrors('email')
    expect(emailErrors.value).toContain('This field is required.')
  })

  it('should handle deep reactive changes', async () => {
    const formValues = ref({
      username: '',
      email: ''
    })

    const config = {
      username: ['required'],
      email: ['required', 'email']
    }

    const { errors, isValid } = useFormValidation(formValues, config)

    // Initially invalid
    expect(isValid.value).toBe(false)

    // Update values
    formValues.value.username = 'testuser'
    formValues.value.email = 'test@example.com'

    await nextTick()

    // Should be valid now
    expect(isValid.value).toBe(true)
    expect(errors.value.username).toEqual([])
    expect(errors.value.email).toEqual([])
  })

  it('should support "changed" validation strategy for better performance', async () => {
    const formValues = ref({
      username: '',
      email: 'invalid',
      age: ''
    })

    const config = {
      username: ['required'],
      email: ['required', 'email'],
      age: ['required']
    }

    // Use 'changed' strategy - only validates fields that change
    const { errors, isValid } = useFormValidation(formValues, config, { 
      validationStrategy: 'changed' 
    })

    // Initially no errors (not validated yet with 'changed' strategy)
    expect(isValid.value).toBe(true) // No errors yet
    expect(errors.value.username || []).toEqual([])
    expect(errors.value.email || []).toEqual([])
    expect(errors.value.age || []).toEqual([])

    // Update only username - should only validate username
    formValues.value.username = 'validuser'
    await nextTick()

    // Username should be valid now
    expect(errors.value.username).toEqual([])
    // Email and age haven't been validated yet (no interaction)
    expect(errors.value.email || []).toEqual([])
    expect(errors.value.age || []).toEqual([])
    expect(isValid.value).toBe(true) // All validated fields are valid

    // Now interact with email (set to invalid value first, then valid)
    formValues.value.email = 'invalid-email'
    await nextTick()
    
    expect(errors.value.email).toContain('This field must be a valid email address.')
    expect(isValid.value).toBe(false) // Email is invalid

    // Fix email
    formValues.value.email = 'valid@example.com'
    await nextTick()

    expect(errors.value.email).toEqual([])
    expect(isValid.value).toBe(true) // Email is now valid

    // Interact with age
    formValues.value.age = '25'
    await nextTick()

    expect(errors.value.age).toEqual([])
    expect(isValid.value).toBe(true) // All interacted fields are valid
  })

  it('should default to "all" validation strategy when no option provided', async () => {
    const formValues = ref({
      username: '',
      email: ''
    })

    const config = {
      username: ['required'],
      email: ['required', 'email']
    }

    // No options provided - should default to 'all' strategy
    const { errors, isValid } = useFormValidation(formValues, config)

    expect(isValid.value).toBe(false)

    // Update both fields
    formValues.value.username = 'testuser'
    formValues.value.email = 'test@example.com'
    await nextTick()

    // All fields should be validated
    expect(isValid.value).toBe(true)
    expect(errors.value.username).toEqual([])
    expect(errors.value.email).toEqual([])
  })

  it('should support validateOnMount option to control initial validation', async () => {
    const formValues = ref({
      username: '',
      email: ''
    })

    const config = {
      username: ['required'],
      email: ['required', 'email']
    }

    // Use 'all' strategy but disable initial validation
    const { errors, isValid } = useFormValidation(formValues, config, {
      validationStrategy: 'all',
      validateOnMount: false
    })

    // Should not have errors initially
    expect(isValid.value).toBe(true)
    expect(errors.value.username || []).toEqual([])

    // Update a field - should validate ALL fields (because strategy is 'all')
    formValues.value.username = 'testuser'
    await nextTick()

    // Now both fields should be validated (all strategy)
    expect(errors.value.username).toEqual([])
    expect(errors.value.email).toContain('This field is required.')
    expect(isValid.value).toBe(false)
  })

  it('should support validateOnMount: true with "changed" strategy', async () => {
    const formValues = ref({
      username: '',
      email: ''
    })

    const config = {
      username: ['required'],
      email: ['required', 'email']
    }

    // Use 'changed' strategy but enable initial validation
    const { errors, isValid } = useFormValidation(formValues, config, {
      validationStrategy: 'changed',
      validateOnMount: true
    })

    // Should have errors initially (validateOnMount: true)
    expect(isValid.value).toBe(false)
    expect(errors.value.username).toContain('This field is required.')
    expect(errors.value.email).toContain('This field is required.')

    // Update only username - should only validate username (changed strategy)
    formValues.value.username = 'testuser'
    await nextTick()

    expect(errors.value.username).toEqual([])
    expect(errors.value.email).toContain('This field is required.') // Still has error
    expect(isValid.value).toBe(false)
  })
})
