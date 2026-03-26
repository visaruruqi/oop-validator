import type { Directive, DirectiveBinding } from 'vue'
import MaxValidationRule from '../../rules/MaxValidationRule'
import { getFormInstance, ensureFieldController, releaseFieldController, updateCssClasses } from './registry'

interface CleanupData {
  fieldName: string
}

const cleanupMap = new WeakMap<HTMLElement, CleanupData>()

export const vMaxlength: Directive<HTMLElement, number> = {
  mounted(el, binding: DirectiveBinding<number>) {
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-maxlength] Input element must have a "name" attribute.')
      return
    }

    const form = getFormInstance(el)
    if (!form) {
      console.warn('[v-maxlength] No useForm() found for this <form>.')
      return
    }

    ensureFieldController(el, form, fieldName)

    if (!(el as HTMLInputElement).disabled) {
      const rule = new MaxValidationRule()
      rule.ruleKey = 'maxlength'
      rule.setParams({ length: binding.value })
      form.registerRule(fieldName, 'maxlength', rule)
    }

    cleanupMap.set(el, { fieldName })
    updateCssClasses(el, form, fieldName)
  },

  updated(el, binding: DirectiveBinding<number>) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup || binding.value === binding.oldValue) return

    const form = getFormInstance(el)
    if (!form) return

    form.unregisterRule(cleanup.fieldName, 'maxlength')

    if (!(el as HTMLInputElement).disabled) {
      const rule = new MaxValidationRule()
      rule.ruleKey = 'maxlength'
      rule.setParams({ length: binding.value })
      form.registerRule(cleanup.fieldName, 'maxlength', rule)
    }

    form.validate()
    updateCssClasses(el, form, cleanup.fieldName)
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getFormInstance(el)
    if (form) {
      form.unregisterRule(cleanup.fieldName, 'maxlength')
      releaseFieldController(el, form)
    }

    cleanupMap.delete(el)
  }
}
