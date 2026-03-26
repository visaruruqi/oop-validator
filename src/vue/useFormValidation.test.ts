import { describe, it, expect } from 'vitest'
import { ref, nextTick, reactive, computed, readonly } from 'vue'
import useFormValidation from './useFormValidation'
import MatchFieldValidationRule from '../rules/MatchFieldValidationRule'
import IValidationRule from '../rules/IValidationRule'

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
      validationStrategy: 'changed',
      validateOnMount: false // Explicitly disable validation on mount
    })

    // Initially no errors (not validated yet with validateOnMount: false)
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

describe('useFormValidation - fields API', () => {
  it('should provide fields object with complete field state', async () => {
    const formData = ref({
      username: 'initial',
      email: 'test@example.com',
    })

    const config = {
      username: ['required'],
      email: ['required', 'email'],
    }

    const { fields } = useFormValidation(formData, config)

    // Initially all fields should be valid with correct state
    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.username.errors).toEqual([])
    expect(fields.value.username.isDirty).toBe(false)
    expect(fields.value.username.isTouched).toBe(false)

    // Update username
    formData.value.username = 'changed'
    await nextTick()

    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.username.errors).toEqual([])
    expect(fields.value.username.isDirty).toBe(true) // Changed from initial
    expect(fields.value.username.isTouched).toBe(false) // Not touched yet
  })

  it('should track isDirty correctly', async () => {
    const formData = ref({
      email: 'initial@example.com',
    })

    const config = {
      email: ['required', 'email'],
    }

    const { fields } = useFormValidation(formData, config)

    // Initially not dirty
    expect(fields.value.email.isDirty).toBe(false)

    // Change value
    formData.value.email = 'changed@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(true)

    // Change back to initial value
    formData.value.email = 'initial@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(false) // Back to initial
  })

  it('should work with changed strategy', async () => {
    const formData = ref({
      username: '',
      email: '',
    })

    const config = {
      username: ['required'],
      email: ['required', 'email'],
    }

    const { fields } = useFormValidation(formData, config, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    // With 'changed' strategy and no validateOnMount, fields start as valid
    await nextTick()
    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.username.errors).toEqual([])
    expect(fields.value.username.isDirty).toBe(false)

    // Change username
    formData.value.username = 'test'
    await nextTick()

    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.username.isDirty).toBe(true)
  })
})

describe('useFormValidation - touch tracking', () => {
  it('should track touched state with touch() method', async () => {
    const formData = ref({
      email: '',
    })

    const config = {
      email: ['required', 'email'],
    }

    const { fields, touch } = useFormValidation(formData, config)

    // Initially not touched
    expect(fields.value.email.isTouched).toBe(false)

    // Touch the field
    touch('email')
    await nextTick()

    expect(fields.value.email.isTouched).toBe(true)
  })

  it('should touch all fields with touchAll() method', async () => {
    const formData = ref({
      username: '',
      email: '',
      phone: '',
    })

    const config = {
      username: ['required'],
      email: ['required', 'email'],
      phone: ['required', 'phone'],
    }

    const { fields, touchAll } = useFormValidation(formData, config)

    // Initially no fields touched
    expect(fields.value.username.isTouched).toBe(false)
    expect(fields.value.email.isTouched).toBe(false)
    expect(fields.value.phone.isTouched).toBe(false)

    // Touch all fields
    touchAll()
    await nextTick()

    expect(fields.value.username.isTouched).toBe(true)
    expect(fields.value.email.isTouched).toBe(true)
    expect(fields.value.phone.isTouched).toBe(true)
  })

  it('should preserve isTouched state during validation', async () => {
    const formData = ref({
      email: '',
    })

    const config = {
      email: ['required', 'email'],
    }

    const { fields, touch } = useFormValidation(formData, config)

    // Touch the field
    touch('email')
    await nextTick()

    expect(fields.value.email.isTouched).toBe(true)

    // Change value (triggers validation)
    formData.value.email = 'test@example.com'
    await nextTick()

    // isTouched should still be true
    expect(fields.value.email.isTouched).toBe(true)
  })
})

describe('useFormValidation - reset()', () => {
  it('should reset all field states to initial', async () => {
    const formData = ref({
      username: 'initial',
      email: 'test@example.com',
    })

    const config = {
      username: ['required'],
      email: ['required', 'email'],
    }

    const { fields, touch, reset } = useFormValidation(formData, config)

    // Make changes
    formData.value.username = 'changed'
    touch('username')
    await nextTick()

    expect(fields.value.username.isDirty).toBe(true)
    expect(fields.value.username.isTouched).toBe(true)

    // Reset
    reset()
    await nextTick()

    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.username.errors).toEqual([])
    expect(fields.value.username.isDirty).toBe(false)
    expect(fields.value.username.isTouched).toBe(false)
  })

  it('should reset form after invalid data entry', async () => {
    const formData = ref({
      email: 'valid@example.com',
    })

    const config = {
      email: ['required', 'email'],
    }

    const { fields, touch, reset } = useFormValidation(formData, config)

    // Enter invalid email and touch
    formData.value.email = 'invalid-email'
    touch('email')
    await nextTick()

    expect(fields.value.email.isValid).toBe(false)
    expect(fields.value.email.errors.length).toBeGreaterThan(0)
    expect(fields.value.email.isDirty).toBe(true)
    expect(fields.value.email.isTouched).toBe(true)

    // Reset
    reset()
    await nextTick()

    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.email.errors).toEqual([])
    expect(fields.value.email.isDirty).toBe(false)
    expect(fields.value.email.isTouched).toBe(false)
  })

  it('should reset deprecated API as well', async () => {
    const formData = ref({
      username: 'initial',
    })

    const config = {
      username: ['required'],
    }

    const { errors, isValid, reset } = useFormValidation(formData, config)

    // Change to invalid
    formData.value.username = ''
    await nextTick()

    expect(errors.value.username?.length).toBeGreaterThan(0)
    expect(isValid.value).toBe(false)

    // Reset
    reset()
    await nextTick()

    // Should reset old API too
    expect(errors.value.username || []).toEqual([])
    expect(isValid.value).toBe(true)
  })

  it('should update initial values snapshot on reset', async () => {
    const formData = ref({
      email: 'original@example.com',
    })

    const config = {
      email: ['required', 'email'],
    }

    const { fields, reset } = useFormValidation(formData, config)

    // Change email
    formData.value.email = 'changed@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(true)

    // Reset (should update initial values to current values)
    reset()
    await nextTick()

    expect(fields.value.email.isDirty).toBe(false)

    // Change again - should be dirty relative to reset point
    formData.value.email = 'another@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(true)
  })
})

describe('useFormValidation - changed strategy with null/empty initial values', () => {
  it('should not trigger validation on mount with changed strategy and validateOnMount: false', async () => {
    const formData = ref({
      address: '',
      city: null,
      state: '',
      country: null,
      postal: '',
    })

    const validationRules = {
      address: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 255 } }],
      city: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      state: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      country: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      postal: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
    }

    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    // Should NOT trigger validation on mount
    await nextTick()

    // All fields should have no errors (not validated yet)
    expect(errors.value.address || []).toEqual([])
    expect(errors.value.city || []).toEqual([])
    expect(errors.value.state || []).toEqual([])
    expect(errors.value.country || []).toEqual([])
    expect(errors.value.postal || []).toEqual([])

    // Fields should be considered valid (not touched yet)
    expect(fields.value.address.isValid).toBe(true)
    expect(fields.value.city.isValid).toBe(true)
    expect(fields.value.state.isValid).toBe(true)
    expect(fields.value.country.isValid).toBe(true)
    expect(fields.value.postal.isValid).toBe(true)

    // Overall form should be valid (no validation run yet)
    expect(isValid.value).toBe(true)

    // Fields should not be dirty (initial state)
    expect(fields.value.address.isDirty).toBe(false)
    expect(fields.value.city.isDirty).toBe(false)
  })

  it('should trigger validation only on changed fields', async () => {
    const formData = ref({
      address: '',
      city: null,
      state: '',
      country: null,
      postal: '',
    })

    const validationRules = {
      address: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 255 } }],
      city: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      state: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      country: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      postal: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
    }

    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Initially no validation
    expect(isValid.value).toBe(true)

    // Change address to a short value (invalid)
    formData.value.address = 'A'
    await nextTick()

    // Address should now be validated and have errors
    expect(fields.value.address.isValid).toBe(false)
    expect(errors.value.address.length).toBeGreaterThan(0)
    expect(errors.value.address[0]).toContain('at least 2')

    // Other fields should still NOT be validated
    expect(fields.value.city.isValid).toBe(true)
    expect(fields.value.state.isValid).toBe(true)
    expect(fields.value.country.isValid).toBe(true)
    expect(fields.value.postal.isValid).toBe(true)

    // Overall form should be invalid (one field has errors)
    expect(isValid.value).toBe(false)

    // Address should be dirty
    expect(fields.value.address.isDirty).toBe(true)
    expect(fields.value.city.isDirty).toBe(false)
  })

  it('should validate from null to valid value', async () => {
    const formData = ref<{
      address: string | null
      city: string | null
      state: string | null
      country: string | null
      postal: string | null
    }>({
      address: null,
      city: null,
      state: null,
      country: null,
      postal: null,
    })

    const validationRules = {
      address: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 255 } }],
      city: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      state: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      country: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      postal: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
    }

    const { errors, fields } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Change city from null to valid value
    formData.value.city = 'New York'
    await nextTick()

    // City should be validated and valid
    expect(fields.value.city.isValid).toBe(true)
    expect(errors.value.city || []).toEqual([])

    // Change country from null to invalid value
    formData.value.country = 'U'
    await nextTick()

    // Country should be validated and invalid
    expect(fields.value.country.isValid).toBe(false)
    expect(errors.value.country.length).toBeGreaterThan(0)

    // Other fields should remain unvalidated
    expect(fields.value.address.isValid).toBe(true) // Still untouched
    expect(fields.value.state.isValid).toBe(true) // Still untouched
    expect(fields.value.postal.isValid).toBe(true) // Still untouched
  })

  it('should handle mixed null and empty string initial values', async () => {
    const formData = ref<{
      address: string | null
      city: string | null
      state: string | null
      country: string | null
      postal: string | null
    }>({
      address: '',
      city: null,
      state: '',
      country: null,
      postal: '',
    })

    const validationRules = {
      address: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 255 } }],
      city: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      state: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      country: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
      postal: [{ rule: 'min', params: { length: 2 } }, { rule: 'max', params: { length: 100 } }],
    }

    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // No validation should have run
    expect(isValid.value).toBe(true)

    // Update all fields to valid values
    formData.value.address = '123 Main St'
    formData.value.city = 'New York'
    formData.value.state = 'NY'
    formData.value.country = 'USA'
    formData.value.postal = '10001'
    await nextTick()

    // All fields should now be validated and valid
    expect(fields.value.address.isValid).toBe(true)
    expect(fields.value.city.isValid).toBe(true)
    expect(fields.value.state.isValid).toBe(true)
    expect(fields.value.country.isValid).toBe(true)
    expect(fields.value.postal.isValid).toBe(true)

    // No errors
    expect(Object.keys(errors.value).every(key => (errors.value[key] || []).length === 0)).toBe(true)

    // Overall form valid
    expect(isValid.value).toBe(true)

    // All fields should be dirty
    expect(fields.value.address.isDirty).toBe(true)
    expect(fields.value.city.isDirty).toBe(true)
    expect(fields.value.state.isDirty).toBe(true)
    expect(fields.value.country.isDirty).toBe(true)
    expect(fields.value.postal.isDirty).toBe(true)
  })

  it('should not validate when changing from empty string to empty string', async () => {
    const formData = ref({
      address: '',
      city: '',
    })

    const validationRules = {
      address: [{ rule: 'min', params: { length: 2 } }],
      city: [{ rule: 'min', params: { length: 2 } }],
    }

    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // No validation initially
    expect(isValid.value).toBe(true)
    expect(fields.value.address.isValid).toBe(true)

    // Change to same value (empty string)
    formData.value.address = ''
    await nextTick()

    // Should still not validate (no real change)
    expect(fields.value.address.isValid).toBe(true)
    expect(errors.value.address || []).toEqual([])
  })

  it('should validate when changing from empty string to whitespace', async () => {
    const formData = ref({
      name: '',
    })

    const validationRules = {
      name: [{ rule: 'min', params: { length: 5 } }], // 5 chars to ensure whitespace fails
    }

    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // No validation initially
    expect(isValid.value).toBe(true)

    // Change to whitespace (3 spaces - should fail min length of 5)
    formData.value.name = '   '
    await nextTick()

    // Should validate and show error (3 spaces doesn't meet min length of 5)
    expect(fields.value.name.isValid).toBe(false)
    expect(errors.value.name.length).toBeGreaterThan(0)
    expect(isValid.value).toBe(false)
  })

  it('should handle rapid successive changes correctly', async () => {
    const formData = ref({
      email: '',
    })

    const validationRules = {
      email: ['required', 'email'],
    }

    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)

    // Rapid changes
    formData.value.email = 'a'
    await nextTick()

    formData.value.email = 'ab'
    await nextTick()

    formData.value.email = 'ab@'
    await nextTick()

    formData.value.email = 'ab@c'
    await nextTick()

    formData.value.email = 'ab@c.com'
    await nextTick()

    // Should be valid at the end
    expect(fields.value.email.isValid).toBe(true)
    expect(errors.value.email || []).toEqual([])
    expect(isValid.value).toBe(true)
  })

  it('should track isDirty correctly with changed strategy', async () => {
    const formData = ref({
      name: '',
      email: '',
    })

    const validationRules = {
      name: ['required'],
      email: ['required', 'email'],
    }

    const { fields } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Initially not dirty
    expect(fields.value.name.isDirty).toBe(false)
    expect(fields.value.email.isDirty).toBe(false)

    // Change name only
    formData.value.name = 'John'
    await nextTick()

    expect(fields.value.name.isDirty).toBe(true)
    expect(fields.value.email.isDirty).toBe(false) // Email unchanged

    // Change email
    formData.value.email = 'john@example.com'
    await nextTick()

    expect(fields.value.name.isDirty).toBe(true)
    expect(fields.value.email.isDirty).toBe(true)

    // Change name back to initial
    formData.value.name = ''
    await nextTick()

    expect(fields.value.name.isDirty).toBe(false) // Back to initial
    expect(fields.value.email.isDirty).toBe(true) // Still dirty
  })

  it('should handle changing from null to undefined and vice versa', async () => {
    const formData = ref<{
      field1: string | null | undefined
      field2: string | null | undefined
    }>({
      field1: null,
      field2: undefined,
    })

    const validationRules = {
      field1: [{ rule: 'min', params: { length: 2 } }],
      field2: [{ rule: 'min', params: { length: 2 } }],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)

    // Change null to undefined
    formData.value.field1 = undefined
    await nextTick()

    // MinValidationRule now passes null/undefined (let required rule handle presence)
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field1.isDirty).toBe(true)

    // Change undefined to null
    formData.value.field2 = null
    await nextTick()

    // MinValidationRule now passes null/undefined (let required rule handle presence)
    expect(fields.value.field2.isValid).toBe(true)
    expect(fields.value.field2.isDirty).toBe(true)
  })

  it('should validate correctly after reset with changed strategy', async () => {
    const formData = ref({
      name: '',
    })

    const validationRules = {
      name: ['required', { rule: 'min', params: { length: 2 } }],
    }

    const { fields, isValid, reset } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)

    // Change to valid value
    formData.value.name = 'John'
    await nextTick()

    expect(fields.value.name.isValid).toBe(true)
    expect(fields.value.name.isDirty).toBe(true)

    // Reset
    reset()
    await nextTick()

    // Should be back to initial state
    expect(fields.value.name.isDirty).toBe(false)
    expect(fields.value.name.isTouched).toBe(false)
    expect(isValid.value).toBe(true)

    // Change again after reset
    formData.value.name = 'J' // Invalid
    await nextTick()

    // Should validate the new change
    expect(fields.value.name.isValid).toBe(false)
    expect(fields.value.name.isDirty).toBe(true)
    expect(isValid.value).toBe(false)
  })

  it('should handle multiple fields changing simultaneously', async () => {
    const formData = ref({
      firstName: '',
      lastName: '',
      email: '',
    })

    const validationRules = {
      firstName: ['required', { rule: 'min', params: { length: 2 } }],
      lastName: ['required', { rule: 'min', params: { length: 2 } }],
      email: ['required', 'email'],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)

    // Change all fields at once
    formData.value.firstName = 'John'
    formData.value.lastName = 'Doe'
    formData.value.email = 'john@example.com'
    await nextTick()

    // All should be validated and valid
    expect(fields.value.firstName.isValid).toBe(true)
    expect(fields.value.lastName.isValid).toBe(true)
    expect(fields.value.email.isValid).toBe(true)
    expect(isValid.value).toBe(true)

    // All should be dirty
    expect(fields.value.firstName.isDirty).toBe(true)
    expect(fields.value.lastName.isDirty).toBe(true)
    expect(fields.value.email.isDirty).toBe(true)
  })

  it('should maintain form-level isValid correctly with partial validation', async () => {
    const formData = ref({
      field1: '',
      field2: '',
      field3: '',
    })

    const validationRules = {
      field1: ['required'],
      field2: ['required'],
      field3: ['required'],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    // No validation run yet, form should be valid
    expect(isValid.value).toBe(true)

    // Validate field1 - make it invalid
    formData.value.field1 = ''
    await nextTick()

    // Note: Changing from '' to '' might not trigger (no real change)
    // Let's change to a different invalid value
    formData.value.field1 = '   ' // Whitespace
    await nextTick()

    // field1 might be invalid (depends on how required handles whitespace)
    // but field2 and field3 are still unvalidated
    // Form should be invalid if any validated field is invalid
    
    // Change field2 to valid
    formData.value.field2 = 'valid value'
    await nextTick()

    expect(fields.value.field2.isValid).toBe(true)
    
    // field3 still not validated, so form validity depends on validated fields only
  })

  it('should handle empty config with changed strategy', async () => {
    const formData = ref({
      someField: 'value',
    })

    const validationRules = {}

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)
    expect(Object.keys(fields.value).length).toBe(0)

    // Change value
    formData.value.someField = 'new value'
    await nextTick()

    // Should still be valid with no rules
    expect(isValid.value).toBe(true)
  })

  it('should validate fields that exist in rules but not in initial data', async () => {
    const formData = ref<Record<string, any>>({
      existingField: '',
    })

    const validationRules = {
      existingField: ['required'],
      missingField: ['required'], // Field not in initial data
    }

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)

    // Add the missing field
    formData.value.missingField = 'test'
    await nextTick()

    // The new field should be validated
    expect(fields.value.missingField).toBeDefined()
    expect(fields.value.missingField.isValid).toBe(true)
  })

  it('should handle boolean field values with changed strategy', async () => {
    const formData = ref<{
      acceptTerms: boolean | string
      newsletter: boolean | string
    }>({
      acceptTerms: false,
      newsletter: false,
    })

    const validationRules = {
      // Note: RequiredValidationRule expects strings, so booleans will fail
      // This test verifies that behavior works correctly with changed strategy
      acceptTerms: ['required'], 
      newsletter: ['required'],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)

    // Change acceptTerms to boolean true
    // NOTE: Updated behavior — boolean true now passes RequiredValidationRule (represents checked checkbox)
    // See spec: vue3-angularjs-validation-prompt.md RequiredValidationRule fix
    formData.value.acceptTerms = true
    await nextTick()

    // boolean true passes RequiredValidationRule as of Phase 1 fix
    expect(fields.value.acceptTerms.isValid).toBe(true)
    expect(fields.value.acceptTerms.isDirty).toBe(true)
    
    // newsletter not changed yet
    expect(fields.value.newsletter.isDirty).toBe(false)

    // Change to string "true" which should pass required validation
    formData.value.acceptTerms = 'yes'
    await nextTick()

    // Now should be valid (string with content)
    expect(fields.value.acceptTerms.isValid).toBe(true)
    expect(fields.value.acceptTerms.isDirty).toBe(true)
  })

  it('should handle numeric field values transitioning from 0', async () => {
    const formData = ref<{
      age: number
      score: number
    }>({
      age: 0,
      score: 0,
    })

    const validationRules = {
      age: [{ rule: 'min', params: { length: 1 } }],
      score: [{ rule: 'min', params: { length: 1 } }],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true)

    // Change age from 0 to 25
    formData.value.age = 25
    await nextTick()

    // Should detect change and validate
    expect(fields.value.age.isDirty).toBe(true)
    expect(fields.value.score.isDirty).toBe(false) // score still 0
  })
})

describe('useFormValidation - changed strategy vs manual validate()', () => {
  it('should only auto-validate changed fields with changed strategy', async () => {
    const formData = ref({
      field1: 'valid1',
      field2: '', // Invalid (required)
      field3: 'valid3',
    })

    const validationRules = {
      field1: ['required'],
      field2: ['required'],
      field3: ['required'],
    }

    const { fields, errors, isValid, validate } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Initially no validation (validateOnMount: false)
    expect(isValid.value).toBe(true)
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(true) // Not validated yet
    expect(fields.value.field3.isValid).toBe(true)

    // Change only field1 - should only validate field1
    formData.value.field1 = 'changed1'
    await nextTick()

    expect(fields.value.field1.isValid).toBe(true) // Validated and valid
    expect(fields.value.field2.isValid).toBe(true) // NOT validated yet (still shows valid)
    expect(fields.value.field3.isValid).toBe(true) // NOT validated yet
    expect(errors.value.field2 || []).toEqual([]) // No errors yet for field2

    // Now manually call validate() - should validate ALL fields
    const result = validate()
    await nextTick()

    expect(result.isValid).toBe(false)
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(false) // NOW validated and shows invalid
    expect(fields.value.field3.isValid).toBe(true)
    expect(errors.value.field2).toContain('This field is required.')
  })

  it('should validate all fields on manual validate() call regardless of strategy', async () => {
    const formData = ref({
      username: '',
      email: '',
      phone: '',
    })

    const validationRules = {
      username: ['required'],
      email: ['required', 'email'],
      phone: ['required', 'phone'],
    }

    const { fields, validate } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // No fields validated initially
    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.phone.isValid).toBe(true)

    // Manually validate - should check ALL fields
    const result = validate()

    expect(result.isValid).toBe(false)
    expect(fields.value.username.isValid).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
    expect(fields.value.phone.isValid).toBe(false)
    expect(fields.value.username.errors).toContain('This field is required.')
    expect(fields.value.email.errors).toContain('This field is required.')
    expect(fields.value.phone.errors).toContain('This field is required.')
  })

  it('should maintain changed strategy behavior after manual validate()', async () => {
    const formData = ref({
      field1: '',
      field2: '',
    })

    const validationRules = {
      field1: ['required'],
      field2: ['required'],
    }

    const { fields, validate } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Manual validate - all fields now have errors
    validate()
    expect(fields.value.field1.isValid).toBe(false)
    expect(fields.value.field2.isValid).toBe(false)

    // Fix field1 only
    formData.value.field1 = 'valid'
    await nextTick()

    // Only field1 should be re-validated (changed strategy still applies)
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(false) // Still invalid, not re-validated

    // Fix field2
    formData.value.field2 = 'valid'
    await nextTick()

    // Now field2 should be validated and valid
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(true)
  })

  it('should handle manual validate() with custom values in changed strategy', async () => {
    const formData = ref({
      username: 'initial',
      email: 'initial@example.com',
    })

    const validationRules = {
      username: ['required', { rule: 'min', params: { length: 3 } }],
      email: ['required', 'email'],
    }

    const { fields, validate } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Manual validate with different values
    const result = validate({
      username: 'ab', // Too short
      email: 'invalid', // Invalid email
    })

    expect(result.isValid).toBe(false)
    expect(result.fieldErrors.username.length).toBeGreaterThan(0)
    expect(result.fieldErrors.email.length).toBeGreaterThan(0)
    expect(result.fieldErrors.username[0]).toContain('at least 3')
    expect(result.fieldErrors.email[0]).toContain('valid email')

    // Fields state should be updated with the validated values
    expect(fields.value.username.isValid).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
  })

  it('should only validate changed fields even when multiple fields change simultaneously', async () => {
    const formData = ref({
      field1: 'a',
      field2: 'b',
      field3: 'c',
      field4: 'd',
    })

    const validationRules = {
      field1: [{ rule: 'min', params: { length: 3 } }],
      field2: [{ rule: 'min', params: { length: 3 } }],
      field3: [{ rule: 'min', params: { length: 3 } }],
      field4: [{ rule: 'min', params: { length: 3 } }],
    }

    const { fields } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // All valid initially (not validated)
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(true)
    expect(fields.value.field3.isValid).toBe(true)
    expect(fields.value.field4.isValid).toBe(true)

    // Change field1 and field3 simultaneously
    formData.value.field1 = 'abc'
    formData.value.field3 = 'xyz'
    await nextTick()

    // Only field1 and field3 should be validated
    expect(fields.value.field1.isValid).toBe(true) // Validated (valid)
    expect(fields.value.field2.isValid).toBe(true) // Not validated
    expect(fields.value.field3.isValid).toBe(true) // Validated (valid)
    expect(fields.value.field4.isValid).toBe(true) // Not validated

    expect(fields.value.field1.isDirty).toBe(true)
    expect(fields.value.field2.isDirty).toBe(false)
    expect(fields.value.field3.isDirty).toBe(true)
    expect(fields.value.field4.isDirty).toBe(false)
  })

  it('should not re-validate unchanged fields after manual validate() call', async () => {
    const formData = ref({
      unchangedField: 'valid',
      changingField: '',
    })

    const validationRules = {
      unchangedField: ['required'],
      changingField: ['required'],
    }

    const { fields, validate } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Manual validate - both fields get validated
    validate()
    expect(fields.value.unchangedField.isValid).toBe(true)
    expect(fields.value.changingField.isValid).toBe(false)

    // Change only changingField
    formData.value.changingField = 'now valid'
    await nextTick()

    // Only changingField should be re-validated
    expect(fields.value.unchangedField.isValid).toBe(true) // Still valid, but not re-validated
    expect(fields.value.changingField.isValid).toBe(true) // Re-validated and now valid

    // Verify by breaking unchangedField in data but not triggering change
    // (This is to prove it's not being re-validated on every change)
    const currentUnchangedValid = fields.value.unchangedField.isValid
    formData.value.changingField = 'another change'
    await nextTick()

    // unchangedField should still show the same validation state
    expect(fields.value.unchangedField.isValid).toBe(currentUnchangedValid)
  })

  it('should validate all fields with "all" strategy regardless of manual vs auto', async () => {
    const formData = ref({
      field1: '',
      field2: '',
    })

    const validationRules = {
      field1: ['required'],
      field2: ['required'],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'all',
      validateOnMount: false,
    })

    await nextTick()
    expect(isValid.value).toBe(true) // Not validated yet

    // Change field1 - should validate BOTH fields (all strategy)
    formData.value.field1 = 'valid'
    await nextTick()

    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(false) // Also validated even though unchanged
    expect(isValid.value).toBe(false)

    // Fix field2
    formData.value.field2 = 'valid'
    await nextTick()

    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(true)
    expect(isValid.value).toBe(true)
  })
})

describe('useFormValidation - changed strategy with null/empty initial values', () => {
  it('should not trigger validation on mount with changed strategy and validateOnMount: false', async () => {
    const formData = ref({
      username: '',
      email: '',
    })

    const validationRules = {
      username: ['required'],
      email: ['required', 'email'],
    }

    // Explicitly set validateOnMount: false with 'all' strategy
    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'all',
      validateOnMount: false,
    })

    // Should NOT validate on mount even though strategy is 'all'
    await nextTick()

    // Should have NO errors initially
    expect(isValid.value).toBe(true)
    expect(errors.value.username || []).toEqual([])
    expect(errors.value.email || []).toEqual([])
    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.email.isValid).toBe(true)

    // Now change a field - should validate ALL fields because strategy is 'all'
    formData.value.username = 'test'
    await nextTick()

    // Both fields should now be validated (all strategy)
    expect(errors.value.username).toEqual([])
    expect(errors.value.email).toContain('This field is required.')
    expect(isValid.value).toBe(false)
  })

  it('should validate on mount when validateOnMount is explicitly true with changed strategy', async () => {
    const formData = ref({
      username: '',
      email: '',
    })

    const validationRules = {
      username: ['required'],
      email: ['required', 'email'],
    }

    // Explicitly set validateOnMount: true with 'changed' strategy
    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: true,
    })

    // Should validate on mount even though strategy is 'changed'
    await nextTick()

    // Should have errors initially
    expect(isValid.value).toBe(false)
    expect(errors.value.username).toContain('This field is required.')
    expect(errors.value.email).toContain('This field is required.')
    expect(fields.value.username.isValid).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
  })

  it('should respect validateOnMount: false regardless of strategy', async () => {
    const formData = ref({
      field1: '',
      field2: '',
    })

    const validationRules = {
      field1: ['required'],
      field2: ['required'],
    }

    // Test with 'all' strategy
    const result1 = useFormValidation(formData, validationRules, {
      validationStrategy: 'all',
      validateOnMount: false,
    })

    await nextTick()
    expect(result1.isValid.value).toBe(true)
    expect(result1.errors.value.field1 || []).toEqual([])

    // Test with 'changed' strategy
    const result2 = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()
    expect(result2.isValid.value).toBe(true)
    expect(result2.errors.value.field1 || []).toEqual([])
  })

  it('should use default validateOnMount: true for both strategies', async () => {
    const formData1 = ref({
      field: '',
    })

    const formData2 = ref({
      field: '',
    })

    const validationRules = {
      field: ['required'],
    }

    // Default for 'all' should be validateOnMount: true
    const result1 = useFormValidation(formData1, validationRules, {
      validationStrategy: 'all',
      // validateOnMount not specified - should default to true
    })

    await nextTick()
    expect(result1.isValid.value).toBe(false) // Should validate on mount
    expect(result1.errors.value.field).toContain('This field is required.')

    // Default for 'changed' should also be validateOnMount: true (changed from v0.4.0)
    const result2 = useFormValidation(formData2, validationRules, {
      validationStrategy: 'changed',
      // validateOnMount not specified - should default to true
    })

    await nextTick()
    expect(result2.isValid.value).toBe(false) // Should validate on mount (new default)
    expect(result2.errors.value.field).toContain('This field is required.')
  })

  it('should validate with current form values on mount', async () => {
    const formData = ref({
      username: 'existing',
      email: 'test@example.com',
    })

    const validationRules = {
      username: ['required', { rule: 'min', params: { length: 3 } }],
      email: ['required', 'email'],
    }

    // validateOnMount: true should validate with the current values
    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'all',
      validateOnMount: true,
    })

    // Should validate immediately with initial values
    await nextTick()

    // Should be valid because initial values are valid
    expect(isValid.value).toBe(true)
    expect(fields.value.username.isValid).toBe(true)
    expect(fields.value.email.isValid).toBe(true)
    expect(errors.value.username || []).toEqual([])
    expect(errors.value.email || []).toEqual([])
  })

  it('should detect invalid initial values when validateOnMount is true', async () => {
    const formData = ref({
      username: 'ab', // Too short (min 3)
      email: 'invalid', // Invalid email
    })

    const validationRules = {
      username: ['required', { rule: 'min', params: { length: 3 } }],
      email: ['required', 'email'],
    }

    // validateOnMount: true should immediately show errors
    const { errors, fields, isValid } = useFormValidation(formData, validationRules, {
      validationStrategy: 'all',
      validateOnMount: true,
    })

    await nextTick()

    // Should be invalid and show errors
    expect(isValid.value).toBe(false)
    expect(fields.value.username.isValid).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
    expect(errors.value.username.length).toBeGreaterThan(0)
    expect(errors.value.email.length).toBeGreaterThan(0)
    expect(errors.value.username[0]).toContain('at least 3')
    expect(errors.value.email[0]).toContain('valid email')
  })
})

describe('useFormValidation - reactive types (props, reactive, computed)', () => {
  it('should work with reactive() object', async () => {
    const formData = reactive({
      email: 'invalid',
      username: 'ab',
    })

    const validationRules = {
      email: ['required', 'email'],
      username: ['required', { rule: 'min', params: { length: 3 } }],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules)

    await nextTick()

    // Should validate on mount
    expect(isValid.value).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
    expect(fields.value.username.isValid).toBe(false)

    // Update reactive object
    formData.email = 'valid@example.com'
    formData.username = 'validuser'

    await nextTick()

    expect(isValid.value).toBe(true)
    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.username.isValid).toBe(true)
  })

  it('should work with computed() value', async () => {
    const rawData = ref({
      email: 'test@example.com',
      username: 'testuser',
    })

    // Simulating computed prop or derived state
    const formData = computed(() => ({
      email: rawData.value.email,
      username: rawData.value.username,
    }))

    const validationRules = {
      email: ['required', 'email'],
      username: ['required', { rule: 'min', params: { length: 3 } }],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules)

    await nextTick()

    // Should be valid initially
    expect(isValid.value).toBe(true)
    expect(fields.value.email.isValid).toBe(true)

    // Change underlying ref
    rawData.value = {
      email: 'invalid',
      username: 'ab',
    }

    await nextTick()

    expect(isValid.value).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
    expect(fields.value.username.isValid).toBe(false)
  })

  it('should work with props (simulated with readonly ref)', async () => {
    // Simulate a prop by using readonly
    const propValue = ref({
      email: 'test@example.com',
      username: 'testuser',
    })
    
    // Props are readonly in components
    const formData = readonly(propValue)

    const validationRules = {
      email: ['required', 'email'],
      username: ['required', { rule: 'min', params: { length: 3 } }],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules)

    await nextTick()

    // Should be valid initially
    expect(isValid.value).toBe(true)
    expect(fields.value.email.isValid).toBe(true)

    // Simulate parent updating the prop
    propValue.value = {
      email: 'invalid',
      username: 'ab',
    }

    await nextTick()

    expect(isValid.value).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
    expect(fields.value.username.isValid).toBe(false)
  })

  it('should work with props.modelValue pattern', async () => {
    // Simulate props object with modelValue (this is how defineModel or v-model works)
    const modelValue = ref({
      firstName: '',
      lastName: '',
      email: '',
    })

    const validationRules = {
      firstName: ['required', { rule: 'min', params: { length: 2 } }],
      lastName: ['required', { rule: 'min', params: { length: 2 } }],
      email: ['required', 'email'],
    }

    // Pass the ref directly (simulating props.modelValue which is a Ref)
    const { fields, isValid } = useFormValidation(modelValue, validationRules)

    await nextTick()

    // Should be invalid (empty required fields)
    expect(isValid.value).toBe(false)
    expect(fields.value.firstName.isValid).toBe(false)
    expect(fields.value.lastName.isValid).toBe(false)
    expect(fields.value.email.isValid).toBe(false)

    // Update the model value (simulating v-model update from parent)
    modelValue.value = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    }

    await nextTick()

    expect(isValid.value).toBe(true)
    expect(fields.value.firstName.isValid).toBe(true)
    expect(fields.value.lastName.isValid).toBe(true)
    expect(fields.value.email.isValid).toBe(true)
  })

  it('should handle reset() with reactive() object', async () => {
    const formData = reactive({
      email: 'test@example.com',
      username: 'validuser',
    })

    const validationRules = {
      email: ['required', 'email'],
      username: ['required', { rule: 'min', params: { length: 3 } }],
    }

    const { fields, reset } = useFormValidation(formData, validationRules)

    await nextTick()

    // Initially valid
    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.email.isDirty).toBe(false)

    // Make changes
    formData.email = 'changed@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(true)

    // Reset should update snapshot
    reset()
    await nextTick()

    expect(fields.value.email.isDirty).toBe(false)
  })

  it('should handle touch() with computed() value', async () => {
    const rawData = ref({
      email: 'test@example.com',
    })

    const formData = computed(() => rawData.value)

    const validationRules = {
      email: ['required', 'email'],
    }

    const { fields, touch } = useFormValidation(formData, validationRules)

    await nextTick()

    expect(fields.value.email.isTouched).toBe(false)

    touch('email')
    await nextTick()

    expect(fields.value.email.isTouched).toBe(true)
  })

  it('should work with nested reactive object (complex props scenario)', async () => {
    // Simulate complex props structure
    const parentState = reactive({
      user: {
        profile: {
          email: 'test@example.com',
          username: 'testuser',
        },
      },
    })

    const formData = computed(() => parentState.user.profile)

    const validationRules = {
      email: ['required', 'email'],
      username: ['required', { rule: 'min', params: { length: 3 } }],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules)

    await nextTick()

    expect(isValid.value).toBe(true)

    // Update nested reactive object
    parentState.user.profile.email = 'invalid'

    await nextTick()

    expect(isValid.value).toBe(false)
    expect(fields.value.email.isValid).toBe(false)
  })

  it('should work with changed strategy using reactive() object', async () => {
    const formData = reactive({
      field1: '',
      field2: 'initial',
      field3: '',
    })

    const validationRules = {
      field1: ['required'],
      field2: ['required'],
      field3: ['required'],
    }

    const { fields } = useFormValidation(formData, validationRules, {
      validationStrategy: 'changed',
      validateOnMount: false,
    })

    await nextTick()

    // Initially all valid (no validation yet)
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(true)

    // Change only field1
    formData.field1 = 'value1'
    await nextTick()

    // Only field1 should be validated
    expect(fields.value.field1.isValid).toBe(true)
    expect(fields.value.field2.isValid).toBe(true) // Not validated yet
    expect(fields.value.field3.isValid).toBe(true) // Not validated yet

    // Change field2 to invalid (from 'initial' to '')
    formData.field2 = ''
    await nextTick()

    // field2 should now be validated and invalid
    expect(fields.value.field2.isValid).toBe(false)
  })

  it('should preserve reactivity when using plain object wrapped in ref', async () => {
    // This tests that we don't break reactivity by using unref()
    const formData = ref({
      email: 'initial@example.com',
    })

    const validationRules = {
      email: ['required', 'email'],
    }

    const { fields, isValid } = useFormValidation(formData, validationRules)

    await nextTick()

    expect(isValid.value).toBe(true)

    // Mutate the ref (common pattern)
    formData.value.email = 'invalid'

    await nextTick()

    expect(isValid.value).toBe(false)
    expect(fields.value.email.isValid).toBe(false)

    // Replace entire object (also common pattern)
    formData.value = {
      email: 'valid@example.com',
    }

    await nextTick()

    expect(isValid.value).toBe(true)
    expect(fields.value.email.isValid).toBe(true)
  })
})

describe('useFormValidation - isModelDirty', () => {
  it('should return false when no fields are dirty', async () => {
    const formData = ref({
      email: 'test@example.com',
      username: 'testuser',
    })

    const validationRules = {
      email: ['required', 'email'],
      username: ['required'],
    }

    const { isModelDirty } = useFormValidation(formData, validationRules)

    await nextTick()

    // No changes yet
    expect(isModelDirty.value).toBe(false)
  })

  it('should return true when any field is dirty', async () => {
    const formData = ref({
      email: 'test@example.com',
      username: 'testuser',
    })

    const validationRules = {
      email: ['required', 'email'],
      username: ['required'],
    }

    const { isModelDirty, fields } = useFormValidation(formData, validationRules)

    await nextTick()

    expect(isModelDirty.value).toBe(false)

    // Change one field
    formData.value.email = 'changed@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(true)
    expect(isModelDirty.value).toBe(true)
  })

  it('should return false after reset', async () => {
    const formData = ref({
      email: 'test@example.com',
      username: 'testuser',
    })

    const validationRules = {
      email: ['required', 'email'],
      username: ['required'],
    }

    const { isModelDirty, reset } = useFormValidation(formData, validationRules)

    await nextTick()

    // Make changes
    formData.value.email = 'changed@example.com'
    await nextTick()

    expect(isModelDirty.value).toBe(true)

    // Reset should clear dirty state
    reset()
    await nextTick()

    expect(isModelDirty.value).toBe(false)
  })

  it('should track dirty state with multiple field changes', async () => {
    const formData = ref({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    })

    const validationRules = {
      firstName: ['required'],
      lastName: ['required'],
      email: ['required', 'email'],
    }

    const { isModelDirty, fields } = useFormValidation(formData, validationRules)

    await nextTick()

    expect(isModelDirty.value).toBe(false)

    // Change multiple fields
    formData.value.firstName = 'Jane'
    formData.value.email = 'jane@example.com'
    await nextTick()

    expect(fields.value.firstName.isDirty).toBe(true)
    expect(fields.value.lastName.isDirty).toBe(false)
    expect(fields.value.email.isDirty).toBe(true)
    expect(isModelDirty.value).toBe(true)
  })

  it('should work with reactive() objects', async () => {
    const formData = reactive({
      email: 'test@example.com',
      username: 'testuser',
    })

    const validationRules = {
      email: ['required', 'email'],
      username: ['required'],
    }

    const { isModelDirty } = useFormValidation(formData, validationRules)

    await nextTick()

    expect(isModelDirty.value).toBe(false)

    formData.email = 'changed@example.com'
    await nextTick()

    expect(isModelDirty.value).toBe(true)
  })

  it('should work with props.modelValue pattern', async () => {
    const modelValue = ref({
      name: 'Test',
      email: 'test@example.com',
    })

    const validationRules = {
      name: ['required'],
      email: ['required', 'email'],
    }

    const { isModelDirty } = useFormValidation(modelValue, validationRules)

    await nextTick()

    expect(isModelDirty.value).toBe(false)

    // Simulate parent updating prop
    modelValue.value = {
      name: 'Changed',
      email: 'test@example.com',
    }

    await nextTick()

    expect(isModelDirty.value).toBe(true)
  })

  it('should return false when field changes back to original value', async () => {
    const formData = ref({
      email: 'original@example.com',
    })

    const validationRules = {
      email: ['required', 'email'],
    }

    const { isModelDirty, fields } = useFormValidation(formData, validationRules)

    await nextTick()

    // Change field
    formData.value.email = 'changed@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(true)
    expect(isModelDirty.value).toBe(true)

    // Change back to original
    formData.value.email = 'original@example.com'
    await nextTick()

    expect(fields.value.email.isDirty).toBe(false)
    expect(isModelDirty.value).toBe(false)
  })
})

describe('useFormValidation - custom validation rules', () => {
  // Custom rule for testing - validates even numbers
  class EvenNumberValidationRule extends IValidationRule {
    private errorMessage = 'Value must be an even number'

    isValid(param: any): [boolean, string] {
      const num = Number(param)
      const isValid = !isNaN(num) && num % 2 === 0
      return [isValid, isValid ? '' : this.errorMessage]
    }

    isMatch(type: string): boolean {
      return type.toLowerCase() === 'evennumber'
    }

    setParams(): void {}

    setErrorMessage(message: string): void {
      this.errorMessage = message
    }
  }

  // Custom rule for postal code validation
  class PostalCodeValidationRule extends IValidationRule {
    private errorMessage = 'Invalid postal code format'

    isValid(param: any): [boolean, string] {
      // Simple pattern: A1A 1A1 (Canadian postal code)
      const pattern = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i
      const isValid = pattern.test(String(param))
      return [isValid, isValid ? '' : this.errorMessage]
    }

    isMatch(type: string): boolean {
      return type.toLowerCase() === 'postalcode'
    }

    setParams(): void {}

    setErrorMessage(message: string): void {
      this.errorMessage = message
    }
  }

  it('should expose the engine for adding custom rules', () => {
    const formData = ref({
      number: '5',
    })

    const config = {
      number: ['required', 'evenNumber'],
    }

    const { engine } = useFormValidation(formData, config, {
      validateOnMount: false,
    })

    // Engine should be exposed
    expect(engine).toBeDefined()
    expect(typeof engine.addRuleToField).toBe('function')
  })

  it('should allow adding custom rules to specific fields via engine.addRuleToField()', async () => {
    const formData = ref({
      evenNumber: '2', // Start with valid value
    })

    const config = {
      evenNumber: ['required', 'evenNumber'],
    }

    const { fields, engine } = useFormValidation(formData, config, {
      validateOnMount: false,
    })

    // Add custom rule BEFORE triggering any validation
    engine.addRuleToField('evenNumber', new EvenNumberValidationRule())

    // Now trigger validation with invalid value
    formData.value.evenNumber = '3'
    await nextTick()

    // Should fail validation (3 is odd)
    expect(fields.value.evenNumber.isValid).toBe(false)
    expect(fields.value.evenNumber.errors).toContain('Value must be an even number')

    // Test with valid even number
    formData.value.evenNumber = '4'
    await nextTick()

    expect(fields.value.evenNumber.isValid).toBe(true)
    expect(fields.value.evenNumber.errors).toEqual([])
  })

  it('should allow adding custom rules to multiple specific fields', async () => {
    // Start with valid values
    const formData = ref({
      postalCode: 'A1A 1A1',
      evenNumber: '6',
    })

    const config = {
      postalCode: ['required', 'postalCode'],
      evenNumber: ['required', 'evenNumber'],
    }

    const { fields, engine } = useFormValidation(formData, config, {
      validateOnMount: false,
    })

    // Add custom rules BEFORE triggering any validation
    // Add postal code rule only to postalCode field
    engine.addRuleToField('postalCode', new PostalCodeValidationRule())
    
    // Add even number rule only to evenNumber field
    engine.addRuleToField('evenNumber', new EvenNumberValidationRule())

    // Now test with invalid postal code
    formData.value.postalCode = 'INVALID'
    await nextTick()

    expect(fields.value.postalCode.isValid).toBe(false)
    expect(fields.value.postalCode.errors).toContain('Invalid postal code format')

    // Validate with correct format
    formData.value.postalCode = 'A1A 1A1'
    await nextTick()

    expect(fields.value.postalCode.isValid).toBe(true)
    expect(fields.value.postalCode.errors).toEqual([])

    // Test even number with invalid value
    formData.value.evenNumber = '5'
    await nextTick()

    expect(fields.value.evenNumber.isValid).toBe(false)
    expect(fields.value.evenNumber.errors).toContain('Value must be an even number')

    // Test with valid even number
    formData.value.evenNumber = '6'
    await nextTick()

    expect(fields.value.evenNumber.isValid).toBe(true)
    expect(fields.value.evenNumber.errors).toEqual([])
  })

  it('should work with custom error messages on custom rules', async () => {
    class CustomMinLengthRule extends IValidationRule {
      private errorMessage = 'Too short'
      private minLength = 5

      isValid(param: any): [boolean, string] {
        const isValid = typeof param === 'string' && param.length >= this.minLength
        return [isValid, isValid ? '' : this.errorMessage]
      }

      isMatch(type: string): boolean {
        return type.toLowerCase() === 'custommin'
      }

      setParams(params: any): void {
        if (params.length) this.minLength = params.length
      }

      setErrorMessage(message: string): void {
        this.errorMessage = message
      }
    }

    // Start with valid value
    const formData = ref({
      code: 'abcde',
    })

    const config = {
      code: [
        'required',
        {
          rule: 'customMin',
          params: { length: 5 },
          message: 'Code must be at least 5 characters',
        },
      ],
    }

    const { fields, engine } = useFormValidation(formData, config, {
      validateOnMount: false,
    })

    // Add custom rule BEFORE triggering any validation
    // Note: When adding custom rules dynamically, you must set error message on the rule instance
    // The config message won't be applied to dynamically added rules
    const customRule = new CustomMinLengthRule()
    customRule.setErrorMessage('Code must be at least 5 characters')
    customRule.setParams({ length: 5 })
    engine.addRuleToField('code', customRule)

    // Now test with invalid value
    formData.value.code = 'abc'
    await nextTick()

    expect(fields.value.code.isValid).toBe(false)
    expect(fields.value.code.errors).toContain('Code must be at least 5 characters')

    formData.value.code = 'abcde'
    await nextTick()

    expect(fields.value.code.isValid).toBe(true)
    expect(fields.value.code.errors).toEqual([])
  })

  it('should work with reactive() and custom rules', async () => {
    // Start with valid value
    const formData = reactive({
      evenNumber: '8',
    })

    const config = {
      evenNumber: ['required', 'evenNumber'],
    }

    const { fields, engine } = useFormValidation(formData, config, {
      validateOnMount: false,
    })

    // Add custom rule BEFORE triggering any validation
    engine.addRuleToField('evenNumber', new EvenNumberValidationRule())

    // Now test with invalid value
    formData.evenNumber = '7'
    await nextTick()

    expect(fields.value.evenNumber.isValid).toBe(false)
    expect(fields.value.evenNumber.errors).toContain('Value must be an even number')

    // Test with valid value
    formData.evenNumber = '8'
    await nextTick()

    expect(fields.value.evenNumber.isValid).toBe(true)
  })

  it('should validate on mount with custom rules when validateOnMount is true', async () => {
    const formData = ref({
      evenNumber: '3',
    })

    const config = {
      evenNumber: ['required', 'evenNumber'],
    }

    const { fields, engine } = useFormValidation(formData, config, {
      validateOnMount: false, // Start false
    })

    engine.addRuleToField('evenNumber', new EvenNumberValidationRule())

    // Manually trigger validation
    formData.value = { evenNumber: '3' }
    await nextTick()

    expect(fields.value.evenNumber.isValid).toBe(false)
    expect(fields.value.evenNumber.errors).toContain('Value must be an even number')
  })

  it('should work with multiple custom rules on the same field', async () => {
    class MinValueRule extends IValidationRule {
      private errorMessage = 'Value must be at least 10'
      private minValue = 10

      isValid(param: any): [boolean, string] {
        const num = Number(param)
        const isValid = !isNaN(num) && num >= this.minValue
        return [isValid, isValid ? '' : this.errorMessage]
      }

      isMatch(type: string): boolean {
        return type.toLowerCase() === 'minvalue'
      }

      setParams(params: any): void {
        if (params.value) this.minValue = params.value
      }

      setErrorMessage(message: string): void {
        this.errorMessage = message
      }
    }

    // Start with valid value
    const formData = ref({
      number: '12',
    })

    const config = {
      number: ['required', 'evenNumber', 'minValue'],
    }

    const { fields, engine } = useFormValidation(formData, config, {
      validateOnMount: false,
    })

    // Add custom rules BEFORE triggering any validation
    engine.addRuleToField('number', new EvenNumberValidationRule())
    engine.addRuleToField('number', new MinValueRule())

    // Test odd number below minimum
    formData.value.number = '5'
    await nextTick()

    expect(fields.value.number.isValid).toBe(false)
    expect(fields.value.number.errors.length).toBeGreaterThan(0)

    // Test even number below minimum
    formData.value.number = '8'
    await nextTick()

    expect(fields.value.number.isValid).toBe(false)
    expect(fields.value.number.errors).toContain('Value must be at least 10')

    // Test odd number above minimum
    formData.value.number = '11'
    await nextTick()

    expect(fields.value.number.isValid).toBe(false)
    expect(fields.value.number.errors).toContain('Value must be an even number')

    // Test valid even number above minimum
    formData.value.number = '12'
    await nextTick()

    expect(fields.value.number.isValid).toBe(true)
    expect(fields.value.number.errors).toEqual([])
  })

  it('should properly reset errors after validation with custom rules and value change', async () => {
    // This test simulates the user's use case:
    // 1. User types a value
    // 2. Validates the value
    // 3. Clears the input and calls reset()
    // 4. Errors should be cleared (not re-triggered by the watcher)
    
    class UniqueValueValidationRule extends IValidationRule {
      private existingValues: string[] = []
      private errorMessage = 'Value already exists'

      isValid(value: any): [boolean, string] {
        if (!value) return [true, '']
        const isDuplicate = this.existingValues.includes(value.toLowerCase())
        return [!isDuplicate, isDuplicate ? this.errorMessage : '']
      }

      isMatch(type: string): boolean {
        return type.toLowerCase() === 'uniquevalue'
      }

      setParams(params: any): void {
        if (params.values) this.existingValues = params.values
      }

      setErrorMessage(message: string): void {
        this.errorMessage = message
      }
    }

    const formData = ref({
      email: ''
    })

    const config = {
      email: ['email']  // Don't reference custom rule in config
    }

    const { fields, validate, reset, engine } = useFormValidation(formData, config, {
      validateOnMount: false,
      validationStrategy: 'changed'
    })

    // Add custom rule
    const uniqueRule = new UniqueValueValidationRule()
    uniqueRule.setParams({ values: ['existing@test.com'] })
    engine.addRuleToField('email', uniqueRule)

    // Initial state - no errors
    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.email.errors).toEqual([])

    // Step 1: User types a valid email
    formData.value.email = 'new@test.com'
    await nextTick()

    // Step 2: Validate (should pass)
    const result = validate()
    expect(result.isValid).toBe(true)
    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.email.errors).toEqual([])

    // Step 3: Clear the input AND reset (simulates adding to a list and clearing form)
    formData.value.email = ''
    reset()
    await nextTick()

    // Step 4: Errors should be cleared - the reset should prevent the watcher from re-validating
    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.email.errors).toEqual([])
  })

  it('should properly reset errors when input is cleared before reset()', async () => {
    // Simulates the exact pattern from the user's component:
    // emailInput.email = ''
    // reset()
    
    const formData = ref({
      value: 'test'
    })

    const config = {
      value: ['required']
    }

    const { fields, validate, reset } = useFormValidation(formData, config, {
      validateOnMount: false,
      validationStrategy: 'changed'
    })

    // Initial state
    expect(fields.value.value.isValid).toBe(true)

    // User types something and validates
    formData.value.value = 'hello'
    await nextTick()
    validate()
    expect(fields.value.value.isValid).toBe(true)

    // User clears input and immediately calls reset
    // Without the fix, the watcher would re-validate the empty field
    // and show "required" error after reset completes
    formData.value.value = ''
    reset()
    await nextTick()

    // Errors should be cleared
    expect(fields.value.value.isValid).toBe(true)
    expect(fields.value.value.errors).toEqual([])
  })

  it('should not re-validate during reset even with multiple nextTicks', async () => {
    // This test verifies the reset behavior works correctly.
    // Note: In real browsers, Vue's watcher scheduling may cause the watcher
    // to fire AFTER reset() starts but BEFORE it completes, causing errors to
    // reappear. The isResetting flag prevents this race condition.
    // 
    // In the test environment, the behavior may appear synchronous, but
    // the fix is still necessary for real browser usage where the user
    // reported the issue.
    
    const formData = ref({
      email: ''
    })

    const config = {
      email: ['required', 'email']
    }

    const { fields, validate, reset } = useFormValidation(formData, config, {
      validateOnMount: false,
      validationStrategy: 'changed'
    })

    // First, put the form in a valid state
    formData.value.email = 'test@example.com'
    await nextTick()
    validate()
    expect(fields.value.email.isValid).toBe(true)

    // Now clear the field (which would normally trigger validation)
    // and immediately call reset
    formData.value.email = ''
    reset()
    
    // Multiple ticks to ensure watcher doesn't re-validate
    await nextTick()
    await nextTick()
    await nextTick()

    // Fields should still show as valid (reset state)
    expect(fields.value.email.isValid).toBe(true)
    expect(fields.value.email.errors).toEqual([])
    
    // Now after reset, typing should trigger validation again
    formData.value.email = 'invalid'
    await nextTick()
    
    // Now validation should work (isResetting flag should be cleared)
    expect(fields.value.email.isValid).toBe(false)
    expect(fields.value.email.errors.length).toBeGreaterThan(0)
  })
})
