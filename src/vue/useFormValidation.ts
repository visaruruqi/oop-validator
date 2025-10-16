import { Ref, ref, watch, computed, unref } from 'vue'
import FormValidationEngine, { FormConfig, FormValidationResult } from '../form/FormValidationEngine'

export interface UseFormValidationOptions {
  /**
   * Validation strategy:
   * - 'all': Validates all fields when any field changes (default, safest for cross-field validation)
   * - 'changed': Only validates fields that changed (better performance, but may miss cross-field dependencies)
   */
  validationStrategy?: 'all' | 'changed'
  
  /**
   * Whether to validate immediately on mount:
   * - true: Runs validation immediately when composable is created (shows all errors right away)
   * - false: Waits for user interaction before validating
   * 
   * Default: true
   */
  validateOnMount?: boolean
}

export interface FieldState {
  isValid: boolean
  errors: string[]
  isDirty: boolean
  isTouched: boolean
}

export interface UseFormValidationResult {
  // NEW: Unified fields API (recommended)
  fields: Ref<Record<string, FieldState>>
  
  // Form-level
  isValid: Ref<boolean>
  summary: Ref<string[]>
  validate: (values?: Record<string, any>) => FormValidationResult
  reset: () => void
  
  // Touch tracking helpers
  touch: (fieldName: string) => void
  touchAll: () => void
  
  // DEPRECATED: Keep for backward compatibility
  errors: Ref<Record<string, string[]>>
  getFieldErrors: (field: string) => Ref<string[]>
  isFieldValid: (field: string) => Ref<boolean>
}

export default function useFormValidation(
  formValues: Ref<Record<string, any>> | Record<string, any>,
  config: FormConfig,
  options: UseFormValidationOptions = {}
): UseFormValidationResult {
  const { validationStrategy = 'all', validateOnMount = true } = options
  
  // Use the validateOnMount option value directly (defaults to true)
  const shouldValidateOnMount: boolean = validateOnMount
  
  const engine = new FormValidationEngine(config)
  
  // Store initial values for isDirty tracking
  const initialValues = ref({ ...unref(formValues) })
  
  // NEW: Unified fields API
  const fields = ref<Record<string, FieldState>>({})
  
  // OLD API (deprecated but kept for backward compatibility)
  const errors = ref<Record<string, string[]>>({})
  const summary = ref<string[]>([])
  const isValid = ref(true)

  const validate = (values: Record<string, any> = unref(formValues)): FormValidationResult => {
    const result = engine.validate(values)
    
    // Update old API (deprecated)
    errors.value = result.fieldErrors
    summary.value = result.summary
    isValid.value = result.isValid
    
    // NEW: Update unified fields API
    const newFields: Record<string, FieldState> = {}
    Object.keys(config).forEach((fieldName) => {
      const existingField = fields.value[fieldName]
      newFields[fieldName] = {
        isValid: !result.fieldErrors[fieldName] || result.fieldErrors[fieldName].length === 0,
        errors: result.fieldErrors[fieldName] || [],
        isDirty: values[fieldName] !== initialValues.value[fieldName],
        isTouched: existingField?.isTouched || false // Preserve isTouched state
      }
    })
    fields.value = newFields
    
    return result
  }
  
  // NEW: Reset function
  const reset = () => {
    // Reset to initial values
    initialValues.value = { ...unref(formValues) }
    
    // Reset fields state
    const resetFields: Record<string, FieldState> = {}
    Object.keys(config).forEach((fieldName) => {
      resetFields[fieldName] = {
        isValid: true,
        errors: [],
        isDirty: false,
        isTouched: false
      }
    })
    fields.value = resetFields
    
    // Reset old API (deprecated)
    errors.value = {}
    isValid.value = true
    summary.value = []
  }
  
  // NEW: Touch a specific field
  const touch = (fieldName: string) => {
    if (fields.value[fieldName]) {
      fields.value[fieldName].isTouched = true
    }
  }
  
  // NEW: Touch all fields (useful for showing all errors on submit attempt)
  const touchAll = () => {
    const updatedFields = { ...fields.value }
    Object.keys(updatedFields).forEach((fieldName) => {
      updatedFields[fieldName] = {
        ...updatedFields[fieldName],
        isTouched: true
      }
    })
    fields.value = updatedFields
  }

  // Initial validation
  // By default: validates on mount (validateOnMount defaults to true)
  // Can be overridden by setting validateOnMount: false
  if (shouldValidateOnMount) {
    validate(unref(formValues))
  } else {
    // Initialize all fields as valid (no errors yet)
    const initialFields: Record<string, FieldState> = {}
    
    Object.keys(config).forEach((fieldName) => {
      initialFields[fieldName] = {
        isValid: true,
        errors: [],
        isDirty: false,
        isTouched: false
      }
    })
    
    fields.value = initialFields
  }

  const getFieldErrors = (field: string): Ref<string[]> => {
    return computed(() => errors.value[field] || [])
  }

  const isFieldValid = (field: string): Ref<boolean> => {
    return computed(() => {
      const fieldErrors = errors.value[field] || []
      return fieldErrors.length === 0
    })
  }

  // Track previous values for change detection
  // Vue's watch with deep:true doesn't provide proper oldValues snapshot for objects
  const previousValues = ref({ ...unref(formValues) })

  watch(
    formValues,
    (newValues: Record<string, any>) => {
      if (validationStrategy === 'changed') {
        // Optimized: Only validate fields that changed
        const changedFields = Object.keys(newValues).filter(
          (key) => newValues[key] !== previousValues.value[key]
        )

        if (changedFields.length === 0) {
          return // No changes detected
        }

        // Create new errors object to ensure reactivity
        const updatedErrors: Record<string, string[]> = {}
        const updatedFields: Record<string, FieldState> = {}
        
        // Copy existing errors for unchanged fields
        Object.keys(config).forEach((field) => {
          if (changedFields.includes(field)) {
            // Validate the changed field
            const result = engine.validateField(field, newValues[field], newValues)
            updatedErrors[field] = result.errors
            
            // Update fields API
            updatedFields[field] = {
              isValid: result.errors.length === 0,
              errors: result.errors,
              isDirty: newValues[field] !== initialValues.value[field],
              isTouched: fields.value[field]?.isTouched || false
            }
          } else {
            // Keep existing errors for unchanged fields
            updatedErrors[field] = errors.value[field] || []
            
            // Keep existing field state
            updatedFields[field] = fields.value[field] || {
              isValid: true,
              errors: [],
              isDirty: false,
              isTouched: false
            }
          }
        })
        
        // Update errors with new object (triggers reactivity)
        errors.value = updatedErrors
        fields.value = updatedFields

        // Recalculate summary and isValid based on all current errors
        const allErrors: string[] = []
        Object.keys(config).forEach((field) => {
          const fieldErrors = updatedErrors[field] || []
          if (fieldErrors.length > 0) {
            allErrors.push(...fieldErrors.map(err => `${field}: ${err}`))
          }
        })
        
        summary.value = allErrors
        isValid.value = allErrors.length === 0

        // Update previous values for next comparison
        previousValues.value = { ...newValues }
      } else {
        // Default: Validate all fields (safest for cross-field validation)
        validate(newValues)
      }
    },
    { deep: true }
  )

  return {
    // NEW: Clean unified API
    fields,
    reset,
    touch,
    touchAll,
    
    // Form-level
    isValid,
    summary,
    validate,
    
    // DEPRECATED: Keep for backward compatibility
    errors,
    getFieldErrors,
    isFieldValid,
  }
}