import { Ref, ref, watch } from 'vue'
import ValidationEngine from '../rules/ValidationEngine'
import IValidationRule from '../rules/IValidationRule'

export type UseValidationRule = string | { rule: string; params: any; message?: string } | IValidationRule

export interface UseValidationResult {
  errors: Ref<string[]>
  isValid: Ref<boolean>
  validate: (value?: any) => boolean
}

export default function useValidation(
  value: Ref<any>,
  rules: UseValidationRule[]
): UseValidationResult {
  const engine = new ValidationEngine(rules)
  const errors = ref<string[]>([])
  const isValid = ref(true)

  const validate = (val: any = value.value): boolean => {
    const result = engine.validateValue(val)
    errors.value = result.errors
    isValid.value = result.isValid
    return result.isValid
  }

  watch(
    value,
    (val) => {
      validate(val)
    },
    { immediate: true }
  )

  return {
    errors,
    isValid,
    validate,
  }
}
