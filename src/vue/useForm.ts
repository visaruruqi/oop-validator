import { onMounted, onUnmounted, Ref } from 'vue'
import useFormValidation from './useFormValidation'
import type { UseFormValidationOptions } from './useFormValidation'
import { formRegistry } from './directives/registry'

export type UseFormResult = ReturnType<typeof useFormValidation> & {
  [key: string]: any
}

export function useForm(
  name: string,
  formData: Ref<Record<string, any>> | Record<string, any>,
  options?: UseFormValidationOptions
): UseFormResult {
  const result = useFormValidation(formData, {}, { validateOnMount: false, ...options })

  onMounted(() => {
    const formEl = document.querySelector(`form[name="${name}"]`) as HTMLFormElement | null
    if (formEl) {
      formRegistry.set(formEl, formInstance)
    }
  })

  onUnmounted(() => {
    const formEl = document.querySelector(`form[name="${name}"]`) as HTMLFormElement | null
    if (formEl) {
      formRegistry.delete(formEl)
    }
  })

  const formInstance: UseFormResult = new Proxy(result as any, {
    get(target, prop: string) {
      if (prop.startsWith('$') || prop === 'engine' || prop === 'cssClasses' || prop === 'fields'
          || prop === 'isValid' || prop === 'isModelDirty' || prop === 'summary' || prop === 'validate'
          || prop === 'reset' || prop === 'touch' || prop === 'touchAll' || prop === 'errors'
          || prop === 'getFieldErrors' || prop === 'isFieldValid' || prop === 'registerRule'
          || prop === 'unregisterRule' || prop === 'registerField' || prop === 'unregisterField') {
        return (target as any)[prop]
      }
      // Field access: form.email → form.fields.value.email
      if (target.fields?.value?.[prop as string] !== undefined) {
        return target.fields.value[prop as string]
      }
      return (target as any)[prop]
    }
  }) as UseFormResult

  return formInstance
}
