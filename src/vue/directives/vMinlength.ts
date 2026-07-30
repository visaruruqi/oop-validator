import type { Directive, DirectiveBinding } from 'vue'
import MinValidationRule from '../../rules/MinValidationRule'
import { getFormInstance, getBoundFormInstance, ensureFieldController, releaseFieldController, updateCssClasses } from './registry'

interface CleanupData {
  fieldName: string
}

const cleanupMap = new WeakMap<HTMLElement, CleanupData>()

export const vMinlength: Directive<HTMLElement, number> = {
  mounted(el, binding: DirectiveBinding<number>) {
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-minlength] Input element must have a "name" attribute.')
      return
    }

    const form = getFormInstance(el)
    if (!form) {
      console.warn('[v-minlength] No useForm() found for this <form>.')
      return
    }

    ensureFieldController(el, form, fieldName)

    if (!(el as HTMLInputElement).disabled) {
      const rule = new MinValidationRule()
      rule.ruleKey = 'minlength'
      rule.setParams({ length: binding.value })
      form.registerRule(fieldName, 'minlength', rule)
    }

    cleanupMap.set(el, { fieldName })
    updateCssClasses(el, form, fieldName)
  },

  updated(el, binding: DirectiveBinding<number>) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup || binding.value === binding.oldValue) return

    const form = getFormInstance(el)
    if (!form) return

    form.unregisterRule(cleanup.fieldName, 'minlength')

    if (!(el as HTMLInputElement).disabled) {
      const rule = new MinValidationRule()
      rule.ruleKey = 'minlength'
      rule.setParams({ length: binding.value })
      form.registerRule(cleanup.fieldName, 'minlength', rule)
    }

    form.validate()
    updateCssClasses(el, form, cleanup.fieldName)
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getBoundFormInstance(el)
    if (form) {
      form.unregisterRule(cleanup.fieldName, 'minlength')
      releaseFieldController(el, form)
    }

    cleanupMap.delete(el)
  }
}
