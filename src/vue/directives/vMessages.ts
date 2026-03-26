import type { Directive, DirectiveBinding } from 'vue'
import { messagesRegistry } from './registry'

interface MessagesBinding {
  [key: string]: boolean
}

export const vMessages: Directive<HTMLElement, MessagesBinding | undefined> = {
  mounted(el, binding: DirectiveBinding<MessagesBinding | undefined>) {
    const errors = binding.value ?? {}
    const multiple = binding.modifiers?.multiple === true

    messagesRegistry.set(el, { errors, multiple })
    updateMessageVisibility(el, errors, multiple)
  },

  updated(el, binding: DirectiveBinding<MessagesBinding | undefined>) {
    const errors = binding.value ?? {}
    const multiple = binding.modifiers?.multiple === true

    messagesRegistry.set(el, { errors, multiple })
    updateMessageVisibility(el, errors, multiple)
  },

  unmounted(el) {
    messagesRegistry.delete(el)
  }
}

function updateMessageVisibility(el: HTMLElement, errors: Record<string, boolean>, multiple: boolean): void {
  const children = Array.from(el.children) as HTMLElement[]
  let shown = false

  for (const child of children) {
    // Check if child has v-message directive key stored
    const messageKey = (child as any).__vMessageKey
    if (messageKey === undefined) continue

    if (errors[messageKey]) {
      if (!multiple && shown) {
        child.style.display = 'none'
      } else {
        child.style.display = ''
        shown = true
      }
    } else {
      child.style.display = 'none'
    }
  }
}
