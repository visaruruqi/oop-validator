import type { UseFormValidationResult } from '../useFormValidation'

export type FormInstance = UseFormValidationResult

// Module-level WeakMaps for directive communication
// WeakMap keys are DOM elements — auto-GC'd when elements are collected
export const formRegistry = new WeakMap<HTMLFormElement, FormInstance>()

export interface FieldController {
  fieldName: string
  blurHandler: () => void
  inputHandler: () => void
  changeHandler?: () => void
  directiveCount: number
}

export const fieldControllers = new WeakMap<HTMLElement, FieldController>()

export interface MessagesContext {
  errors: Record<string, boolean>
  multiple: boolean
}

export const messagesRegistry = new WeakMap<HTMLElement, MessagesContext>()

export interface DirectiveCleanupEntry {
  ruleKey: string
  fieldName: string
}

export const directiveCleanups = new WeakMap<HTMLElement, Map<string, DirectiveCleanupEntry>>()

// Helper: walk up DOM from element to find parent <form>
export function getParentForm(el: HTMLElement): HTMLFormElement | null {
  return el.closest('form') as HTMLFormElement | null
}

// Helper: get form instance from registry
export function getFormInstance(el: HTMLElement): FormInstance | null {
  const formEl = getParentForm(el)
  if (!formEl) return null
  return formRegistry.get(formEl) ?? null
}

// Helper: ensure a field controller exists for an element
export function ensureFieldController(
  el: HTMLElement,
  form: FormInstance,
  fieldName: string,
): FieldController {
  let controller = fieldControllers.get(el)

  if (!controller) {
    const blurHandler = () => {
      form.touch(fieldName)
      updateCssClasses(el, form, fieldName)
    }

    const inputHandler = () => {
      form.validate()
      updateCssClasses(el, form, fieldName)
    }

    el.addEventListener('blur', blurHandler)
    el.addEventListener('input', inputHandler)

    // For checkbox/radio/select, also listen to 'change'
    let changeHandler: (() => void) | undefined
    if (
      el instanceof HTMLSelectElement ||
      (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio'))
    ) {
      changeHandler = inputHandler
      el.addEventListener('change', inputHandler)
    }

    controller = {
      fieldName,
      blurHandler,
      inputHandler,
      changeHandler,
      directiveCount: 0,
    }
    fieldControllers.set(el, controller)

    // Register field with form
    form.registerField(fieldName)
  }

  controller.directiveCount++
  return controller
}

// Helper: release a field controller (decrement count, cleanup on zero)
export function releaseFieldController(el: HTMLElement, form: FormInstance): void {
  const controller = fieldControllers.get(el)
  if (!controller) return

  controller.directiveCount--

  if (controller.directiveCount <= 0) {
    el.removeEventListener('blur', controller.blurHandler)
    el.removeEventListener('input', controller.inputHandler)

    if (controller.changeHandler) {
      el.removeEventListener('change', controller.changeHandler)
    }

    fieldControllers.delete(el)
    form.unregisterField(controller.fieldName)
  }
}

// Helper: update CSS classes on host element
export function updateCssClasses(el: HTMLElement, form: FormInstance, fieldName: string): void {
  const field = form.fields.value[fieldName]
  if (!field) return

  el.classList.toggle('v-valid', field.$valid)
  el.classList.toggle('v-invalid', field.$invalid)
  el.classList.toggle('v-pristine', field.$pristine)
  el.classList.toggle('v-dirty', field.$dirty)
  el.classList.toggle('v-touched', field.$touched)
  el.classList.toggle('v-untouched', field.$untouched)
  el.classList.toggle('v-pending', field.$pending)

  for (const [ruleKey, failing] of Object.entries(field.$error)) {
    el.classList.toggle(`v-valid-${ruleKey}`, !failing)
    el.classList.toggle(`v-invalid-${ruleKey}`, failing)
  }
}
