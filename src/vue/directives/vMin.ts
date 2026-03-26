import type { Directive, DirectiveBinding } from 'vue'
import NumericMinValidationRule from '../../rules/NumericMinValidationRule'
import { getFormInstance, ensureFieldController, releaseFieldController, updateCssClasses } from './registry'

interface CleanupData {
  fieldName: string
}

const cleanupMap = new WeakMap<HTMLElement, CleanupData>()

export const vMin: Directive<HTMLElement, number> = {
  mounted(el, binding: DirectiveBinding<number>) {
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-min] Input element must have a "name" attribute.')
      return
    }

    const form = getFormInstance(el)
    if (!form) {
      console.warn('[v-min] No useForm() found for this <form>.')
      return
    }

    ensureFieldController(el, form, fieldName)

    if (!(el as HTMLInputElement).disabled) {
      const rule = new NumericMinValidationRule()
      rule.setParams({ value: binding.value })
      form.registerRule(fieldName, 'min', rule)
    }

    cleanupMap.set(el, { fieldName })
    updateCssClasses(el, form, fieldName)
  },

  updated(el, binding: DirectiveBinding<number>) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup || binding.value === binding.oldValue) return

    const form = getFormInstance(el)
    if (!form) return

    form.unregisterRule(cleanup.fieldName, 'min')

    if (!(el as HTMLInputElement).disabled) {
      const rule = new NumericMinValidationRule()
      rule.setParams({ value: binding.value })
      form.registerRule(cleanup.fieldName, 'min', rule)
    }

    form.validate()
    updateCssClasses(el, form, cleanup.fieldName)
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getFormInstance(el)
    if (form) {
      form.unregisterRule(cleanup.fieldName, 'min')
      releaseFieldController(el, form)
    }

    cleanupMap.delete(el)
  }
}
