import type { Directive, DirectiveBinding } from 'vue'
import RequiredValidationRule from '../../rules/RequiredValidationRule'
import { getFormInstance, ensureFieldController, releaseFieldController, updateCssClasses } from './registry'

interface CleanupData {
  fieldName: string
  ruleKey: string
}

const cleanupMap = new WeakMap<HTMLElement, CleanupData>()

export const vRequired: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, binding: DirectiveBinding<boolean | undefined>) {
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-required] Input element must have a "name" attribute.')
      return
    }

    const form = getFormInstance(el)
    if (!form) {
      console.warn('[v-required] No useForm() found for this <form>. Did you forget useForm()?')
      return
    }

    ensureFieldController(el, form, fieldName)

    const isRequired = binding.value !== false
    if (isRequired && !(el as HTMLInputElement).disabled) {
      const rule = new RequiredValidationRule()
      rule.ruleKey = 'required'
      form.registerRule(fieldName, 'required', rule)
    }

    cleanupMap.set(el, { fieldName, ruleKey: 'required' })
    updateCssClasses(el, form, fieldName)
  },

  updated(el, binding: DirectiveBinding<boolean | undefined>) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    if (binding.value === binding.oldValue && (el as HTMLInputElement).disabled === ((el as any).__prevDisabled)) return

    const form = getFormInstance(el)
    if (!form) return

    const isRequired = binding.value !== false && !(el as HTMLInputElement).disabled
    const wasRequired = binding.oldValue !== false

    if (isRequired && !wasRequired) {
      const rule = new RequiredValidationRule()
      rule.ruleKey = 'required'
      form.registerRule(cleanup.fieldName, 'required', rule)
    } else if (!isRequired && wasRequired) {
      form.unregisterRule(cleanup.fieldName, 'required')
    }

    form.validate()
    updateCssClasses(el, form, cleanup.fieldName)
    ;(el as any).__prevDisabled = (el as HTMLInputElement).disabled
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getFormInstance(el)
    if (form) {
      form.unregisterRule(cleanup.fieldName, cleanup.ruleKey)
      releaseFieldController(el, form)
    }

    cleanupMap.delete(el)
  }
}
