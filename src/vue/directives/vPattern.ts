import type { Directive, DirectiveBinding } from 'vue'
import RegexValidationRule from '../../rules/RegexValidationRule'
import { getFormInstance, getBoundFormInstance, ensureFieldController, releaseFieldController, updateCssClasses } from './registry'

interface CleanupData {
  fieldName: string
}

const cleanupMap = new WeakMap<HTMLElement, CleanupData>()

function patternToRegexString(pattern: string | RegExp): string {
  if (typeof pattern === 'string') {
    // Strip leading/trailing slashes if it's a /regex/ string
    const match = pattern.match(/^\/(.*)\/[gimsuy]*$/)
    return match ? match[1] : pattern
  }
  return pattern.source
}

export const vPattern: Directive<HTMLElement, string | RegExp> = {
  mounted(el, binding: DirectiveBinding<string | RegExp>) {
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-pattern] Input element must have a "name" attribute.')
      return
    }

    const form = getFormInstance(el)
    if (!form) {
      console.warn('[v-pattern] No useForm() found for this <form>.')
      return
    }

    ensureFieldController(el, form, fieldName)

    if (!(el as HTMLInputElement).disabled) {
      const regexStr = patternToRegexString(binding.value)
      const rule = new RegexValidationRule(regexStr)
      rule.ruleKey = 'pattern'
      form.registerRule(fieldName, 'pattern', rule)
    }

    cleanupMap.set(el, { fieldName })
    ;(el as any).__prevDisabled = (el as HTMLInputElement).disabled
    updateCssClasses(el, form, fieldName)
  },

  updated(el, binding: DirectiveBinding<string | RegExp>) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return
    // Compare by regex source+flags (not reference) since regex literals
    // create new objects on each render, which would trigger infinite loops.
    const newStr = patternToRegexString(binding.value)
    const oldStr = binding.oldValue ? patternToRegexString(binding.oldValue) : undefined
    if (newStr === oldStr && (el as HTMLInputElement).disabled === ((el as any).__prevDisabled)) return

    const form = getFormInstance(el)
    if (!form) return

    form.unregisterRule(cleanup.fieldName, 'pattern')

    if (!(el as HTMLInputElement).disabled) {
      const regexStr = patternToRegexString(binding.value)
      const rule = new RegexValidationRule(regexStr)
      rule.ruleKey = 'pattern'
      form.registerRule(cleanup.fieldName, 'pattern', rule)
    }

    form.validate()
    updateCssClasses(el, form, cleanup.fieldName)
    ;(el as any).__prevDisabled = (el as HTMLInputElement).disabled
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const form = getBoundFormInstance(el)
    if (form) {
      form.unregisterRule(cleanup.fieldName, 'pattern')
      releaseFieldController(el, form)
    }

    cleanupMap.delete(el)
  }
}
