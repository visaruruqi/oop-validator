import type { Directive } from 'vue'
import EmailValidationRule from '../../rules/EmailValidationRule'
import UrlValidationRule from '../../rules/UrlValidationRule'
import DateValidationRule from '../../rules/DateValidationRule'
import NumberValidationRule from '../../rules/NumberValidationRule'
import { getFormInstance, ensureFieldController, releaseFieldController, updateCssClasses } from './registry'

interface CleanupData {
  fieldName: string
  typeKey: string | null
}

const cleanupMap = new WeakMap<HTMLElement, CleanupData>()

function getRuleForType(type: string): { key: string, rule: any } | null {
  switch (type.toLowerCase()) {
    case 'email': {
      const rule = new EmailValidationRule()
      rule.ruleKey = 'email'
      return { key: 'email', rule }
    }
    case 'url': {
      const rule = new UrlValidationRule()
      rule.ruleKey = 'url'
      return { key: 'url', rule }
    }
    case 'date': {
      const rule = new DateValidationRule()
      rule.ruleKey = 'date'
      return { key: 'date', rule }
    }
    case 'number': {
      const rule = new NumberValidationRule()
      rule.ruleKey = 'number'
      return { key: 'number', rule }
    }
    default:
      return null
  }
}

export const vType: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-type] Input element must have a "name" attribute.')
      return
    }

    const form = getFormInstance(el)
    if (!form) {
      console.warn('[v-type] No useForm() found for this <form>.')
      return
    }

    ensureFieldController(el, form, fieldName)

    // Get type from binding.value or el.type attribute
    const inputType = binding.value || (el as HTMLInputElement).type || ''
    const ruleInfo = getRuleForType(inputType)

    if (ruleInfo && !(el as HTMLInputElement).disabled) {
      form.registerRule(fieldName, ruleInfo.key, ruleInfo.rule)
    }

    cleanupMap.set(el, { fieldName, typeKey: ruleInfo?.key ?? null })
    updateCssClasses(el, form, fieldName)
  },

  updated(el, binding) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getFormInstance(el)
    if (!form) return

    // Remove old type rule
    if (cleanup.typeKey) {
      form.unregisterRule(cleanup.fieldName, cleanup.typeKey)
    }

    const inputType = binding.value || (el as HTMLInputElement).type || ''
    const ruleInfo = getRuleForType(inputType)

    if (ruleInfo && !(el as HTMLInputElement).disabled) {
      form.registerRule(cleanup.fieldName, ruleInfo.key, ruleInfo.rule)
    }

    cleanup.typeKey = ruleInfo?.key ?? null
    form.validate()
    updateCssClasses(el, form, cleanup.fieldName)
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getFormInstance(el)
    if (form) {
      if (cleanup.typeKey) {
        form.unregisterRule(cleanup.fieldName, cleanup.typeKey)
      }
      releaseFieldController(el, form)
    }

    cleanupMap.delete(el)
  }
}
