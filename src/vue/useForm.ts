import { onMounted, onUnmounted, Ref } from 'vue'
import useFormValidation from './useFormValidation'
import type { UseFormValidationOptions } from './useFormValidation'
import { formRegistry, formNameRegistry } from './directives/registry'

export type UseFormResult = ReturnType<typeof useFormValidation> & {
  [key: string]: any
}

export function useForm(
  name: string,
  formData: Ref<Record<string, any>> | Record<string, any>,
  options?: UseFormValidationOptions
): UseFormResult {
  const result = useFormValidation(formData, {}, { validateOnMount: false, ...options })

  // Captured in onMounted so onUnmounted doesn't have to re-query a possibly
  // detached DOM (container.remove() runs before onUnmounted in tests and SSR).
  let mountedFormEl: HTMLFormElement | null = null

  onMounted(() => {
    mountedFormEl = document.querySelector(`form[name="${name}"]`) as HTMLFormElement | null
    if (mountedFormEl) {
      formRegistry.set(mountedFormEl, formInstance)
    }
    // WeakMap is now the source of truth — drop the strong Map reference
    formNameRegistry.delete(name)
  })

  onUnmounted(() => {
    // formNameRegistry entry is already deleted in onMounted; clean up in case
    // onMounted never fired (e.g. SSR or component destroyed before mount).
    formNameRegistry.delete(name)
    if (mountedFormEl) {
      formRegistry.delete(mountedFormEl)
      mountedFormEl = null
    }
  })

  const formInstance: UseFormResult = new Proxy(result as any, {
    get(target, prop) {
      // Pass through Symbols and Vue's internal string flags (__v_*) unchanged —
      // without this guard, Vue's reactive internals (isReactive, __v_raw, etc.)
      // would forward to fields.value, making Vue misidentify the Proxy as a
      // reactive object and breaking computed dependency tracking.
      if (typeof prop === 'symbol' || (typeof prop === 'string' && prop.startsWith('__v_'))) {
        return (target as any)[prop]
      }
      if (prop.startsWith('$') || prop === 'engine' || prop === 'cssClasses' || prop === 'fields'
          || prop === 'isValid' || prop === 'isModelDirty' || prop === 'summary' || prop === 'validate'
          || prop === 'reset' || prop === 'touch' || prop === 'touchAll' || prop === 'errors'
          || prop === 'getFieldErrors' || prop === 'isFieldValid' || prop === 'registerRule'
          || prop === 'unregisterRule' || prop === 'registerField' || prop === 'unregisterField') {
        return (target as any)[prop]
      }
      // Field access: form.email → form.fields.value.email
      if (target.fields?.value?.[prop] !== undefined) {
        return target.fields.value[prop]
      }
      return (target as any)[prop]
    }
  }) as UseFormResult

  // Register by name synchronously so directives can find the form during their
  // mounted() hooks, which fire before component onMounted().
  formNameRegistry.set(name, formInstance)

  return formInstance
}
