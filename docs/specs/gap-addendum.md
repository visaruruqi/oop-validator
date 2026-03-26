# Gap Analysis Addendum

Audit of all deliverables found the following gaps. This addendum adds them. Claude Code should read this alongside `vue3-angularjs-validation-prompt.md` and `test-specification.md`.

---

## 1. Missing Test Coverage

### `vMaxlength` — test spec says "Same pattern" but no test cases written
```ts
// @vitest-environment jsdom
describe('v-maxlength directive', () => {
  it('should register max rule with correct length param', async () => { ... })
  it('should pass for strings <= maxlength', async () => { ... })
  it('should fail for strings > maxlength', async () => { ... })
  it('should pass for empty value', async () => { ... })
  it('should update rule when binding value changes', async () => { ... })
  it('should work on <textarea> elements', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `vMax` — same gap
```ts
describe('v-max directive', () => {
  it('should register NumericMaxValidationRule (not MaxValidationRule)', async () => { ... })
  it('should pass for numeric value <= max', async () => { ... })
  it('should fail for numeric value > max', async () => { ... })
  it('should pass for empty', async () => { ... })
  it('should update when binding value changes', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `vFormGroup` — listed in files but zero tests
```ts
describe('v-form-group directive', () => {
  it('should create a sub-form group', async () => { ... })
  it('sub-form $valid should aggregate into parent form.$valid', async () => { ... })
  it('sub-form $dirty should aggregate into parent form.$dirty', async () => { ... })
  it('sub-form fields should be accessible via form.groupName.fieldName', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `$setDirty`, `$setUntouched`, `$setTouched` — zero tests
```ts
describe('useFormValidation - state manipulation methods', () => {
  it('$setDirty should set form-level dirty state', () => {
    const data = ref({ name: 'initial' })
    const result = useFormValidation(data, { name: ['required'] })
    expect(result.$dirty.value).toBe(false)
    result.$setDirty()
    expect(result.$dirty.value).toBe(true)
  })

  it('$setUntouched should reset all fields to untouched', () => {
    const data = ref({ name: '', email: '' })
    const result = useFormValidation(data, { name: ['required'], email: ['required'] })
    result.touch('name')
    result.touch('email')
    expect(result.fields.value.name.$touched).toBe(true)
    result.$setUntouched()
    expect(result.fields.value.name.$untouched).toBe(true)
    expect(result.fields.value.email.$untouched).toBe(true)
  })

  it('$setTouched on a field should set it to touched', () => {
    // This is already covered by touch() but aliased as field.$setTouched()
    // if we expose it per-field
  })
})
```

### `$validate` method — zero coverage
```ts
describe('useFormValidation - $validate', () => {
  it('should validate all fields and return Promise<boolean>', async () => {
    const data = ref({ name: '', email: '' })
    const result = useFormValidation(data, { name: ['required'], email: ['required'] })
    const isValid = await result.$validate()
    expect(isValid).toBe(false)
  })

  it('should return true when all fields valid', async () => {
    const data = ref({ name: 'John', email: 'j@t.com' })
    const result = useFormValidation(data, { name: ['required'], email: ['required', 'email'] })
    const isValid = await result.$validate()
    expect(isValid).toBe(true)
  })

  it('should wait for async validators before resolving', async () => {
    const data = ref({ email: 'test@test.com' })
    const result = useFormValidation(data, { email: ['required'] }, {
      asyncValidators: { email: { unique: async () => { await new Promise(r => setTimeout(r, 50)); return true } } }
    })
    const isValid = await result.$validate()
    expect(isValid).toBe(true)
  })
})
```

### `$reset` — only 1 test, needs more
```ts
describe('useFormValidation - $reset extended', () => {
  it('should reset all fields to initial values', async () => { ... })
  it('should reset $submitted to false', async () => { ... })
  it('should reset all $touched to false', async () => { ... })
  it('should reset all $dirty to false', async () => { ... })
  it('should clear all $error objects', async () => { ... })
  it('should accept optional new initial values', async () => {
    const data = ref({ name: 'old' })
    const result = useFormValidation(data, { name: ['required'] })
    data.value.name = 'changed'
    await nextTick()
    result.$reset({ name: 'new initial' })
    expect(data.value.name).toBe('new initial')  // or however reset-with-values works
    expect(result.fields.value.name.$pristine).toBe(true)
  })
  it('should cancel pending async validations', async () => { ... })
})
```

### CSS class tests — v-pristine, v-dirty, v-touched, v-untouched, v-pending not tested
```ts
describe('computeFieldClasses - complete', () => {
  it('should include v-pristine when field is pristine', () => {
    const classes = computeFieldClasses({ $pristine: true, $dirty: false, ... })
    expect(classes['v-pristine']).toBe(true)
    expect(classes['v-dirty']).toBe(false)
  })
  it('should include v-dirty when field is dirty', () => { ... })
  it('should include v-touched when field is touched', () => { ... })
  it('should include v-untouched when field is untouched', () => { ... })
  it('should include v-pending when field is pending', () => { ... })
  it('should include v-submitted on form classes when submitted', () => { ... })
})
```

### `data-v-defaults` (ng-messages-include) — zero tests
```ts
describe('v-messages - default messages (ng-messages-include)', () => {
  it('should render default message when no local v-message matches', async () => { ... })
  it('should let local v-message override a default for the same key', async () => { ... })
  it('should support registerDefaultMessages() from setup', async () => { ... })
})
```

### Dynamic message keys (ng-message-exp) — zero tests
```ts
describe('v-message - dynamic keys', () => {
  it('should update visibility when key binding changes', async () => { ... })
  it('should unregister old key and register new key on update', async () => { ... })
})
```

---

## 2. Missing Scenarios

### Multiple forms on same page
```ts
describe('Multiple forms on same page', () => {
  it('should keep form state isolated between two forms', async () => {
    // Mount two <form> elements each with useForm
    // Invalid field in form1 should not affect form2.$valid
  })
  it('should not cross-register fields between forms', async () => {
    // An input inside form1 should register with form1, not form2
  })
})
```

### Radio buttons and select/dropdown
```ts
describe('v-required on radio buttons', () => {
  it('should fail when no radio option is selected', async () => { ... })
  it('should pass when a radio option is selected', async () => { ... })
  it('should attach change listener (not just input)', async () => { ... })
})

describe('v-required on select elements', () => {
  it('should fail when select has empty value', async () => { ... })
  it('should pass when select has a non-empty value', async () => { ... })
  it('should work with v-model on <select>', async () => { ... })
})
```

### Disabled inputs
AngularJS skipped validation on `disabled` inputs and excluded them from form validity.
```ts
describe('Disabled inputs', () => {
  it('should skip validation on disabled inputs', async () => { ... })
  it('disabled field should not affect form.$valid', async () => { ... })
  it('should resume validation when enabled again', async () => { ... })
})
```

### novalidate attribute
```ts
describe('novalidate', () => {
  it('form should have novalidate to disable HTML5 native validation', async () => {
    // Just document that v-submit or useForm should ensure novalidate is on the form
    // Or: v-submit could auto-add it
  })
})
```

### Error message animation
```ts
describe('v-message transitions', () => {
  it('should add v-message-enter-active class when showing', async () => { ... })
  it('should add v-message-leave-active class when hiding', async () => { ... })
  // These are CSS-only — just verify the classes are toggled
})
```

---

## 3. Missing from Prompt

### `$validate()` method
Not mentioned in the prompt's method table. Add to `UseFormValidationResult`:
```ts
$validate: () => Promise<boolean>  // validates all fields including async, returns overall validity
```

### Disabled input handling
Add to the prompt's Critical Rules or Edge Cases section:
- Directives should check `el.disabled` — if true, skip validation and exclude from form validity
- When `disabled` attribute changes (via `:disabled="expr"`), the `updated` hook should add/remove rules accordingly
- Matches AngularJS behavior where `ng-disabled` inputs were excluded from `$valid` computation

### Multiple forms on same page
Add to Slots/Edge Cases section:
- `formRegistry` is keyed by `<form>` element, so multiple `<form>` elements on the same page each get their own form instance
- `el.closest('form')` naturally scopes each input to its nearest `<form>` ancestor
- No cross-contamination between forms

### Radio buttons and `<select>`
Add to directive event handling:
- For `<input type="radio">` and `<input type="checkbox">`: listen to `change` event (not just `input`)
- For `<select>`: listen to `change` event
- The shared FieldController already accounts for this (adds `change` listener for checkbox/radio), but also needs to handle `<select>`

### `v-submit` auto-adding `novalidate`
The `v-submit` directive should auto-set `novalidate` attribute on the `<form>` element in its `mounted` hook, so the developer doesn't need to remember it. AngularJS did this automatically when `ng-submit` was present.

### Build configuration
The `vite.config.ts` entry point is `src/index.ts`. All new files must be importable from there. The directive files in `src/vue/directives/` will be tree-shaken by bundlers if not used — Vue users import `VValidationPlugin`, non-Vue users don't.

### TypeScript type exports
All new interfaces must be exported from `src/index.ts`:
```ts
export type { FieldState, UseFormValidationOptions, UseFormValidationResult } from './vue/useFormValidation'
export type { FormConfig, FieldRules, FormValidationResult } from './form/FormValidationEngine'
// New:
export type { UseFormResult } from './vue/useForm'
```

---

## 4. Updated Test Count

| Layer | Files | Tests |
|---|---|---|
| Existing (unchanged) | 23 | 136 |
| Core engine extensions | 3 extended + 3 new | ~50 |
| FormValidationEngine extension | 1 extended | ~8 |
| Vue composable extensions | 1 extended + 2 new | ~65 |
| Directive tests | 14 new | ~100 |
| Integration tests | 5 new | ~50 |
| **TOTAL** | **~50 files** | **~409** |
