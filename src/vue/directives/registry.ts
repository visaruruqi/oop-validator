import { watch, type WatchStopHandle } from 'vue'
import type { UseFormValidationResult } from '../useFormValidation'

export type FormInstance = UseFormValidationResult

// Module-level WeakMaps for directive communication
// WeakMap keys are DOM elements — auto-GC'd when elements are collected
export const formRegistry = new WeakMap<HTMLFormElement, FormInstance>()

// Name-based registry for synchronous lookup before onMounted fires.
// Directives mount before onMounted, so we need a way to find the form by name.
export const formNameRegistry = new Map<string, FormInstance>()

// Per-form callback that binds the <form> element into formRegistry and starts
// the form-level CSS class watcher. Stored so getFormInstance() can promote a
// conditionally-rendered <form> that mounted after useForm()'s onMounted fired.
type FormElementBinder = (formEl: HTMLFormElement) => void
const formElementBinders = new Map<string, FormElementBinder>()

// Called by useForm() to register (or clear, with null) its lazy element binder.
export function registerFormElement(name: string, binder: FormElementBinder | null): void {
  if (binder) {
    formElementBinders.set(name, binder)
  } else {
    formElementBinders.delete(name)
  }
}

export interface FieldController {
  fieldName: string
  blurHandler: () => void
  inputHandler: () => void
  changeHandler?: () => void
  directiveCount: number
  stopWatcher?: WatchStopHandle
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
// First tries WeakMap by element (populated in onMounted), then falls back to
// name-based Map which is populated synchronously during setup() so directives
// can find the form even before onMounted fires.
export function getFormInstance(el: HTMLElement): FormInstance | null {
  const formEl = getParentForm(el)
  if (!formEl) return null
  if (formRegistry.has(formEl)) return formRegistry.get(formEl)!
  const name = formEl.getAttribute('name')
  if (!name) return null
  const instance = formNameRegistry.get(name)
  if (!instance) return null
  // Promote a conditionally-rendered <form> that mounted after useForm()'s
  // onMounted ran: bind it into formRegistry and start its class watcher now.
  // The binder is idempotent and clears the formNameRegistry entry itself.
  formElementBinders.get(name)?.(formEl)
  return instance
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

    // Reactively repaint CSS classes whenever the field's state changes —
    // e.g. when validate()/$validate()/$submit()/touchAll() are called from
    // a button handler, no DOM event fires but fields.value mutates.
    // deep:true because $error is a nested Record<string, boolean>.
    const stopWatcher = watch(
      () => form.fields.value[fieldName],
      () => updateCssClasses(el, form, fieldName),
      { deep: true },
    )

    controller = {
      fieldName,
      blurHandler,
      inputHandler,
      changeHandler,
      directiveCount: 0,
      stopWatcher,
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

    controller.stopWatcher?.()

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

// Helper: update aggregate CSS classes on the <form> element. No
// v-form-valid/v-form-invalid — those would clash with per-field v-valid /
// v-invalid rules in CSS. Authors compose with `:has(.v-invalid)` if needed.
export function updateFormCssClasses(el: HTMLFormElement, form: FormInstance): void {
  const fieldStates = Object.values(form.fields.value)
  const anyTouched = fieldStates.some(f => f.$touched)

  el.classList.toggle('v-form-submitted', form.$submitted.value)
  el.classList.toggle('v-form-pristine', form.$pristine.value)
  el.classList.toggle('v-form-dirty', form.$dirty.value)
  el.classList.toggle('v-form-touched', anyTouched)
  el.classList.toggle('v-form-untouched', !anyTouched)
  el.classList.toggle('v-form-pending', form.$pending.value)
}
