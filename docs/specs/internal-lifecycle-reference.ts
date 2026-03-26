// ============================================================================
// INTERNAL IMPLEMENTATION REFERENCE
// Shows exactly how directives manage event listeners and prevent memory leaks
//
// This is NOT the final code — it's the design specification for Claude Code
// to implement. It shows the lifecycle and cleanup patterns.
// ============================================================================

// ============================================================================
// 1. THE DIRECTIVE CLEANUP CONTRACT
// ============================================================================
//
// Every validation directive MUST follow this lifecycle:
//
//   mounted(el, binding):
//     1. Store handler references on the element (WeakMap or expando)
//     2. el.addEventListener('blur', handler)
//     3. el.addEventListener('input', handler)
//     4. Register rule with form
//
//   unmounted(el):
//     1. el.removeEventListener('blur', handler)  ← SAME reference
//     2. el.removeEventListener('input', handler)  ← SAME reference
//     3. Unregister rule from form
//     4. Clear stored references
//
// The handler references MUST be the exact same function objects.
// Arrow functions in mounted() that aren't stored will leak.
// ============================================================================


// ============================================================================
// 2. HANDLER STORAGE — WeakMap pattern (NO expando properties on DOM)
// ============================================================================

import type { Directive, DirectiveBinding } from 'vue'

// Each directive stores its handlers per-element in a WeakMap.
// WeakMap keys are DOM elements → when element is GC'd, entry is GC'd.
// No manual cleanup needed for the map itself.

interface DirectiveCleanup {
  blurHandler: () => void
  inputHandler: () => void
  ruleKey: string
  fieldName: string
}

// One WeakMap per directive type — module-level singleton
const cleanupMap = new WeakMap<HTMLElement, DirectiveCleanup>()


// ============================================================================
// 3. EXAMPLE: vRequired directive — full lifecycle
// ============================================================================

// import { formRegistry } from './registry'
// import { RequiredValidationRule } from '../../rules/RequiredValidationRule'

/*
export const vRequired: Directive<HTMLElement, boolean> = {

  mounted(el: HTMLElement, binding: DirectiveBinding<boolean>) {
    // 1. Find the field name from the element
    const fieldName = el.getAttribute('name')
    if (!fieldName) {
      console.warn('[v-required] Input element must have a "name" attribute.')
      return
    }

    // 2. Find the parent form instance
    const formEl = el.closest('form')
    if (!formEl) {
      console.warn('[v-required] Input must be inside a <form> element.')
      return
    }
    const form = formRegistry.get(formEl as HTMLFormElement)
    if (!form) {
      console.warn('[v-required] No useForm() found for this <form>. Did you forget useForm()?')
      return
    }

    // 3. Only register rule if binding value is truthy (v-required="true")
    if (binding.value) {
      form.registerRule(fieldName, 'required', 'required')
    }

    // 4. Create handler functions — STORE REFERENCES for removal later
    const blurHandler = () => {
      form.touchField(fieldName)         // sets $touched = true
      updateCssClasses(el, form, fieldName)
    }

    const inputHandler = () => {
      form.dirtyField(fieldName)         // sets $dirty = true
      form.validateField(fieldName)      // re-run validation
      updateCssClasses(el, form, fieldName)
    }

    // 5. Attach listeners
    el.addEventListener('blur', blurHandler)
    el.addEventListener('input', inputHandler)

    // 6. Store everything for cleanup
    cleanupMap.set(el, {
      blurHandler,
      inputHandler,
      ruleKey: 'required',
      fieldName,
    })

    // 7. Initial CSS classes
    updateCssClasses(el, form, fieldName)
  },

  updated(el: HTMLElement, binding: DirectiveBinding<boolean>) {
    // Handle dynamic v-required="someRef" toggling
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    const formEl = el.closest('form') as HTMLFormElement
    const form = formEl ? formRegistry.get(formEl) : null
    if (!form) return

    if (binding.value && !binding.oldValue) {
      // Was false, now true → add rule
      form.registerRule(cleanup.fieldName, 'required', 'required')
      form.validateField(cleanup.fieldName)
    } else if (!binding.value && binding.oldValue) {
      // Was true, now false → remove rule
      form.unregisterRule(cleanup.fieldName, 'required')
      form.validateField(cleanup.fieldName)
    }

    updateCssClasses(el, form, cleanup.fieldName)
  },

  unmounted(el: HTMLElement) {
    const cleanup = cleanupMap.get(el)
    if (!cleanup) return

    // *** CRITICAL: Remove the EXACT SAME handler references ***
    el.removeEventListener('blur', cleanup.blurHandler)
    el.removeEventListener('input', cleanup.inputHandler)

    // Unregister rule from form
    const formEl = el.closest('form') as HTMLFormElement
    const form = formEl ? formRegistry.get(formEl) : null
    if (form) {
      form.unregisterRule(cleanup.fieldName, cleanup.ruleKey)

      // If this was the LAST directive on this field, unregister the field entirely
      // (check if any other rules remain for this field)
      // form.maybeUnregisterField(cleanup.fieldName)
    }

    // Clean up stored references
    cleanupMap.delete(el)
  }
}
*/


// ============================================================================
// 4. SHARED EVENT HOOKUP — avoid duplicate blur/input listeners
// ============================================================================
//
// PROBLEM: If an input has v-required + v-minlength + v-pattern,
// each directive would add its own blur + input handler = 6 listeners.
// That's wasteful and causes triple validation on every keystroke.
//
// SOLUTION: A shared "field controller" per input element.
// First directive to mount on an input creates the controller.
// Subsequent directives just register their rules — no extra listeners.
// Last directive to unmount tears down the controller.

interface FieldController {
  fieldName: string
  blurHandler: () => void
  inputHandler: () => void
  directiveCount: number        // tracks how many directives are active on this element
}

const fieldControllers = new WeakMap<HTMLElement, FieldController>()

/*
function ensureFieldController(el: HTMLElement, form: FormInstance, fieldName: string): FieldController {
  let controller = fieldControllers.get(el)

  if (!controller) {
    // First directive on this element — create controller and attach listeners

    const blurHandler = () => {
      form.touchField(fieldName)
      updateCssClasses(el, form, fieldName)
    }

    const inputHandler = () => {
      form.dirtyField(fieldName)
      form.validateField(fieldName)
      updateCssClasses(el, form, fieldName)
    }

    el.addEventListener('blur', blurHandler)
    el.addEventListener('input', inputHandler)

    // For checkboxes/radios, also listen to 'change'
    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      el.addEventListener('change', inputHandler)
    }

    controller = {
      fieldName,
      blurHandler,
      inputHandler,
      directiveCount: 0,
    }
    fieldControllers.set(el, controller)
  }

  controller.directiveCount++
  return controller
}

function releaseFieldController(el: HTMLElement, form: FormInstance): void {
  const controller = fieldControllers.get(el)
  if (!controller) return

  controller.directiveCount--

  if (controller.directiveCount <= 0) {
    // Last directive removed — tear down controller, remove ALL listeners

    el.removeEventListener('blur', controller.blurHandler)
    el.removeEventListener('input', controller.inputHandler)

    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      el.removeEventListener('change', controller.inputHandler)
    }

    fieldControllers.delete(el)

    // Also unregister the field from the form entirely
    form.unregisterField(controller.fieldName)
  }
}
*/


// ============================================================================
// 5. CSS CLASS UPDATES — applied to the host element by directives
// ============================================================================

/*
function updateCssClasses(el: HTMLElement, form: FormInstance, fieldName: string): void {
  const field = form.getFieldState(fieldName)
  if (!field) return

  // Toggle classes — matches AngularJS ng-* classes with v-* prefix
  el.classList.toggle('v-valid',     field.$valid)
  el.classList.toggle('v-invalid',   field.$invalid)
  el.classList.toggle('v-pristine',  field.$pristine)
  el.classList.toggle('v-dirty',     field.$dirty)
  el.classList.toggle('v-touched',   field.$touched)
  el.classList.toggle('v-untouched', field.$untouched)
  el.classList.toggle('v-pending',   field.$pending)

  // Per-rule classes: v-valid-required, v-invalid-minlength, etc.
  for (const [ruleKey, failing] of Object.entries(field.$error)) {
    el.classList.toggle(`v-valid-${ruleKey}`,   !failing)
    el.classList.toggle(`v-invalid-${ruleKey}`,  failing)
  }
}
*/


// ============================================================================
// 6. FORM REGISTRY — how directives find their parent form
// ============================================================================
//
// useForm() stores itself here when it mounts.
// Directives walk up the DOM to find <form> and look it up.
//
// WeakMap<HTMLFormElement, FormInstance>
//   - When component unmounts and <form> element is GC'd, entry is GC'd
//   - No manual cleanup needed
//
// useForm() ALSO needs to register/deregister:

/*
import { onMounted, onUnmounted, getCurrentInstance } from 'vue'

export function useForm(name: string, formData: ...) {
  // ... create form state ...

  onMounted(() => {
    // Find the <form> element in the component's DOM
    const instance = getCurrentInstance()
    const formEl = instance?.proxy?.$el?.closest?.('form')
      || document.querySelector(`form[name="${name}"]`)

    if (formEl) {
      formRegistry.set(formEl, formInstance)
    }
  })

  onUnmounted(() => {
    // Remove from registry — prevents stale references
    const formEl = document.querySelector(`form[name="${name}"]`)
    if (formEl) {
      formRegistry.delete(formEl)
    }

    // Stop the deep watcher (Vue does this automatically for watchers
    // created during setup(), but be explicit if needed)
    // stopWatcher()

    // Cancel any pending async validations
    // asyncController.abortAll()
  })

  return formProxy
}
*/


// ============================================================================
// 7. ASYNC VALIDATION — cancellation prevents leaks and stale updates
// ============================================================================

/*
class AsyncValidationController {
  private pending = new Map<string, AbortController>()  // fieldName → controller
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  schedule(
    fieldName: string,
    ruleKey: string,
    value: any,
    validator: (value: any) => Promise<boolean>,
    debounceMs: number,
    onStart: () => void,
    onComplete: (ruleKey: string, isValid: boolean) => void,
  ) {
    // 1. Cancel any existing timer for this field
    const existingTimer = this.timers.get(fieldName)
    if (existingTimer) clearTimeout(existingTimer)

    // 2. Cancel any in-flight request for this field
    const existingController = this.pending.get(fieldName)
    if (existingController) existingController.abort()

    // 3. Schedule new validation after debounce
    const timer = setTimeout(async () => {
      const abortController = new AbortController()
      this.pending.set(fieldName, abortController)
      onStart()  // sets $pending = true

      try {
        const isValid = await validator(value)
        // Check if we were aborted while awaiting
        if (!abortController.signal.aborted) {
          onComplete(ruleKey, isValid)
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          // Network error etc — treat as invalid
          onComplete(ruleKey, false)
        }
      } finally {
        this.pending.delete(fieldName)
        this.timers.delete(fieldName)
      }
    }, debounceMs)

    this.timers.set(fieldName, timer)
  }

  // Called when the form/component unmounts — no dangling promises
  abortAll() {
    for (const controller of this.pending.values()) {
      controller.abort()
    }
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.pending.clear()
    this.timers.clear()
  }
}
*/


// ============================================================================
// 8. CLEANUP SUMMARY — what gets cleaned up and when
// ============================================================================
//
// ┌─────────────────────────────────────────────────────────────────┐
// │                    COMPONENT UNMOUNTS                           │
// │                                                                 │
// │  useForm() onUnmounted:                                        │
// │    ✓ formRegistry.delete(formEl)     — no stale form refs      │
// │    ✓ Vue auto-stops watch(formData)  — no orphan watchers      │
// │    ✓ asyncController.abortAll()      — no dangling promises    │
// │                                                                 │
// │  Each v-* directive unmounted:                                  │
// │    ✓ el.removeEventListener(blur)    — exact handler ref       │
// │    ✓ el.removeEventListener(input)   — exact handler ref       │
// │    ✓ el.removeEventListener(change)  — for checkbox/radio      │
// │    ✓ form.unregisterRule(field, key) — no orphan rules         │
// │    ✓ cleanupMap.delete(el)           — no stored refs          │
// │    ✓ releaseFieldController(el)      — shared controller cleanup│
// │                                                                 │
// │  WeakMaps (formRegistry, fieldControllers, cleanupMap,          │
// │            messagesRegistry):                                    │
// │    ✓ Auto-GC when DOM elements are collected                   │
// │    ✓ No manual iteration/cleanup needed                        │
// │                                                                 │
// ├─────────────────────────────────────────────────────────────────┤
// │                    v-if REMOVES A FIELD                         │
// │                                                                 │
// │  v-required/v-minlength/etc unmounted on that input:           │
// │    ✓ Same cleanup as above per directive                       │
// │    ✓ Last directive triggers releaseFieldController()          │
// │    ✓ form.unregisterField(fieldName) removes field state       │
// │    ✓ form.$valid recomputes without the removed field          │
// │                                                                 │
// ├─────────────────────────────────────────────────────────────────┤
// │                    v-for REMOVES ITEMS                          │
// │                                                                 │
// │  Same as v-if — Vue removes DOM elements, directives unmount   │
// │  Key: use :key on v-for so Vue reuses/removes correctly        │
// │                                                                 │
// ├─────────────────────────────────────────────────────────────────┤
// │                    v-required="false" (dynamic toggle)          │
// │                                                                 │
// │  Directive stays mounted but rule is removed via updated():    │
// │    ✓ form.unregisterRule(fieldName, 'required')                │
// │    ✓ Event listeners stay (blur/input still needed for state)  │
// │    ✓ form.$valid recomputes without the required rule          │
// │    ✓ No leak — listener count unchanged                        │
// └─────────────────────────────────────────────────────────────────┘
//
// ZERO event listener leaks.
// ZERO orphan watchers.
// ZERO stale form/field references.
// ZERO dangling async promises.
