import type { Directive } from 'vue'

// v-form-group is a simplified directive for grouping form fields
// It doesn't add validation logic itself but marks a group container
// Sub-form functionality can be layered on top

const cleanupMap = new WeakMap<HTMLElement, { groupName: string }>()

export const vFormGroup: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    const groupName = binding.value || el.getAttribute('name') || 'group'
    ;(el as any).__vFormGroupName = groupName
    cleanupMap.set(el, { groupName })
  },

  updated(el, binding) {
    const groupName = binding.value || el.getAttribute('name') || 'group'
    ;(el as any).__vFormGroupName = groupName
    const existing = cleanupMap.get(el)
    if (existing) existing.groupName = groupName
  },

  unmounted(el) {
    ;(el as any).__vFormGroupName = undefined
    cleanupMap.delete(el)
  }
}
