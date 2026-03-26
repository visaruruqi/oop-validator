import type { Directive, DirectiveBinding } from 'vue'
import { messagesRegistry } from './registry'

const cleanupMap = new WeakMap<HTMLElement, string>()

function updateVisibility(el: HTMLElement, messageKey: string): void {
  const parent = el.parentElement
  if (!parent) return

  const context = messagesRegistry.get(parent)
  if (!context) {
    // Parent not yet registered, default hide
    el.style.display = 'none'
    return
  }

  const errors = context.errors
  const multiple = context.multiple
  const isActive = errors[messageKey] === true

  if (isActive) {
    // Check if we need to hide because multiple=false and another is already shown
    if (!multiple) {
      const siblings = Array.from(parent.children) as HTMLElement[]
      const firstActive = siblings.find(s => {
        const key = (s as any).__vMessageKey
        return key && errors[key]
      })
      el.style.display = (firstActive === el) ? '' : 'none'
    } else {
      el.style.display = ''
    }
  } else {
    el.style.display = 'none'
  }
}

export const vMessage: Directive<HTMLElement, string> = {
  mounted(el, binding: DirectiveBinding<string>) {
    const messageKey = binding.value
    ;(el as any).__vMessageKey = messageKey
    cleanupMap.set(el, messageKey)

    // Initial visibility
    el.style.display = 'none'
    updateVisibility(el, messageKey)
  },

  updated(el, binding: DirectiveBinding<string>) {
    const newKey = binding.value
    ;(el as any).__vMessageKey = newKey
    cleanupMap.set(el, newKey)
    updateVisibility(el, newKey)
  },

  unmounted(el) {
    ;(el as any).__vMessageKey = undefined
    cleanupMap.delete(el)
  }
}
