import type { Directive, DirectiveBinding } from 'vue'
import { formRegistry } from './registry'

interface CleanupData {
  submitHandler: (event: Event) => void
  callbackRef: { current: () => void | Promise<void> }
}

const cleanupMap = new WeakMap<HTMLFormElement, CleanupData>()

export const vSubmit: Directive<HTMLFormElement, () => void | Promise<void>> = {
  mounted(el, binding: DirectiveBinding<() => void | Promise<void>>) {
    // Auto-add novalidate to disable native HTML5 validation
    el.setAttribute('novalidate', '')

    const callbackRef = { current: binding.value }

    const submitHandler = async (event: Event) => {
      event.preventDefault()
      const form = formRegistry.get(el)
      if (form) {
        await form.$submit(callbackRef.current)
      } else {
        // No form registered — just call callback
        await callbackRef.current()
      }
    }

    el.addEventListener('submit', submitHandler)
    cleanupMap.set(el, { submitHandler, callbackRef })
  },

  updated(el, binding: DirectiveBinding<() => void | Promise<void>>) {
    const cleanup = cleanupMap.get(el)
    if (cleanup) {
      cleanup.callbackRef.current = binding.value
    }
  },

  unmounted(el) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    el.removeEventListener('submit', cleanup.submitHandler)
    cleanupMap.delete(el)
  }
}
