import { Ref, ref, watch, computed } from 'vue'
import FormValidationEngine, { FormConfig, FormValidationResult } from '../form/FormValidationEngine'

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
  config: FormConfig
): UseFormValidationResult {
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

  const getFieldErrors = (field: string): Ref<string[]> => {
    return computed(() => errors.value[field] || [])
  }

  const isFieldValid = (field: string): Ref<boolean> => {
    return computed(() => {
      const fieldErrors = errors.value[field] || []
      return fieldErrors.length === 0
    })
  }

  watch(
    formValues,
    (values) => {
      validate(values)
    },
    { deep: true, immediate: true }
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