# Claude Code Prompt: AngularJS FormController Equivalent for oop-validator + Vue 3

## The Goal

In AngularJS, you wrote directives on HTML and a `FormController` appeared on `$scope` automatically — tracking every field, every rule, every state change. No boilerplate. We want the same experience in Vue 3.

**The one constraint**: Vue 3 directives cannot inject reactive state into the template scope (unlike AngularJS where directives could write to `$scope`). So we need exactly **one line** in `<script setup>` to create the form object. After that, everything else is automatic — directives handle field registration, rule creation, model tracking, dirty/touched/error state, and CSS classes behind the scenes.

**This is what we're building:**

```vue
<script setup>
import { reactive } from 'vue'
import { useForm } from 'oop-validator'

const user = reactive({ name: '', email: '', age: null, password: '' })
const form = useForm('userForm', user)  // ← THE ONE LINE. Everything else is automatic.

function save() { console.log('Saving:', user) }
</script>

<template>
  <form name="userForm" v-submit="save" novalidate>

    <input type="text" v-model="user.name" name="name"
           v-required="true" v-minlength="3" v-maxlength="50" v-pattern="/^[a-zA-Z\s]*$/">
    <div v-messages="form.name.$error" v-show="form.name.$touched || form.$submitted">
      <span v-message="'required'">Name is required.</span>
      <span v-message="'minlength'">At least 3 characters.</span>
      <span v-message="'maxlength'">Max 50 characters.</span>
      <span v-message="'pattern'">Letters and spaces only.</span>
    </div>

    <input type="email" v-model="user.email" name="email" v-required="true" v-type>
    <div v-messages="form.email.$error" v-show="form.email.$touched || form.$submitted">
      <span v-message="'required'">Email is required.</span>
      <span v-message="'email'">Invalid email.</span>
    </div>

    <input type="number" v-model.number="user.age" name="age" v-required="true" v-min="18" v-max="120">
    <div v-messages="form.age.$error" v-show="form.age.$touched || form.$submitted">
      <span v-message="'required'">Age is required.</span>
      <span v-message="'min'">Must be at least 18.</span>
      <span v-message="'max'">Invalid age.</span>
    </div>

    <input type="password" v-model="user.password" name="password"
           v-required="true" v-minlength="8" v-maxlength="128">
    <div v-messages.multiple="form.password.$error"
         v-show="form.password.$touched || form.$submitted">
      <span v-message="'required'">Password is required.</span>
      <span v-message="'minlength'">At least 8 characters.</span>
      <span v-message="'maxlength'">Max 128 characters.</span>
    </div>

    <button type="submit" :disabled="form.$invalid">Submit</button>
  </form>
</template>
```

**Compare with the AngularJS original:**

```html
<form name="userForm" ng-submit="save()" novalidate>
  <input type="text" ng-model="user.name" name="name"
         ng-required="true" ng-minlength="3" ng-maxlength="50" ng-pattern="/^[a-zA-Z\s]*$/">
  <div ng-messages="userForm.name.$error" ng-show="userForm.name.$touched || userForm.$submitted">
    <span ng-message="required">Name is required.</span>
    ...
  </div>
  <button type="submit" ng-disabled="userForm.$invalid">Submit</button>
</form>
```

The only differences:
1. `const form = useForm('userForm', user)` in `<script setup>` (AngularJS did this implicitly)
2. `ng-` → `v-`, `form.name` instead of `userForm.name`, `v-message` values are quoted strings
3. `v-type` on email/number inputs (AngularJS inferred this from `type=""` automatically)

---

## How It Works Behind the Scenes

### `useForm('userForm', user)` does this:

1. Creates a `FormValidationEngine` internally (the existing oop-validator class)
2. Watches the `user` reactive object for changes (deep watch, like AngularJS's `$watch`)
3. Returns a reactive `form` proxy object with:
   - `form.$valid`, `form.$invalid`, `form.$pristine`, `form.$dirty`, `form.$submitted`, `form.$pending`
   - `form.$error` — aggregated `{ fieldName: { ruleName: true } }`
   - `form.name`, `form.email`, etc. — per-field state objects (created dynamically as directives register)
   - `form.$submit(fn)`, `form.$setPristine()`, `form.$setUntouched()`, `form.$reset()`
   - `form.engine` — the raw `FormValidationEngine` for advanced use
4. Provides itself via `provide('v-form', form)` so directives on child elements can find it

### When `v-required="true"` mounts on `<input name="email">`:

1. The directive reads `el.getAttribute('name')` → `'email'`
2. Injects the parent form via `inject('v-form')` — **BUT directives can't use inject**. So instead, `useForm()` stores itself in a module-level `WeakMap<HTMLFormElement, FormInstance>` keyed by the `<form>` element. The directive walks up the DOM to find the nearest `<form>` and looks it up.
3. Calls `form.registerRule('email', 'required', new RequiredValidationRule())` — this creates the per-field ValidationEngine if it doesn't exist, adds the rule, and creates the `form.email` reactive field state object
4. Hooks into `el` events: `blur` → `form.email.$setTouched()`, `input` → `form.email.$setDirty()` + re-validate
5. Auto-applies CSS classes to `el`: `v-valid`, `v-invalid`, `v-pristine`, `v-dirty`, `v-touched`, `v-untouched`
6. On `unmounted`: unregisters the rule (supports `v-if` dynamic fields)

### When `v-minlength="3"` mounts on the same `<input name="email">`:

1. Same lookup — finds form, finds field `'email'`
2. Calls `form.registerRule('email', 'minlength', { rule: 'min', params: { length: 3 } })` — adds to the SAME per-field engine
3. On `updated` (if binding value changes): rebuilds the rule with new params
4. On `unmounted`: unregisters just this rule

### When the user types in the email field:

1. `v-model` updates `user.email` (Vue native)
2. `useForm` is watching `user` deeply — detects the change
3. Runs the email field's `ValidationEngine.validateValue(user.email)`
4. Gets back `{ isValid, errors, errorsByRule: { required: false, minlength: true, email: true } }`
5. Updates `form.email.$error = { minlength: true, email: true }` (only failing rules)
6. Updates `form.email.$valid`, `form.email.$invalid`
7. Recomputes `form.$valid`, `form.$invalid` by aggregating all fields
8. Directives on the input update CSS classes automatically

### When the user submits:

`v-submit="save"` on the `<form>`:
1. Calls `event.preventDefault()`
2. Sets `form.$submitted = true` — this causes all `v-show="form.name.$touched || form.$submitted"` to become true, showing ALL errors
3. Calls `touchAll()` — marks every field as touched
4. Validates every field
5. If `form.$valid` → calls `save()`
6. If `form.$invalid` → does NOT call `save()`

---

## What Already Exists in oop-validator (DO NOT Rewrite)

The project: `/Users/visaruruqi/Desktop/projects/visaruruqi/oop-validator`

### Core Rules (`src/rules/`)
18 rule classes, all extending `IValidationRule`. Each has `isValid()`, `isMatch()` returning a hardcoded string identity, `setParams()`, `setErrorMessage()`. Key rules for this migration:
- `RequiredValidationRule` — `isMatch('required')` — **needs fix**: currently rejects all non-string values including valid numbers
- `MinValidationRule` — `isMatch('min')` — validates **string length** >= N (this is `v-minlength`)
- `MaxValidationRule` — `isMatch('max')` — validates **string length** <= N (this is `v-maxlength`)
- `RegexValidationRule` — `isMatch('regex')` — custom pattern (this is `v-pattern`)
- `EmailValidationRule` — `isMatch('email')` — email format
- `UrlValidationRule` — `isMatch('url')` — URL format
- `DateValidationRule` — `isMatch('date')` — YYYY-MM-DD format
- All 18 rules pass for empty/null values (except Required) — correct AngularJS behavior

### ValidationEngine (`src/rules/ValidationEngine.ts`)
- `private rules: IValidationRule[]` — flat array, NO key tracking
- `addRule(rule)` — adds by string name (factory switch), config object, or IValidationRule instance
- `validateValue(value): { isValid: boolean, errors: string[] }` — runs ALL rules, returns flat string[] (NO keyed errors)
- `getRules(): IValidationRule[]` — used by FormValidationEngine to call `setContext()`
- Stateful: `getIsValid()`, `getErrors()`, `reset()`
- No `removeRule()` method

### FormValidationEngine (`src/form/FormValidationEngine.ts`)
- `private engines: Record<string, ValidationEngine>` — one engine per field, **private** (no accessor)
- `validate(values): { isValid, fieldErrors: Record<string, string[]>, summary }`
- `validateField(fieldName, value, allValues?)`
- `addRuleToField(fieldName, rule)` — exists
- No `removeRuleFromField()`, no `addField()`, no `removeField()`, no `getFieldEngine()`

### useFormValidation (`src/vue/useFormValidation.ts`)
- `FieldState: { isValid, errors: string[], isDirty, isTouched }` — no `$error`, no `$pristine`, no `$pending`
- Returns: `{ fields, isValid, isModelDirty, summary, validate, reset, touch, touchAll, engine }`
- Deep-watches `formValues`, supports `'all'`/`'changed'` strategies
- No `$submitted`, no `$submit()`, no `$setPristine()`, no `$setValidity()`, no CSS classes, no async validation

### useValidation (`src/vue/useValidation.ts`)
- Single-field: `(value: Ref, rules[]) → { errors: Ref<string[]>, isValid, validate }`

---

## Exact Modifications Needed

### MODIFY: `src/rules/IValidationRule.ts`
Add `ruleKey` property with default empty string:
```ts
export default class IValidationRule {
    ruleKey: string = ''
    // all existing methods unchanged
}
```
**Not breaking**: additive property with default value. No existing code references `ruleKey`.

### MODIFY: `src/rules/RequiredValidationRule.ts`
Make `isValid()` handle non-string types (numbers, booleans, arrays):
```ts
isValid(param: any): [boolean, string] {
    if (param == null) return [false, this.errorMessage]
    if (typeof param === 'boolean') return [param, param ? '' : this.errorMessage]
    if (typeof param === 'number') return [!isNaN(param), isNaN(param) ? this.errorMessage : '']
    if (Array.isArray(param)) return [param.length > 0, param.length > 0 ? '' : this.errorMessage]
    if (typeof param === 'string') {
        const valid = param.trim().length > 0
        return [valid, valid ? '' : this.errorMessage]
    }
    return [true, '']
}
```
**Behavioral fix, not breaking**: `isValid(0)` was wrongly `false`, now correctly `true`. `isValid('')` still `false`. All string behavior identical. NullSafety tests (which only check "doesn't throw") still pass.

### MODIFY: `src/rules/ValidationEngine.ts`

Do NOT restructure the `rules` array. Add a parallel `Map` for key tracking:

```ts
export default class ValidationEngine {
    private rules: IValidationRule[] = []              // UNCHANGED
    private ruleKeyMap = new Map<IValidationRule, string>()  // NEW: parallel key tracking
    // ... existing stateful fields unchanged

    // EXISTING addRule — add key tracking to all code paths
    addRule(ruleOrKey: string | { rule: string, params: any, message?: string } | IValidationRule, ruleInstance?: IValidationRule) {
        if (ruleInstance !== undefined && typeof ruleOrKey === 'string') {
            // NEW overload: addRule('mykey', ruleInstance)
            ruleInstance.ruleKey = ruleOrKey
            this.rules.push(ruleInstance)
            this.ruleKeyMap.set(ruleInstance, ruleOrKey)
        } else if (typeof ruleOrKey === 'object' && 'isValid' in ruleOrKey) {
            // EXISTING: addRule(IValidationRule instance) — now also tracks key
            this.rules.push(ruleOrKey as IValidationRule)
            if ((ruleOrKey as any).ruleKey) {
                this.ruleKeyMap.set(ruleOrKey as IValidationRule, (ruleOrKey as any).ruleKey)
            }
        } else {
            // EXISTING: addRule('required') or addRule({ rule: 'min', params: ... })
            const newRule = this.createRule(ruleOrKey as any)
            if (newRule) {
                this.rules.push(newRule)
                const key = typeof ruleOrKey === 'string' ? ruleOrKey : (ruleOrKey as any).rule
                this.ruleKeyMap.set(newRule, key.toLowerCase())
            }
        }
    }

    // NEW
    removeRule(key: string): void {
        const idx = this.rules.findIndex(r => this.ruleKeyMap.get(r) === key)
        if (idx !== -1) {
            this.ruleKeyMap.delete(this.rules[idx])
            this.rules.splice(idx, 1)
        }
    }

    // EXISTING — extended return type (extra property ignored by existing consumers)
    validateValue(value: any): { isValid: boolean, errors: string[], errorsByRule: Record<string, boolean> } {
        const errors: string[] = []
        const errorsByRule: Record<string, boolean> = {}
        this.rules.forEach(rule => {
            const [valid, errorMessage] = rule.isValid(value)
            if (!valid) {
                errors.push(errorMessage)
                const key = this.ruleKeyMap.get(rule)
                if (key) errorsByRule[key] = true
            }
        })
        this.currentErrors = errors
        this.currentIsValid = errors.length === 0
        return { isValid: errors.length === 0, errors, errorsByRule }
    }

    getRules(): IValidationRule[] { return this.rules }  // COMPLETELY UNCHANGED
}
```

In `createRule()`, also set `ruleKey` on the created instance and register in switch: `'numericmin'`, `'numericmax'`, `'number'`.

**Not breaking**: `getRules()` unchanged. `validateValue()` return has extra `errorsByRule` property — TS and JS ignore extra properties on destructure. Existing `const { isValid, errors } = engine.validateValue(v)` still works. Verified against all 182+ tests.

### MODIFY: `src/form/FormValidationEngine.ts`
All additive methods, no existing methods changed:
```ts
removeRuleFromField(fieldName: string, ruleKey: string): void
addField(fieldName: string, rules: FieldRules): void
removeField(fieldName: string): void
getFieldEngine(fieldName: string): ValidationEngine | undefined
```
Extend `FormValidationResult` with `fieldErrorsByRule: Record<string, Record<string, boolean>>` — the `validate()` method now reads `errorsByRule` from each engine's `validateValue()` result. Existing `fieldErrors: Record<string, string[]>` unchanged.

### MODIFY: `src/vue/useFormValidation.ts`

This is the biggest change. Transform `useFormValidation` into the AngularJS FormController equivalent.

**New signature** (backward compatible — new params are optional):
```ts
useFormValidation(
    formValues: Ref<Record<string, any>> | Record<string, any>,
    config: FormConfig,
    options?: UseFormValidationOptions
)
```

**Extended `FieldState`** (all existing properties kept, new ones additive):
```ts
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
```

**Extended return type** (all existing returns kept):
```ts
export interface UseFormValidationResult {
    // EXISTING — all unchanged
    fields: Ref<Record<string, FieldState>>
    isValid: Ref<boolean>
    isModelDirty: Ref<boolean>
    summary: Ref<string[]>
    validate: (values?) => FormValidationResult
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
    $validate: () => Promise<boolean>   // validates all fields including async, returns overall validity
    $setPristine: () => void
    $setUntouched: () => void
    $setDirty: () => void
    $setValidity: (fieldName: string, key: string, isValid: boolean) => void
    $reset: (values?: Record<string, any>) => void
    cssClasses: ComputedRef<Record<string, boolean>>

    // NEW — directive-friendly API for registering/unregistering rules at runtime
    registerRule: (fieldName: string, ruleKey: string, rule: string | { rule: string, params: any, message?: string } | IValidationRule) => void
    unregisterRule: (fieldName: string, ruleKey: string) => void
    registerField: (fieldName: string) => void
    unregisterField: (fieldName: string) => void
}
```

**Add async validator support** via options:
```ts
export interface UseFormValidationOptions {
    validationStrategy?: 'all' | 'changed'
    validateOnMount?: boolean
    asyncValidators?: Record<string, Record<string, (value: any) => Promise<boolean>>>
    debounce?: number
}
```

### ADD: New `useForm` composable (`src/vue/useForm.ts`)

This is the **developer-facing** composable — a wrapper around `useFormValidation` that:
1. Takes `(formName: string, formData: Ref | reactive)` — simpler signature than `useFormValidation`
2. Auto-derives config from directives (starts with empty config, directives register rules at runtime via `registerRule`)
3. Provides itself for directives to find (module-level registry)
4. Returns a **Proxy** that allows `form.email.$error` syntax instead of `form.fields.value.email.$error`

```ts
export function useForm(name: string, formData: Ref<Record<string, any>> | Record<string, any>, options?) {
    const result = useFormValidation(formData, {}, { validateOnMount: false, ...options })

    // Async validation controller — tracks pending promises and debounce timers
    const asyncController = new AsyncValidationController()

    // Register in formRegistry on mount so directives can find this form
    onMounted(() => {
        const formEl = document.querySelector(`form[name="${name}"]`) as HTMLFormElement
        if (formEl) formRegistry.set(formEl, formInstance)
    })

    // CLEANUP on unmount — prevents memory leaks
    onUnmounted(() => {
        const formEl = document.querySelector(`form[name="${name}"]`) as HTMLFormElement
        if (formEl) formRegistry.delete(formEl)      // no stale form refs
        asyncController.abortAll()                     // cancel all pending async + timers
    })

    // Return a Proxy for AngularJS-style access: form.fieldName.$error
    return new Proxy(result, {
        get(target, prop: string) {
            if (prop.startsWith('$') || prop === 'engine' || prop === 'cssClasses') {
                return (target as any)[prop]
            }
            if (target.fields.value[prop]) {
                return target.fields.value[prop]
            }
            return (target as any)[prop]
        }
    })
}
```

This gives the developer:
```ts
form.$valid          // form-level validity
form.$submitted      // submission state
form.$submit(fn)     // submit handler
form.email.$error    // per-field $error object ← AngularJS syntax!
form.email.$touched  // per-field touched state
form.name.$pristine  // per-field pristine state
form.engine          // raw FormValidationEngine for advanced use
```

### ADD: 3 new rule classes
- `src/rules/NumericMinValidationRule.ts` — `isMatch('numericmin')`, `ruleKey = 'min'`, validates `Number(value) >= N`
- `src/rules/NumericMaxValidationRule.ts` — `isMatch('numericmax')`, `ruleKey = 'max'`, validates `Number(value) <= N`
- `src/rules/NumberValidationRule.ts` — `isMatch('number')`, `ruleKey = 'number'`, validates `!isNaN(Number(value))`

### ADD: CSS class computation (`src/vue/cssClasses.ts`)

### ADD: Vue directives (`src/vue/directives/`)

**CRITICAL: Event Listener Lifecycle — No Memory Leaks**

Every validation directive attaches DOM event listeners (`blur`, `input`, `change`). These MUST be removed on `unmounted` using the EXACT SAME function references. The architecture:

**Shared Field Controller Pattern**: When an `<input>` has multiple directives (`v-required` + `v-minlength` + `v-pattern`), do NOT attach 3×blur + 3×input = 6 listeners. Instead, the first directive to mount on an element creates a shared "field controller" that attaches ONE blur handler and ONE input handler. Subsequent directives increment a reference count. On `unmounted`, each directive decrements the count. When it reaches zero, the controller removes the listeners and unregisters the field.

```
src/vue/directives/
    registry.ts             # All WeakMaps for directive communication:
                            #   formRegistry: WeakMap<HTMLFormElement, FormInstance>
                            #   fieldControllers: WeakMap<HTMLElement, FieldController>
                            #   messagesRegistry: WeakMap<HTMLElement, MessagesContext>
                            #   directiveCleanups: WeakMap<HTMLElement, Map<string, CleanupEntry>>
```

**`registry.ts` — FieldController interface:**
```ts
interface FieldController {
    fieldName: string
    blurHandler: () => void        // stored reference for removeEventListener
    inputHandler: () => void       // stored reference for removeEventListener
    changeHandler?: () => void     // for checkbox/radio, stored reference
    directiveCount: number         // how many v-* directives are active on this element
}

// ensureFieldController(el, form, fieldName) → creates on first call, increments count on subsequent
// releaseFieldController(el, form) → decrements count, removes listeners + unregisters field when 0
```

**Why WeakMap for everything**: When the DOM element is garbage-collected (component unmount, v-if removal), the WeakMap entry is automatically collected too. No manual iteration/cleanup needed for the maps themselves. This is the same pattern Vue 3 internals use.

**Directive lifecycle contract — EVERY validation directive follows this:**

```ts
const vSomething: Directive<HTMLElement, any> = {
    mounted(el, binding) {
        // 1. Read field name from el.getAttribute('name')
        // 2. Walk up DOM to <form>, look up in formRegistry
        // 3. Call ensureFieldController(el, form, fieldName)  ← shared listeners
        // 4. Register this directive's rule: form.registerRule(fieldName, ruleKey, rule)
        // 5. Store ruleKey in directiveCleanups WeakMap for this element
        // 6. Initial CSS class update
    },
    updated(el, binding) {
        // 1. If binding.value === binding.oldValue → skip
        // 2. Unregister old rule, register new rule with updated params
        // 3. Re-validate field
        // 4. Update CSS classes
    },
    unmounted(el) {
        // 1. Unregister this directive's rule: form.unregisterRule(fieldName, ruleKey)
        // 2. Call releaseFieldController(el, form)  ← decrements count, removes listeners when 0
        // 3. Delete from directiveCleanups
    }
}
```

**Cleanup on `useForm` unmount**: `useForm()` calls `onUnmounted()` to:
1. Delete from `formRegistry` — no stale form references
2. Abort all pending async validations — no dangling promises
3. Clear all pending debounce timers — no orphan setTimeout callbacks
4. Vue auto-stops the `watch(formData, ...)` — no orphan watchers

**What gets cleaned up and when:**
- Component unmounts → `useForm.onUnmounted` + every directive's `unmounted` fires
- `v-if="false"` removes a field → directives on that element fire `unmounted`, rules unregistered, listeners removed, form.$valid recomputes without it
- `v-for` item removed → same as v-if, Vue removes DOM → directives unmount
- `v-required="false"` (dynamic toggle) → directive stays mounted, rule removed in `updated()`, listeners stay (still needed for $touched/$dirty tracking)

**Directive files:**
```
    vRequired.ts            # v-required → RequiredValidationRule
    vMinlength.ts           # v-minlength → MinValidationRule (string length)
    vMaxlength.ts           # v-maxlength → MaxValidationRule (string length)
    vPattern.ts             # v-pattern → RegexValidationRule
    vMin.ts                 # v-min → NumericMinValidationRule (numeric value)
    vMax.ts                 # v-max → NumericMaxValidationRule (numeric value)
    vType.ts                # v-type → reads el.type, registers email/url/number/date rule
    vMessages.ts            # v-messages container directive
    vMessage.ts             # v-message child directive
    vSubmit.ts              # v-submit on <form>
    vFormGroup.ts           # v-form-group for nested forms
    install.ts              # Vue plugin
```

### ADD: Plugin installer (`src/vue/directives/install.ts`)
### MODIFY: `src/index.ts` — add all new exports

---

## Slots, Wrapper Components, and Edge Cases

**Slots work.** When `<input v-required>` is inside a slot of a wrapper component like `<ScreenWrapper>`, `<FormField>`, `<TabPanel>`, etc., the rendered DOM is flat — Vue's slot projection is compile-time. The directive's `el.closest('form')` walks the real DOM tree and finds the `<form>` regardless of how many wrapper components the input is nested inside.

```html
<!-- This works — any depth of wrapper components -->
<form name="myForm" v-submit="save">
  <ScreenWrapper>          <!-- slot content projected into its <div> -->
    <FormSection>          <!-- another slot projection -->
      <TabPanel>           <!-- another -->
        <input name="code" v-model="data.code" v-required="true">  <!-- ← finds <form> ✅ -->
      </TabPanel>
    </FormSection>
  </ScreenWrapper>
</form>
```

**Two cases that do NOT work:**

1. **`<Teleport>`**: If an input is inside `<Teleport to="body">`, it's physically moved outside the `<form>` in the DOM. `el.closest('form')` returns null. The directive should `console.warn` and skip registration. Same limitation AngularJS had with transcluded content outside `ng-form` scope.

2. **`<form>` inside a child component but `useForm()` in the parent**: This can be fragile due to mount timing. Prefer calling `useForm()` in the same component that renders the `<form>` element, or inside the child component and `defineExpose({ form })` to the parent.

---

## Version Bump

**0.5.10 → 0.6.0** (semver minor)

Only behavioral change: `RequiredValidationRule` now correctly validates non-string types. Everything else is purely additive. Zero breaking changes on existing API surfaces. All 182+ existing tests continue passing.

## Critical Rules

- **One-line setup is the goal**: `const form = useForm('userForm', user)` — everything else happens via directives
- **`form.fieldName.$error`** syntax via Proxy — not `form.fields.value.fieldName.$error`
- **Use parallel `Map<IValidationRule, string>`** in ValidationEngine — do NOT restructure the `rules` array
- **Extend `validateValue()` return type** to include `errorsByRule` — do NOT create a separate method
- **`getRules()` return type completely unchanged** — `FormValidationEngine` depends on it
- **Directives auto-register/unregister rules** — the form starts with empty config, directives populate it at mount time
- **CSS classes auto-applied by directives** to host `<input>` elements — developer doesn't bind `:class`
- **All existing 136 tests must pass without modification**
- **Do NOT duplicate validation logic** — directives delegate to existing rule classes
- **Disabled inputs**: directives should check `el.disabled` — skip validation and exclude from form `$valid`. When `disabled` attribute changes, `updated` hook adds/removes rules. Matches AngularJS behavior.
- **Radio/Select event handling**: `<input type="radio">`, `<input type="checkbox">`, and `<select>` need `change` event listener (not just `input`). The shared FieldController must detect element type and attach the right events.
- **Multiple forms on same page**: `formRegistry` is keyed by `<form>` element, `el.closest('form')` scopes each input to its nearest form. No cross-contamination. Test this explicitly.
- **`v-submit` auto-adds `novalidate`**: The directive sets `el.setAttribute('novalidate', '')` in `mounted` so developers don't need to remember it.
- **TypeScript exports**: All new interfaces (`FieldState`, `UseFormResult`, etc.) must be re-exported from `src/index.ts`.
- **`$validate()` method**: Must exist on the form — validates all fields including async, returns `Promise<boolean>`. Needed for programmatic validation without submitting.

## Implementation Order

1. **Phase 1 — Core engine**: `ruleKey`, parallel Map, `removeRule()`, extended `validateValue()`, fix Required, 3 new rules, FormValidationEngine additions
2. **Phase 2 — Vue composable**: Extended FieldState, `useForm()` with Proxy, `$submitted`/`$submit`/`$setPristine`, `registerRule`/`unregisterRule`, async validation, CSS classes
3. **Phase 3 — Directives**: registry, shared FieldController, all `v-*` directives, plugin
4. **Phase 4 — Tests**: Follow the test specification (see `test-specification.md`). ~250 new tests across ~20 new test files. All 136 existing tests must pass without modification.
5. **Phase 5 — Docs**: README with AngularJS migration guide, CHANGELOG

## Testing Rules

- **See `test-specification.md`** for complete test file map and every test case.
- **See `gap-addendum.md`** for additional test cases found during final audit: vMaxlength, vMax, vFormGroup, $setDirty/$setUntouched, $validate, $reset extended, CSS class completeness, ng-messages-include, dynamic message keys, multiple forms, radio/select, disabled inputs, novalidate, transitions.
- **Target: ~409 total tests** across ~50 test files (136 existing + ~273 new).
- **Existing 136 tests must pass unchanged.** If the RequiredValidationRule behavioral fix causes a test to fail, it's a test that asserted wrong behavior — update with a comment explaining why.
- **Directive tests need `jsdom` environment**: use `// @vitest-environment jsdom` at the top of each directive test file. Add `jsdom` to devDependencies. Update `vitest.config.ts` with `environmentMatchGlobs`.
- **Memory leak tests**: spy on `addEventListener`/`removeEventListener` to verify exact count matching. Test `v-if` toggle, `v-for` add/remove, and full component unmount.
- **Async tests**: use `vi.fn()` for mock validators, `vi.useFakeTimers()` for debounce testing, verify cancellation via abort signals.
- **Backward compatibility tests**: verify every existing API surface (`validateValue()` destructure, `getRules()` return type, `FieldState` properties, deprecated `errors`/`getFieldErrors`/`isFieldValid`) still works identically.
- **Shared FieldController tests**: verify one blur + one input listener per element regardless of how many `v-*` directives are on it. For checkbox/radio/select, verify `change` listener is added. Verify count goes to zero on unmount.
- **Multiple forms test**: two `<form>` elements on same page, verify complete isolation.
- **Disabled input test**: disabled input excluded from form.$valid, re-enabled input re-included.

