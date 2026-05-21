import { onMounted, onUnmounted, watchEffect, Ref, type WatchStopHandle } from 'vue'
import useFormValidation from './useFormValidation'
import type { UseFormValidationOptions } from './useFormValidation'
import { formRegistry, formNameRegistry, updateFormCssClasses, registerFormElement } from './directives/registry'

export type UseFormResult = ReturnType<typeof useFormValidation> & {
  [key: string]: any
}

export function useForm(
  name: string,
  formData: Ref<Record<string, any>> | Record<string, any>,
  options?: UseFormValidationOptions
): UseFormResult {
  const result = useFormValidation(formData, {}, { validateOnMount: false, ...options })

  // Captured here so onUnmounted doesn't have to re-query a possibly detached
  // DOM (container.remove() runs before onUnmounted in tests and SSR). These
  // may be populated late — by onMounted, or by getFormInstance() promoting a
  // conditionally-rendered <form> when a directive first resolves it.
  let mountedFormEl: HTMLFormElement | null = null
  let stopFormClassWatcher: WatchStopHandle | null = null

  // Binds the <form> element into formRegistry (the WeakMap source of truth)
  // and starts the form-level CSS class watcher. Idempotent: a no-op if the
  // element is already bound. Called from onMounted when the form is present,
  // or lazily from getFormInstance() when the form mounts after onMounted.
  function bindFormElement(formEl: HTMLFormElement): void {
    if (mountedFormEl) return
    mountedFormEl = formEl
    formRegistry.set(formEl, formInstance)
    stopFormClassWatcher = watchEffect(() => {
      updateFormCssClasses(formEl, formInstance)
    })
    // The WeakMap is now the source of truth — drop the strong Map reference.
    formNameRegistry.delete(name)
  }

  onMounted(() => {
    const formEl = document.querySelector(`form[name="${name}"]`) as HTMLFormElement | null
    if (formEl) {
      bindFormElement(formEl)
    }
    // If the <form> is not in the DOM yet (behind v-if / Suspense / async gate),
    // keep the formNameRegistry entry as the fallback lookup path so directives
    // that mount with the form later can still resolve it by name. Binding then
    // happens lazily via getFormInstance() → bindFormElement.
  })

  onUnmounted(() => {
    // Defensive: clean up the name entry even if it was already dropped by
    // bindFormElement, and cover the case where the form never mounted at all
    // (SSR, or component destroyed before its <form> appeared).
    formNameRegistry.delete(name)
    stopFormClassWatcher?.()
    stopFormClassWatcher = null
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
  // mounted() hooks, which fire before component onMounted(). registerFormElement
  // also stores bindFormElement so getFormInstance() can promote a late-mounting
  // <form> into formRegistry on first lookup.
  formNameRegistry.set(name, formInstance)
  registerFormElement(name, bindFormElement)

  onUnmounted(() => {
    registerFormElement(name, null)
  })

  return formInstance
}
