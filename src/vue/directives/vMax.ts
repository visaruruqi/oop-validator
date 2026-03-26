import type { Directive, DirectiveBinding } from 'vue'
import NumericMaxValidationRule from '../../rules/NumericMaxValidationRule'
import { getFormInstance, ensureFieldController, releaseFieldController, updateCssClasses } from './registry'

interface CleanupData {
  fieldName: string
}

const cleanupMap = new WeakMap<HTMLElement, CleanupData>()

export const vMax: Directive<HTMLElement, number> = {
  mounted(el, binding: DirectiveBinding<number>) {
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-max] Input element must have a "name" attribute.')
      return
    }

    const form = getFormInstance(el)
    if (!form) {
      console.warn('[v-max] No useForm() found for this <form>.')
      return
    }

    ensureFieldController(el, form, fieldName)

    if (!(el as HTMLInputElement).disabled) {
      const rule = new NumericMaxValidationRule()
      rule.setParams({ value: binding.value })
      form.registerRule(fieldName, 'max', rule)
    }

    cleanupMap.set(el, { fieldName })
    updateCssClasses(el, form, fieldName)
  },

  updated(el, binding: DirectiveBinding<number>) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup || binding.value === binding.oldValue) return

    const form = getFormInstance(el)
    if (!form) return

    form.unregisterRule(cleanup.fieldName, 'max')

    if (!(el as HTMLInputElement).disabled) {
      const rule = new NumericMaxValidationRule()
      rule.setParams({ value: binding.value })
      form.registerRule(cleanup.fieldName, 'max', rule)
    }

    form.validate()
    updateCssClasses(el, form, cleanup.fieldName)
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getFormInstance(el)
    if (form) {
      form.unregisterRule(cleanup.fieldName, 'max')
      releaseFieldController(el, form)
    }

    cleanupMap.delete(el)
  }
}
