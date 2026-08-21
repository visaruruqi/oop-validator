import { Ref, ref, watch, computed, unref, ComputedRef } from 'vue'
import FormValidationEngine, { FormConfig, FormValidationResult } from '../form/FormValidationEngine'
import IValidationRule from '../rules/IValidationRule'

export interface UseFormValidationOptions {
  validationStrategy?: 'all' | 'changed'
  validateOnMount?: boolean
  asyncValidators?: Record<string, Record<string, (value: any) => Promise<boolean>>>
  debounce?: number
  /**
   * What makes a field $dirty.
   *
   * 'value' (default) — the value differs from the initial snapshot; any
   * model write counts, including programmatic ones. The right default for
   * the standalone composable, which may run with no DOM at all.
   *
   * 'interaction' — AngularJS semantics: writes made before the first real
   * user input (DOM input/change, wired up by the directives, or an explicit
   * $noteUserInput()) are hydration and move the baseline instead of
   * dirtying the form. useForm() defaults to this, since ng-parity is its
   * contract and its directives supply the input signal.
   */
  dirtyTracking?: 'value' | 'interaction'
}

export interface FieldState {
  // EXISTING — unchanged
  isValid: boolean
  errors: string[]
  isDirty: boolean
  isTouched: boolean
  // NEW — AngularJS aliases and additions
  $error: Record<string, boolean>
  $valid: boolean
  $invalid: boolean
  $pristine: boolean
  $dirty: boolean
  $touched: boolean
  $untouched: boolean
  $pending: boolean
  $name: string
}

export interface UseFormValidationResult {
  // EXISTING — all unchanged
  fields: Ref<Record<string, FieldState>>
  isValid: Ref<boolean>
  isModelDirty: ComputedRef<boolean>
  summary: Ref<string[]>
  validate: (values?: Record<string, any>) => FormValidationResult
  reset: () => void
  touch: (fieldName: string) => void
  touchAll: () => void
  engine: FormValidationEngine
  errors: Ref<Record<string, string[]>>
  getFieldErrors: (field: string) => Ref<string[]>
  isFieldValid: (field: string) => Ref<boolean>

  // NEW — AngularJS FormController equivalent
  $submitted: Ref<boolean>
  $valid: ComputedRef<boolean>
  $invalid: ComputedRef<boolean>
  $pristine: ComputedRef<boolean>
  $dirty: ComputedRef<boolean>
  $pending: ComputedRef<boolean>
  $error: ComputedRef<Record<string, Record<string, boolean>>>
  $submit: (callback: () => void | Promise<void>) => Promise<void>
  $validate: () => Promise<boolean>
  $setPristine: () => void
  $setUntouched: () => void
  $setDirty: () => void
  $setValidity: (fieldName: string, key: string, isValid: boolean) => void
  $reset: (values?: Record<string, any>) => void
  $noteUserInput: () => void
  cssClasses: ComputedRef<Record<string, boolean>>

  // NEW — directive-friendly API
  registerRule: (fieldName: string, ruleKey: string, rule: string | { rule: string, params: any, message?: string } | IValidationRule) => void
  unregisterRule: (fieldName: string, ruleKey: string) => void
  registerField: (fieldName: string) => void
  unregisterField: (fieldName: string) => void
}

function makeInitialFieldState(fieldName: string, isValidState: boolean, errorsList: string[], errorsByRule: Record<string, boolean>): FieldState {
  return {
    isValid: isValidState,
    errors: errorsList,
    isDirty: false,
    isTouched: false,
    $error: errorsByRule,
    $valid: isValidState,
    $invalid: !isValidState,
    $pristine: true,
    $dirty: false,
    $touched: false,
    $untouched: true,
    $pending: false,
    $name: fieldName,
  }
}

function fieldsEqual(a: Record<string, FieldState>, b: Record<string, FieldState>): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    const fa = a[key]
    const fb = b[key]
    if (!fb) return false
    if (
      fa.$valid !== fb.$valid ||
      fa.$dirty !== fb.$dirty ||
      fa.$touched !== fb.$touched ||
      fa.$pending !== fb.$pending ||
      fa.errors.length !== fb.errors.length ||
      fa.errors.some((e, i) => e !== fb.errors[i])
    ) return false
    // Compare $error keys
    const errKeysA = Object.keys(fa.$error)
    const errKeysB = Object.keys(fb.$error)
    if (errKeysA.length !== errKeysB.length) return false
    for (const ek of errKeysA) {
      if (fa.$error[ek] !== fb.$error[ek]) return false
    }
  }
  return true
}

class AsyncValidationController {
  private pending = new Map<string, AbortController>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  schedule(
    fieldName: string,
    ruleKey: string,
    value: any,
    validator: (value: any) => Promise<boolean>,
    debounceMs: number,
    onStart: () => void,
    onComplete: (fieldName: string, ruleKey: string, isValid: boolean) => void,
  ) {
    const existingTimer = this.timers.get(fieldName)
    if (existingTimer) clearTimeout(existingTimer)

    const existingController = this.pending.get(fieldName)
    if (existingController) existingController.abort()

    const timer = setTimeout(async () => {
      const abortController = new AbortController()
      this.pending.set(fieldName, abortController)
      onStart()

      try {
        const isValid = await validator(value)
        if (!abortController.signal.aborted) {
          onComplete(fieldName, ruleKey, isValid)
        }
      } catch (_err) {
        if (!abortController.signal.aborted) {
          onComplete(fieldName, ruleKey, false)
        }
      } finally {
        this.pending.delete(fieldName)
        this.timers.delete(fieldName)
      }
    }, debounceMs)

    this.timers.set(fieldName, timer)
  }

  scheduleAll(
    validators: Record<string, Record<string, (value: any) => Promise<boolean>>>,
    values: Record<string, any>,
    debounceMs: number,
    onStart: (fieldName: string) => void,
    onComplete: (fieldName: string, ruleKey: string, isValid: boolean) => void,
  ) {
    for (const [fieldName, fieldValidators] of Object.entries(validators)) {
      for (const [ruleKey, validator] of Object.entries(fieldValidators)) {
        this.schedule(fieldName, ruleKey, values[fieldName], validator, debounceMs, () => onStart(fieldName), onComplete)
      }
    }
  }

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

  hasPending(): boolean {
    return this.pending.size > 0
  }
}

export default function useFormValidation(
  formValues: Ref<Record<string, any>> | Record<string, any>,
  config: FormConfig,
  options: UseFormValidationOptions = {}
): UseFormValidationResult {
  const { validationStrategy = 'all', validateOnMount = true, asyncValidators = {}, debounce: debounceMs = 300, dirtyTracking = 'value' } = options

  const shouldValidateOnMount: boolean = validateOnMount

  const engine = new FormValidationEngine(config)

  // Store initial values for isDirty tracking
  const initialValues = ref({ ...unref(formValues) })

  // Flag to prevent validation during reset
  let isResetting = false

  // NEW: unified fields API
  const fields = ref<Record<string, FieldState>>({})

  // OLD API (deprecated but kept for backward compatibility)
  const errors = ref<Record<string, string[]>>({})
  const summary = ref<string[]>([])
  const isValid = ref(true)

  // NEW: $submitted state
  const $submitted = ref(false)

  // True once the user has actually edited a field (DOM input/change — wired
  // up by the field controller). Until then, model writes are the app
  // populating the form (async load, applied defaults), not user edits.
  const hasUserInput = ref(false)

  // Track known fields (from config + dynamically registered)
  const knownFields = ref<Set<string>>(new Set(Object.keys(config)))

  // Async validation controller
  const asyncController = new AsyncValidationController()

  // Manual validity overrides (for $setValidity)
  const manualValidity = ref<Record<string, Record<string, boolean>>>({})

  function buildFieldState(
    fieldName: string,
    engineIsValid: boolean,
    engineErrors: string[],
    engineErrorsByRule: Record<string, boolean>,
    existingField?: FieldState,
  ): FieldState {
    const values = unref(formValues)
    const isDirty = values[fieldName] !== initialValues.value[fieldName]
    const isTouched = existingField?.isTouched ?? false
    const isPending = existingField?.$pending ?? false

    // Merge manual validity overrides
    const merged$error = { ...engineErrorsByRule }
    const manualForField = manualValidity.value[fieldName]
    if (manualForField) {
      for (const [key, valid] of Object.entries(manualForField)) {
        if (!valid) {
          merged$error[key] = true
        } else {
          delete merged$error[key]
        }
      }
    }

    const overallValid = engineIsValid && !Object.values(merged$error).some(Boolean)

    return {
      isValid: overallValid,
      errors: engineErrors,
      isDirty,
      isTouched,
      $error: merged$error,
      $valid: overallValid,
      $invalid: !overallValid,
      $pristine: !isDirty,
      $dirty: isDirty,
      $touched: isTouched,
      $untouched: !isTouched,
      $pending: isPending,
      $name: fieldName,
    }
  }

  const validate = (values: Record<string, any> = unref(formValues)): FormValidationResult => {
    const result = engine.validate(values)

    // Update old API (deprecated)
    errors.value = result.fieldErrors
    summary.value = result.summary
    isValid.value = result.isValid

    // Update unified fields API
    const newFields: Record<string, FieldState> = {}
    const allFields = new Set([...Object.keys(config), ...knownFields.value])

    allFields.forEach((fieldName) => {
      const existingField = fields.value[fieldName]
      const fieldErrorsByRule = result.fieldErrorsByRule?.[fieldName] ?? {}
      const fieldErrors = result.fieldErrors[fieldName] ?? []
      const fieldIsValid = fieldErrors.length === 0

      newFields[fieldName] = buildFieldState(fieldName, fieldIsValid, fieldErrors, fieldErrorsByRule, existingField)
    })

    // Only replace fields.value if something actually changed — avoids
    // unnecessary re-renders that can cascade through directive updated hooks.
    if (!fieldsEqual(fields.value, newFields)) {
      fields.value = newFields
    }

    // Run async validators if sync passes
    if (Object.keys(asyncValidators).length > 0) {
      for (const [fieldName, fieldAsyncValidators] of Object.entries(asyncValidators)) {
        const syncErrors = result.fieldErrors[fieldName] ?? []
        if (syncErrors.length > 0) continue // skip async if sync fails

        for (const [ruleKey, validator] of Object.entries(fieldAsyncValidators)) {
          asyncController.schedule(
            fieldName,
            ruleKey,
            values[fieldName],
            validator,
            debounceMs,
            () => {
              // onStart: set $pending
              if (fields.value[fieldName]) {
                fields.value[fieldName] = { ...fields.value[fieldName], $pending: true }
              }
            },
            (fName, rKey, isAsyncValid) => {
              // onComplete: update $error
              if (fields.value[fName]) {
                const current = fields.value[fName]
                const newError = { ...current.$error }
                if (!isAsyncValid) {
                  newError[rKey] = true
                } else {
                  delete newError[rKey]
                }
                const overallValid = current.errors.length === 0 && !Object.values(newError).some(Boolean)
                fields.value[fName] = {
                  ...current,
                  $pending: false,
                  $error: newError,
                  $valid: overallValid,
                  $invalid: !overallValid,
                  isValid: overallValid,
                }
              }
            }
          )
        }
      }
    }

    return result
  }

  // Track previous values for change detection
  const previousValues = ref({ ...unref(formValues) })

  const reset = () => {
    isResetting = true

    initialValues.value = { ...unref(formValues) }
    engine.reset()
    $submitted.value = false
    hasUserInput.value = false
    asyncController.abortAll()
    manualValidity.value = {}

    const resetFields: Record<string, FieldState> = {}
    knownFields.value.forEach((fieldName) => {
      resetFields[fieldName] = makeInitialFieldState(fieldName, true, [], {})
    })
    fields.value = resetFields

    errors.value = {}
    isValid.value = true
    summary.value = []

    previousValues.value = { ...unref(formValues) }

    Promise.resolve().then(() => {
      isResetting = false
    })
  }

  const touch = (fieldName: string) => {
    if (fields.value[fieldName]) {
      const f = fields.value[fieldName]
      fields.value[fieldName] = { ...f, isTouched: true, $touched: true, $untouched: false }
    }
  }

  const touchAll = () => {
    const updatedFields: Record<string, FieldState> = {}
    Object.entries(fields.value).forEach(([fieldName, f]) => {
      updatedFields[fieldName] = { ...f, isTouched: true, $touched: true, $untouched: false }
    })
    fields.value = updatedFields
  }

  // Register a field dynamically (for directives)
  const registerField = (fieldName: string) => {
    engine.addField(fieldName)
    knownFields.value.add(fieldName)
    if (!fields.value[fieldName]) {
      fields.value[fieldName] = makeInitialFieldState(fieldName, true, [], {})
    }
  }

  // Unregister a field (for v-if removal)
  const unregisterField = (fieldName: string) => {
    engine.removeField(fieldName)
    knownFields.value.delete(fieldName)
    const newFields = { ...fields.value }
    delete newFields[fieldName]
    fields.value = newFields
  }

  // Helper to create a rule instance by name string
  function createRuleByName(ruleName: string): IValidationRule {
    const tempEngine = new FormValidationEngine({ _: [ruleName] })
    const rules = tempEngine.getFieldEngine('_')?.getRules() ?? []
    if (rules.length === 0) {
      throw new Error(`Unknown rule: ${ruleName}`)
    }
    return rules[0]
  }

  // Register a rule dynamically (for directives)
  const registerRule = (fieldName: string, ruleKey: string, rule: string | { rule: string, params: any, message?: string } | IValidationRule) => {
    // Ensure field exists
    if (!engine.getFieldEngine(fieldName)) {
      engine.addField(fieldName)
      knownFields.value.add(fieldName)
    }
    const fieldEngine = engine.getFieldEngine(fieldName)!

    if (typeof rule === 'object' && 'isValid' in rule) {
      // IValidationRule instance — use key overload
      fieldEngine.addRule(ruleKey, rule as IValidationRule)
    } else if (typeof rule === 'string') {
      // String rule name — create instance and register under ruleKey
      fieldEngine.addRule(ruleKey, createRuleByName(rule))
    } else {
      // Config object
      fieldEngine.addRule(rule as { rule: string, params: any, message?: string })
    }

    if (!fields.value[fieldName]) {
      fields.value[fieldName] = makeInitialFieldState(fieldName, true, [], {})
    }
  }

  // Unregister a rule (for v-if removal or dynamic toggle)
  const unregisterRule = (fieldName: string, ruleKey: string) => {
    const fieldEngine = engine.getFieldEngine(fieldName)
    if (fieldEngine) {
      fieldEngine.removeRule(ruleKey)
    }
  }

  // Form-level computed state
  const $valid = computed(() => {
    return Object.values(fields.value).every(f => f.$valid && !f.$pending)
  })

  const $invalid = computed(() => !$valid.value)

  const $pristine = computed(() => {
    return Object.values(fields.value).every(f => f.$pristine)
  })

  const $dirty = computed(() => !$pristine.value)

  const $pending = computed(() => {
    return Object.values(fields.value).some(f => f.$pending)
  })

  const $error = computed<Record<string, Record<string, boolean>>>(() => {
    const result: Record<string, Record<string, boolean>> = {}
    Object.entries(fields.value).forEach(([fieldName, f]) => {
      if (Object.keys(f.$error).length > 0) {
        result[fieldName] = f.$error
      }
    })
    return result
  })

  const $submit = async (callback: () => void | Promise<void>): Promise<void> => {
    $submitted.value = true
    touchAll()
    validate(unref(formValues))

    // Wait for async validators if pending
    if ($pending.value) {
      await new Promise<void>(resolve => {
        const check = () => {
          if (!$pending.value) {
            resolve()
          } else {
            setTimeout(check, 50)
          }
        }
        check()
      })
    }

    if ($valid.value) {
      await callback()
    }
  }

  const $validate = async (): Promise<boolean> => {
    validate(unref(formValues))

    if ($pending.value) {
      await new Promise<void>(resolve => {
        const check = () => {
          if (!$pending.value) {
            resolve()
          } else {
            setTimeout(check, 50)
          }
        }
        check()
      })
    }

    return $valid.value
  }

  const $setPristine = () => {
    $submitted.value = false
    hasUserInput.value = false
    initialValues.value = { ...unref(formValues) }
    const updatedFields: Record<string, FieldState> = {}
    Object.entries(fields.value).forEach(([fieldName, f]) => {
      updatedFields[fieldName] = {
        ...f,
        isDirty: false,
        isTouched: false,
        $dirty: false,
        $pristine: true,
        $touched: false,
        $untouched: true,
      }
    })
    fields.value = updatedFields
  }

  const $setUntouched = () => {
    const updatedFields: Record<string, FieldState> = {}
    Object.entries(fields.value).forEach(([fieldName, f]) => {
      updatedFields[fieldName] = {
        ...f,
        isTouched: false,
        $touched: false,
        $untouched: true,
      }
    })
    fields.value = updatedFields
  }

  const $setDirty = () => {
    hasUserInput.value = true
    const updatedFields: Record<string, FieldState> = {}
    Object.entries(fields.value).forEach(([fieldName, f]) => {
      updatedFields[fieldName] = {
        ...f,
        isDirty: true,
        $dirty: true,
        $pristine: false,
      }
    })
    fields.value = updatedFields
  }

  const $setValidity = (fieldName: string, key: string, isValidOverride: boolean) => {
    if (!manualValidity.value[fieldName]) {
      manualValidity.value[fieldName] = {}
    }
    if (isValidOverride) {
      delete manualValidity.value[fieldName][key]
    } else {
      manualValidity.value[fieldName][key] = false
    }

    // Update field state immediately
    if (fields.value[fieldName]) {
      const f = fields.value[fieldName]
      const newError = { ...f.$error }
      if (!isValidOverride) {
        newError[key] = true
      } else {
        delete newError[key]
      }
      const overallValid = f.errors.length === 0 && !Object.values(newError).some(Boolean)
      fields.value[fieldName] = {
        ...f,
        $error: newError,
        $valid: overallValid,
        $invalid: !overallValid,
        isValid: overallValid,
      }
    }
  }

  const $noteUserInput = () => {
    hasUserInput.value = true
  }

  const $reset = (values?: Record<string, any>) => {
    if (values) {
      const fv = unref(formValues) as Record<string, any>
      Object.assign(fv, values)
    }
    reset()
  }

  const cssClasses = computed(() => {
    return {
      'v-submitted': $submitted.value,
      'v-valid': $valid.value,
      'v-invalid': $invalid.value,
      'v-pristine': $pristine.value,
      'v-dirty': $dirty.value,
      'v-pending': $pending.value,
    }
  })

  // Initial validation
  if (shouldValidateOnMount) {
    validate(unref(formValues))
  } else {
    const initialFields: Record<string, FieldState> = {}
    knownFields.value.forEach((fieldName) => {
      initialFields[fieldName] = makeInitialFieldState(fieldName, true, [], {})
    })
    fields.value = initialFields
  }

  const getFieldErrors = (field: string): Ref<string[]> => {
    return computed(() => errors.value[field] || [])
  }

  const isFieldValid = (field: string): Ref<boolean> => {
    return computed(() => {
      const fieldErrors = errors.value[field] || []
      return fieldErrors.length === 0
    })
  }

  const isModelDirty = computed(() => {
    return Object.values(fields.value).some(field => field.isDirty)
  })

  watch(
    formValues,
    (newValues: Record<string, any>) => {
      if (isResetting) return

      // In 'interaction' mode a write before any user input is hydration,
      // not an edit — AngularJS never set $dirty for programmatic model
      // changes. Move the dirty baseline with the write so loaded data
      // compares clean.
      if (dirtyTracking === 'interaction' && !hasUserInput.value) {
        initialValues.value = { ...newValues }
      }

      if (validationStrategy === 'changed') {
        const changedFields = Object.keys(newValues).filter(
          (key) => newValues[key] !== previousValues.value[key]
        )

        if (changedFields.length === 0) return

        const updatedErrors: Record<string, string[]> = {}
        const updatedFields: Record<string, FieldState> = {}

        knownFields.value.forEach((field) => {
          if (changedFields.includes(field)) {
            const result = engine.validateField(field, newValues[field], newValues)
            updatedErrors[field] = result.errors
            updatedFields[field] = buildFieldState(field, result.errors.length === 0, result.errors, (result as any).errorsByRule ?? {}, fields.value[field])
          } else {
            updatedErrors[field] = errors.value[field] || []
            updatedFields[field] = fields.value[field] || makeInitialFieldState(field, true, [], {})
          }
        })

        errors.value = updatedErrors
        if (!fieldsEqual(fields.value, updatedFields)) {
          fields.value = updatedFields
        }

        const allErrors: string[] = []
        knownFields.value.forEach((field) => {
          const fieldErrors = updatedErrors[field] || []
          if (fieldErrors.length > 0) {
            allErrors.push(...fieldErrors.map(err => `${field}: ${err}`))
          }
        })

        summary.value = allErrors
        isValid.value = allErrors.length === 0

        previousValues.value = { ...newValues }
      } else {
        validate(newValues)
      }
    },
    { deep: true }
  )

  return {
    // NEW: Clean unified API
    fields,
    reset,
    touch,
    touchAll,

    // Form-level
    isValid,
    isModelDirty,
    summary,
    validate,

    // Engine access for custom rules
    engine,

    // DEPRECATED: Keep for backward compatibility
    errors,
    getFieldErrors,
    isFieldValid,

    // NEW: AngularJS FormController equivalent
    $submitted,
    $valid,
    $invalid,
    $pristine,
    $dirty,
    $pending,
    $error,
    $submit,
    $validate,
    $setPristine,
    $setUntouched,
    $setDirty,
    $setValidity,
    $reset,
    $noteUserInput,
    cssClasses,

    // NEW: directive-friendly API
    registerRule,
    unregisterRule,
    registerField,
    unregisterField,
  }
}
