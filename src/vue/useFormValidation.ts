import { Ref, ref, watch, computed } from 'vue'
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
   * Default: true for 'all' strategy, false for 'changed' strategy
   */
  validateOnMount?: boolean
}

export interface UseFormValidationResult {
  errors: Ref<Record<string, string[]>>
  isValid: Ref<boolean>
  summary: Ref<string[]>
  validate: (values?: Record<string, any>) => FormValidationResult
  getFieldErrors: (field: string) => Ref<string[]>
  isFieldValid: (field: string) => Ref<boolean>
}

export default function useFormValidation(
  formValues: Ref<Record<string, any>>,
  config: FormConfig,
  options: UseFormValidationOptions = {}
): UseFormValidationResult {
  const { validationStrategy = 'all', validateOnMount } = options
  
  // Smart default for validateOnMount based on strategy
  const shouldValidateOnMount = validateOnMount ?? (validationStrategy === 'all')
  
  const engine = new FormValidationEngine(config)
  const errors = ref<Record<string, string[]>>({})
  const summary = ref<string[]>([])
  const isValid = ref(true)

  const validate = (values: Record<string, any> = formValues.value): FormValidationResult => {
    const result = engine.validate(values)
    errors.value = result.fieldErrors
    summary.value = result.summary
    isValid.value = result.isValid
    return result
  }

  // Initial validation
  // By default: validate on mount with 'all' strategy, skip with 'changed' strategy
  // Can be overridden with validateOnMount option
  if (shouldValidateOnMount) {
    validate()
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
  const previousValues = ref({ ...formValues.value })

  watch(
    formValues,
    (newValues) => {
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
        
        // Copy existing errors for unchanged fields
        Object.keys(config).forEach((field) => {
          if (changedFields.includes(field)) {
            // Validate the changed field
            const result = engine.validateField(field, newValues[field], newValues)
            updatedErrors[field] = result.errors
          } else {
            // Keep existing errors for unchanged fields
            updatedErrors[field] = errors.value[field] || []
          }
        })
        
        // Update errors with new object (triggers reactivity)
        errors.value = updatedErrors

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
    errors,
    isValid,
    summary,
    validate,
    getFieldErrors,
    isFieldValid,
  }
}