# Test Specification: AngularJS Migration Layer for oop-validator

## Overview

**Existing**: 23 test files, 136 test cases, all passing.
**After implementation**: ~45 test files, ~400+ test cases.

**Rule**: All 136 existing tests must continue passing without modification. If a test needs changing due to the `RequiredValidationRule` behavioral fix, add a comment explaining why.

**Environment**:
- Core rules/engines: `node` environment (existing, unchanged)
- Vue composables: `node` environment (existing, uses `ref()` + `nextTick()` — no DOM needed)
- Vue directives: `jsdom` environment (NEW — needs DOM). Use per-file comment: `// @vitest-environment jsdom`

**Pattern**: Follow existing conventions — `describe`/`it` from vitest, `ref()`/`nextTick()` for reactivity, direct assertion (no test helpers or utilities).

---

## Test File Map

```
src/
  rules/
    # EXISTING (unchanged) — 18 rule test files + ValidationEngine + NullSafety
    RequiredValidationRule.test.ts          ← EXTEND (add non-string type tests)
    ValidationEngine.test.ts               ← EXTEND (add ruleKey, removeRule, errorsByRule tests)
    NullSafety.test.ts                     ← VERIFY still passes

    # NEW
    NumericMinValidationRule.test.ts
    NumericMaxValidationRule.test.ts
    NumberValidationRule.test.ts

  form/
    FormValidationEngine.test.ts           ← EXTEND (add removeRuleFromField, addField, removeField, fieldErrorsByRule)

  vue/
    useFormValidation.test.ts              ← EXTEND (add $error, $submitted, $pristine, $pending, $submit, $setValidity, async)
    useValidation.test.ts                  ← VERIFY still passes
    useForm.test.ts                        ← NEW (Proxy API, form registry, lifecycle)
    cssClasses.test.ts                     ← NEW

    directives/
      # ALL NEW — each directive gets its own test file
      vRequired.test.ts
      vMinlength.test.ts
      vMaxlength.test.ts
      vPattern.test.ts
      vMin.test.ts
      vMax.test.ts
      vType.test.ts
      vMessages.test.ts
      vMessage.test.ts
      vSubmit.test.ts
      vFormGroup.test.ts
      registry.test.ts
      fieldController.test.ts              ← shared listener controller tests
      install.test.ts

  integration/                             ← NEW directory
    form-lifecycle.test.ts                 ← full form mount/interact/unmount cycle
    dynamic-fields.test.ts                 ← v-if/v-for field add/remove
    async-validation.test.ts               ← async validators with debounce/cancel
    memory-leaks.test.ts                   ← event listener tracking
    backward-compat.test.ts                ← existing API still works identically
```

---

## Layer 1: Core Engine Tests

### `src/rules/ValidationEngine.test.ts` — EXTEND

Add a new describe block. Do NOT modify existing tests.

```ts
describe('ValidationEngine - ruleKey tracking', () => {

  it('should track ruleKey when adding rules by string name', () => {
    const engine = new ValidationEngine(['required', 'email'])
    const result = engine.validateValue('')
    expect(result.errorsByRule).toEqual({ required: true })
    // email passes for empty string, so only 'required' fails
  })

  it('should track ruleKey when adding rules by config object', () => {
    const engine = new ValidationEngine([
      { rule: 'min', params: { length: 5 }, message: 'Too short' }
    ])
    const result = engine.validateValue('ab')
    expect(result.errorsByRule).toEqual({ min: true })
  })

  it('should track ruleKey when adding IValidationRule instance with ruleKey set', () => {
    const rule = new RequiredValidationRule()
    rule.ruleKey = 'required'
    const engine = new ValidationEngine()
    engine.addRule(rule)
    const result = engine.validateValue('')
    expect(result.errorsByRule).toEqual({ required: true })
  })

  it('should track ruleKey with addRule(key, ruleInstance) overload', () => {
    const engine = new ValidationEngine()
    engine.addRule('myCustom', new RequiredValidationRule())
    const result = engine.validateValue('')
    expect(result.errorsByRule).toEqual({ myCustom: true })
  })

  it('should return empty errorsByRule when all rules pass', () => {
    const engine = new ValidationEngine(['required', 'email'])
    const result = engine.validateValue('test@example.com')
    expect(result.errorsByRule).toEqual({})
  })

  it('should return multiple keys in errorsByRule when multiple rules fail', () => {
    const engine = new ValidationEngine([
      'required',
      { rule: 'min', params: { length: 10 } },
      'email'
    ])
    const result = engine.validateValue('ab')
    expect(result.errorsByRule.min).toBe(true)
    expect(result.errorsByRule.email).toBe(true)
    expect(result.errorsByRule.required).toBeUndefined()  // 'ab' passes required
  })

  it('should still return errors as string[] (backward compat)', () => {
    const engine = new ValidationEngine(['required'])
    const result = engine.validateValue('')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors[0]).toBe('This field is required.')
    // Existing code doing { isValid, errors } = engine.validateValue(v) still works
  })
})

describe('ValidationEngine - removeRule', () => {

  it('should remove a rule by key', () => {
    const engine = new ValidationEngine(['required', 'email'])
    engine.removeRule('required')
    const result = engine.validateValue('')
    expect(result.isValid).toBe(true)  // empty passes email, and required is gone
  })

  it('should be a no-op for non-existent key', () => {
    const engine = new ValidationEngine(['required'])
    engine.removeRule('nonexistent')
    const result = engine.validateValue('')
    expect(result.isValid).toBe(false)  // required still there
  })

  it('should allow re-adding a removed rule', () => {
    const engine = new ValidationEngine(['required'])
    engine.removeRule('required')
    expect(engine.validateValue('').isValid).toBe(true)
    engine.addRule('required')
    expect(engine.validateValue('').isValid).toBe(false)
  })
})
```

### `src/rules/RequiredValidationRule.test.ts` — EXTEND

Add new tests for non-string types. Do NOT modify existing tests.

```ts
describe('RequiredValidationRule - non-string types', () => {

  it('should pass for number 0 (valid value)', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid(0 as any)
    expect(isValid).toBe(true)
  })

  it('should pass for positive numbers', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid(42 as any)
    expect(isValid).toBe(true)
  })

  it('should fail for NaN', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid(NaN as any)
    expect(isValid).toBe(false)
  })

  it('should pass for boolean true (checked checkbox)', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid(true as any)
    expect(isValid).toBe(true)
  })

  it('should fail for boolean false (unchecked checkbox)', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid(false as any)
    expect(isValid).toBe(false)
  })

  it('should fail for empty array', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid([] as any)
    expect(isValid).toBe(false)
  })

  it('should pass for non-empty array', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid([1, 2] as any)
    expect(isValid).toBe(true)
  })

  it('should fail for null', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid(null as any)
    expect(isValid).toBe(false)
  })

  it('should fail for undefined', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid(undefined as any)
    expect(isValid).toBe(false)
  })

  // Existing behavior preserved:
  it('should still fail for empty string', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid('')
    expect(isValid).toBe(false)
  })

  it('should still fail for whitespace-only string', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid('   ')
    expect(isValid).toBe(false)
  })

  it('should still pass for non-empty string', () => {
    const rule = new RequiredValidationRule()
    const [isValid] = rule.isValid('hello')
    expect(isValid).toBe(true)
  })
})
```

### `src/rules/NumericMinValidationRule.test.ts` — NEW

```ts
describe('NumericMinValidationRule', () => {

  it('should pass when value >= min', () => {
    const rule = new NumericMinValidationRule()
    rule.setParams({ value: 18 })
    expect(rule.isValid(18)[0]).toBe(true)
    expect(rule.isValid(25)[0]).toBe(true)
    expect(rule.isValid(100)[0]).toBe(true)
  })

  it('should fail when value < min', () => {
    const rule = new NumericMinValidationRule()
    rule.setParams({ value: 18 })
    expect(rule.isValid(17)[0]).toBe(false)
    expect(rule.isValid(0)[0]).toBe(false)
    expect(rule.isValid(-5)[0]).toBe(false)
  })

  it('should pass for null/undefined/empty (let required handle presence)', () => {
    const rule = new NumericMinValidationRule()
    rule.setParams({ value: 18 })
    expect(rule.isValid(null as any)[0]).toBe(true)
    expect(rule.isValid(undefined as any)[0]).toBe(true)
    expect(rule.isValid('')[0]).toBe(true)
  })

  it('should handle string numbers', () => {
    const rule = new NumericMinValidationRule()
    rule.setParams({ value: 10 })
    expect(rule.isValid('15' as any)[0]).toBe(true)
    expect(rule.isValid('5' as any)[0]).toBe(false)
  })

  it('should fail for non-numeric strings', () => {
    const rule = new NumericMinValidationRule()
    rule.setParams({ value: 0 })
    expect(rule.isValid('abc' as any)[0]).toBe(false)
  })

  it('should handle decimal values', () => {
    const rule = new NumericMinValidationRule()
    rule.setParams({ value: 0.5 })
    expect(rule.isValid(0.6)[0]).toBe(true)
    expect(rule.isValid(0.4)[0]).toBe(false)
  })

  it('should support custom error messages', () => {
    const rule = new NumericMinValidationRule()
    rule.setParams({ value: 18 })
    rule.setErrorMessage('Must be 18+')
    const [, msg] = rule.isValid(10)
    expect(msg).toBe('Must be 18+')
  })

  it('should match type "numericmin"', () => {
    const rule = new NumericMinValidationRule()
    expect(rule.isMatch('numericmin')).toBe(true)
    expect(rule.isMatch('min')).toBe(false)  // 'min' is string length
  })

  it('should have ruleKey "min"', () => {
    const rule = new NumericMinValidationRule()
    expect(rule.ruleKey).toBe('min')
  })
})
```

### `src/rules/NumericMaxValidationRule.test.ts` — NEW
Same pattern as NumericMin, testing `value <= max`. ~10 tests.

### `src/rules/NumberValidationRule.test.ts` — NEW

```ts
describe('NumberValidationRule', () => {

  it('should pass for valid integers', () => { ... })
  it('should pass for valid floats', () => { ... })
  it('should pass for zero', () => { ... })
  it('should pass for negative numbers', () => { ... })
  it('should fail for NaN', () => { ... })
  it('should fail for non-numeric strings', () => { ... })
  it('should pass for numeric strings like "123"', () => { ... })
  it('should pass for empty/null (let required handle)', () => { ... })
  it('should match type "number"', () => { ... })
  it('should have ruleKey "number"', () => { ... })
})
```

---

## Layer 2: FormValidationEngine Tests

### `src/form/FormValidationEngine.test.ts` — EXTEND

```ts
describe('FormValidationEngine - new methods', () => {

  it('removeRuleFromField should remove a specific rule from a field', () => {
    const engine = new FormValidationEngine({
      email: ['required', 'email']
    })
    engine.removeRuleFromField('email', 'required')
    const result = engine.validate({ email: '' })
    // '' passes email (empty passes), required is gone
    expect(result.fieldErrors.email).toEqual([])
  })

  it('addField should add a new field dynamically', () => {
    const engine = new FormValidationEngine({ name: ['required'] })
    engine.addField('email', ['required', 'email'])
    const result = engine.validate({ name: 'test', email: '' })
    expect(result.fieldErrors.email.length).toBeGreaterThan(0)
  })

  it('removeField should remove a field entirely', () => {
    const engine = new FormValidationEngine({ name: ['required'], email: ['required'] })
    engine.removeField('email')
    const result = engine.validate({ name: 'test' })
    expect(result.fieldErrors.email).toBeUndefined()
    expect(result.isValid).toBe(true)
  })

  it('getFieldEngine should return the ValidationEngine for a field', () => {
    const engine = new FormValidationEngine({ email: ['required'] })
    const fieldEngine = engine.getFieldEngine('email')
    expect(fieldEngine).toBeDefined()
    expect(fieldEngine?.getRules().length).toBe(1)
  })

  it('getFieldEngine should return undefined for non-existent field', () => {
    const engine = new FormValidationEngine({ email: ['required'] })
    expect(engine.getFieldEngine('name')).toBeUndefined()
  })

  it('validate should include fieldErrorsByRule in result', () => {
    const engine = new FormValidationEngine({
      email: ['required', 'email'],
      name: ['required']
    })
    const result = engine.validate({ email: 'bad', name: '' })
    expect(result.fieldErrorsByRule.email).toEqual({ email: true })
    expect(result.fieldErrorsByRule.name).toEqual({ required: true })
  })

  it('fieldErrorsByRule should be empty objects for valid fields', () => {
    const engine = new FormValidationEngine({ name: ['required'] })
    const result = engine.validate({ name: 'John' })
    expect(result.fieldErrorsByRule.name).toEqual({})
  })
})
```

---

## Layer 3: Vue Composable Tests

### `src/vue/useFormValidation.test.ts` — EXTEND

```ts
describe('useFormValidation - $error keyed object', () => {

  it('should populate $error with failing rule keys', async () => {
    const data = ref({ email: '' })
    const config = { email: ['required', 'email'] }
    const { fields } = useFormValidation(data, config)
    await nextTick()
    expect(fields.value.email.$error).toEqual({ required: true })
    // email passes for empty, only required fails
  })

  it('should have empty $error when field is valid', async () => {
    const data = ref({ email: 'test@example.com' })
    const config = { email: ['required', 'email'] }
    const { fields } = useFormValidation(data, config)
    await nextTick()
    expect(fields.value.email.$error).toEqual({})
  })

  it('should update $error reactively when value changes', async () => {
    const data = ref({ email: '' })
    const config = { email: ['required', 'email'] }
    const { fields } = useFormValidation(data, config)
    await nextTick()
    expect(fields.value.email.$error.required).toBe(true)

    data.value.email = 'bad'
    await nextTick()
    expect(fields.value.email.$error.required).toBeUndefined()
    expect(fields.value.email.$error.email).toBe(true)

    data.value.email = 'good@test.com'
    await nextTick()
    expect(fields.value.email.$error).toEqual({})
  })

  it('should include multiple failing rule keys in $error', async () => {
    const data = ref({ password: 'a' })
    const config = {
      password: ['required', { rule: 'min', params: { length: 8 } }, 'email']
    }
    const { fields } = useFormValidation(data, config)
    await nextTick()
    expect(fields.value.password.$error.min).toBe(true)
    expect(fields.value.password.$error.email).toBe(true)
    expect(fields.value.password.$error.required).toBeUndefined() // 'a' passes required
  })
})

describe('useFormValidation - AngularJS state aliases', () => {

  it('$pristine should be inverse of isDirty', async () => {
    const data = ref({ name: 'initial' })
    const { fields } = useFormValidation(data, { name: ['required'] })
    expect(fields.value.name.$pristine).toBe(true)
    expect(fields.value.name.$dirty).toBe(false)

    data.value.name = 'changed'
    await nextTick()
    expect(fields.value.name.$pristine).toBe(false)
    expect(fields.value.name.$dirty).toBe(true)
  })

  it('$untouched should be inverse of $touched', () => {
    const data = ref({ name: '' })
    const { fields, touch } = useFormValidation(data, { name: ['required'] })
    expect(fields.value.name.$untouched).toBe(true)
    expect(fields.value.name.$touched).toBe(false)

    touch('name')
    expect(fields.value.name.$untouched).toBe(false)
    expect(fields.value.name.$touched).toBe(true)
  })

  it('$invalid should be inverse of $valid', () => {
    const data = ref({ name: '' })
    const { fields } = useFormValidation(data, { name: ['required'] })
    expect(fields.value.name.$valid).toBe(false)
    expect(fields.value.name.$invalid).toBe(true)
  })

  it('$name should match the field key', () => {
    const data = ref({ email: '' })
    const { fields } = useFormValidation(data, { email: ['required'] })
    expect(fields.value.email.$name).toBe('email')
  })
})

describe('useFormValidation - $submitted and $submit', () => {

  it('$submitted should be false initially', () => {
    const data = ref({ name: '' })
    const result = useFormValidation(data, { name: ['required'] })
    expect(result.$submitted.value).toBe(false)
  })

  it('$submit should set $submitted to true', async () => {
    const data = ref({ name: '' })
    const result = useFormValidation(data, { name: ['required'] })
    const callback = vi.fn()
    await result.$submit(callback)
    expect(result.$submitted.value).toBe(true)
  })

  it('$submit should NOT call callback when form is invalid', async () => {
    const data = ref({ name: '' })
    const result = useFormValidation(data, { name: ['required'] })
    const callback = vi.fn()
    await result.$submit(callback)
    expect(callback).not.toHaveBeenCalled()
  })

  it('$submit should call callback when form is valid', async () => {
    const data = ref({ name: 'John' })
    const result = useFormValidation(data, { name: ['required'] })
    const callback = vi.fn()
    await result.$submit(callback)
    expect(callback).toHaveBeenCalledOnce()
  })

  it('$submit should touchAll so all errors become visible', async () => {
    const data = ref({ name: '', email: '' })
    const result = useFormValidation(data, { name: ['required'], email: ['required'] })
    await result.$submit(vi.fn())
    expect(result.fields.value.name.isTouched).toBe(true)
    expect(result.fields.value.email.isTouched).toBe(true)
  })

  it('$setPristine should reset $submitted and all field dirty/touched state', async () => {
    const data = ref({ name: 'test' })
    const result = useFormValidation(data, { name: ['required'] })
    result.touch('name')
    await result.$submit(vi.fn())
    expect(result.$submitted.value).toBe(true)

    result.$setPristine()
    expect(result.$submitted.value).toBe(false)
    expect(result.fields.value.name.$pristine).toBe(true)
    expect(result.fields.value.name.$untouched).toBe(true)
  })
})

describe('useFormValidation - form-level computed state', () => {

  it('form.$valid should be true when all fields valid', () => {
    const data = ref({ name: 'John', email: 'j@test.com' })
    const result = useFormValidation(data, { name: ['required'], email: ['required', 'email'] })
    expect(result.$valid.value).toBe(true)
    expect(result.$invalid.value).toBe(false)
  })

  it('form.$valid should be false when any field invalid', () => {
    const data = ref({ name: '', email: 'j@test.com' })
    const result = useFormValidation(data, { name: ['required'], email: ['required'] })
    expect(result.$valid.value).toBe(false)
    expect(result.$invalid.value).toBe(true)
  })

  it('form.$pristine should be true when all fields pristine', () => {
    const data = ref({ name: 'a', email: 'b' })
    const result = useFormValidation(data, { name: ['required'], email: ['required'] })
    expect(result.$pristine.value).toBe(true)
    expect(result.$dirty.value).toBe(false)
  })

  it('form.$dirty should be true when any field is dirty', async () => {
    const data = ref({ name: 'a', email: 'b' })
    const result = useFormValidation(data, { name: ['required'], email: ['required'] })
    data.value.name = 'changed'
    await nextTick()
    expect(result.$dirty.value).toBe(true)
  })

  it('form.$error should aggregate all field errors', () => {
    const data = ref({ name: '', email: 'bad' })
    const result = useFormValidation(data, { name: ['required'], email: ['required', 'email'] })
    expect(result.$error.value.name).toEqual({ required: true })
    expect(result.$error.value.email).toEqual({ email: true })
  })
})

describe('useFormValidation - $setValidity', () => {

  it('should manually set a validity key on a field', () => {
    const data = ref({ email: 'test@test.com' })
    const result = useFormValidation(data, { email: ['required', 'email'] })
    // Everything passes, but server says email is taken:
    result.$setValidity('email', 'uniqueEmail', false)
    expect(result.fields.value.email.$error.uniqueEmail).toBe(true)
    expect(result.fields.value.email.$valid).toBe(false)
  })

  it('should clear a manually set validity key', () => {
    const data = ref({ email: 'test@test.com' })
    const result = useFormValidation(data, { email: ['required', 'email'] })
    result.$setValidity('email', 'uniqueEmail', false)
    result.$setValidity('email', 'uniqueEmail', true)
    expect(result.fields.value.email.$error.uniqueEmail).toBeUndefined()
    expect(result.fields.value.email.$valid).toBe(true)
  })
})

describe('useFormValidation - registerRule / unregisterRule (for directives)', () => {

  it('registerRule should add a rule to an existing field', async () => {
    const data = ref({ email: '' })
    const result = useFormValidation(data, {}, { validateOnMount: false })
    result.registerField('email')
    result.registerRule('email', 'required', 'required')
    result.validate()
    await nextTick()
    expect(result.fields.value.email.$error.required).toBe(true)
  })

  it('registerRule should create field if it does not exist', async () => {
    const data = ref({ name: '' })
    const result = useFormValidation(data, {}, { validateOnMount: false })
    result.registerRule('name', 'required', 'required')
    result.validate()
    await nextTick()
    expect(result.fields.value.name).toBeDefined()
    expect(result.fields.value.name.$error.required).toBe(true)
  })

  it('unregisterRule should remove a rule from a field', async () => {
    const data = ref({ email: '' })
    const result = useFormValidation(data, {}, { validateOnMount: false })
    result.registerRule('email', 'required', 'required')
    result.registerRule('email', 'email', 'email')
    result.unregisterRule('email', 'required')
    result.validate()
    await nextTick()
    expect(result.fields.value.email.$error.required).toBeUndefined()
  })

  it('unregisterField should remove field entirely from state', () => {
    const data = ref({ email: '' })
    const result = useFormValidation(data, {}, { validateOnMount: false })
    result.registerField('email')
    result.unregisterField('email')
    expect(result.fields.value.email).toBeUndefined()
  })
})

describe('useFormValidation - async validation', () => {

  it('should set $pending while async validator runs', async () => {
    let resolveValidator: (v: boolean) => void
    const asyncPromise = new Promise<boolean>(r => { resolveValidator = r })

    const data = ref({ email: 'test@test.com' })
    const result = useFormValidation(data, { email: ['required'] }, {
      asyncValidators: { email: { unique: () => asyncPromise } },
      validateOnMount: true,
    })

    await nextTick()
    expect(result.fields.value.email.$pending).toBe(true)
    expect(result.$pending.value).toBe(true)

    resolveValidator!(true)
    await nextTick()
    await nextTick()  // may need double tick for promise resolution

    expect(result.fields.value.email.$pending).toBe(false)
  })

  it('should add async error key to $error on failure', async () => {
    const data = ref({ email: 'taken@test.com' })
    const result = useFormValidation(data, { email: ['required'] }, {
      asyncValidators: { email: { unique: async () => false } },
      validateOnMount: true,
    })
    await nextTick()
    await nextTick()
    expect(result.fields.value.email.$error.unique).toBe(true)
  })

  it('should NOT run async validators if sync validators fail', async () => {
    const asyncFn = vi.fn().mockResolvedValue(true)
    const data = ref({ email: '' })
    const result = useFormValidation(data, { email: ['required'] }, {
      asyncValidators: { email: { unique: asyncFn } },
      validateOnMount: true,
    })
    await nextTick()
    expect(asyncFn).not.toHaveBeenCalled()  // required fails, async skipped
  })

  it('should cancel previous async validation when value changes', async () => {
    let callCount = 0
    const data = ref({ email: 'a@test.com' })
    const result = useFormValidation(data, { email: ['required'] }, {
      asyncValidators: {
        email: {
          unique: async (v) => {
            callCount++
            await new Promise(r => setTimeout(r, 100))
            return v !== 'taken@test.com'
          }
        }
      },
      debounce: 50,
    })

    // Change value rapidly — only last should complete
    data.value.email = 'b@test.com'
    await nextTick()
    data.value.email = 'c@test.com'
    await nextTick()
    data.value.email = 'd@test.com'
    await nextTick()

    // Wait for debounce + async to complete
    await new Promise(r => setTimeout(r, 300))
    await nextTick()

    // Only the last value should have been validated (previous cancelled)
    // Implementation detail: exact callCount depends on debounce behavior
    expect(result.fields.value.email.$pending).toBe(false)
  })
})
```

### `src/vue/useForm.test.ts` — NEW

```ts
describe('useForm - Proxy API', () => {

  it('form.fieldName should return field state', () => {
    const data = reactive({ email: '' })
    const form = useForm('test', data)
    // After directives register rules (simulated):
    form.registerRule('email', 'required', 'required')
    form.validate()
    expect(form.email.$error.required).toBe(true)
    expect(form.email.$valid).toBe(false)
  })

  it('form.$valid should return form-level validity', () => {
    const data = reactive({ name: 'John' })
    const form = useForm('test', data)
    form.registerRule('name', 'required', 'required')
    form.validate()
    expect(form.$valid).toBe(true)
  })

  it('form.$submitted should be reactive', async () => {
    const data = reactive({ name: 'John' })
    const form = useForm('test', data)
    form.registerRule('name', 'required', 'required')
    expect(form.$submitted).toBe(false)
    await form.$submit(() => {})
    expect(form.$submitted).toBe(true)
  })

  it('form.engine should expose FormValidationEngine', () => {
    const data = reactive({ name: '' })
    const form = useForm('test', data)
    expect(form.engine).toBeDefined()
    expect(typeof form.engine.validate).toBe('function')
  })

  it('form.nonExistentField should return undefined', () => {
    const data = reactive({ name: '' })
    const form = useForm('test', data)
    expect(form.nonExistentField).toBeUndefined()
  })
})
```

### `src/vue/cssClasses.test.ts` — NEW

```ts
describe('computeFieldClasses', () => {

  it('should include v-valid when field is valid', () => {
    const classes = computeFieldClasses({ $valid: true, $invalid: false, ... })
    expect(classes['v-valid']).toBe(true)
    expect(classes['v-invalid']).toBe(false)
  })

  it('should include per-rule classes', () => {
    const classes = computeFieldClasses({
      $error: { required: true, email: false },
      ...
    })
    expect(classes['v-invalid-required']).toBe(true)
    expect(classes['v-valid-required']).toBe(false)
    expect(classes['v-invalid-email']).toBe(false)
    expect(classes['v-valid-email']).toBe(true)
  })

  it('should include touched/untouched classes', () => { ... })
  it('should include pristine/dirty classes', () => { ... })
  it('should include pending class', () => { ... })
})

describe('computeFormClasses', () => {
  it('should aggregate form-level classes', () => { ... })
  it('should include v-submitted when form is submitted', () => { ... })
})
```

---

## Layer 4: Directive Tests

All directive tests use `// @vitest-environment jsdom` and mount real DOM elements.

**Shared test helper** (`src/vue/directives/__tests__/helpers.ts`):

```ts
import { createApp, reactive, ref, nextTick } from 'vue'
import { VValidationPlugin } from '../install'
import { useForm } from '../../useForm'

/**
 * Mounts a test app with a form, returns utilities for testing.
 * Cleans up automatically via afterEach.
 */
export function mountTestForm(template: string, setupFn: () => Record<string, any>) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    setup: setupFn,
    template,
  })
  app.use(VValidationPlugin)
  const vm = app.mount(container)

  const cleanup = () => {
    app.unmount()
    container.remove()
  }

  return { vm, container, app, cleanup }
}
```

### `src/vue/directives/vRequired.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-required directive', () => {

  it('should register required rule on mount', async () => { ... })
  it('should add v-invalid CSS class when empty', async () => { ... })
  it('should add v-valid CSS class when filled', async () => { ... })
  it('should mark field as touched on blur', async () => { ... })
  it('should mark field as dirty on input', async () => { ... })
  it('should remove rule when binding changes to false', async () => { ... })
  it('should re-add rule when binding changes back to true', async () => { ... })
  it('should remove event listeners on unmount', async () => { ... })
  it('should unregister rule on unmount', async () => { ... })
  it('should warn if input has no name attribute', async () => { ... })
  it('should warn if input is not inside a form', async () => { ... })
  it('should work with checkbox (false = invalid)', async () => { ... })
})
```

### `src/vue/directives/vMinlength.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-minlength directive', () => {

  it('should register min rule with correct length param', async () => { ... })
  it('should pass for strings >= minlength', async () => { ... })
  it('should fail for strings < minlength', async () => { ... })
  it('should pass for empty value (required handles presence)', async () => { ... })
  it('should update rule when binding value changes', async () => { ... })
  it('should not add duplicate listeners for same element', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `src/vue/directives/vMaxlength.test.ts` — NEW
Same pattern as vMinlength. ~7 tests.

### `src/vue/directives/vPattern.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-pattern directive', () => {

  it('should register regex rule with RegExp binding', async () => { ... })
  it('should register regex rule with string binding', async () => { ... })
  it('should fail when value does not match pattern', async () => { ... })
  it('should pass when value matches pattern', async () => { ... })
  it('should pass for empty value', async () => { ... })
  it('should update pattern when binding changes', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `src/vue/directives/vMin.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-min directive', () => {

  it('should register NumericMinValidationRule (not MinValidationRule)', async () => { ... })
  it('should pass for numeric value >= min', async () => { ... })
  it('should fail for numeric value < min', async () => { ... })
  it('should pass for empty (required handles presence)', async () => { ... })
  it('should update when binding value changes', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `src/vue/directives/vMax.test.ts` — NEW
Same pattern. ~6 tests.

### `src/vue/directives/vType.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-type directive', () => {

  it('should register email rule for type="email"', async () => { ... })
  it('should register url rule for type="url"', async () => { ... })
  it('should register number rule for type="number"', async () => { ... })
  it('should register date rule for type="date"', async () => { ... })
  it('should not register anything for type="text"', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `src/vue/directives/vMessages.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-messages directive', () => {

  it('should show only the first matching error by default', async () => { ... })
  it('should show all matching errors with .multiple modifier', async () => { ... })
  it('should hide all children when no errors match', async () => { ... })
  it('should respect DOM order for priority', async () => { ... })
  it('should update when $error changes reactively', async () => { ... })
  it('should add v-messages-active class when messages visible', async () => { ... })
  it('should add v-messages-inactive class when no messages', async () => { ... })
  it('should handle dynamic v-message keys', async () => { ... })
  it('should clean up on unmount', async () => { ... })
})
```

### `src/vue/directives/vMessage.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-message directive', () => {

  it('should register with parent v-messages container', async () => { ... })
  it('should start hidden', async () => { ... })
  it('should become visible when error key matches', async () => { ... })
  it('should hide when error key no longer matches', async () => { ... })
  it('should support dynamic key binding', async () => { ... })
  it('should unregister from parent on unmount', async () => { ... })
})
```

### `src/vue/directives/vSubmit.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('v-submit directive', () => {

  it('should prevent default form submission', async () => { ... })
  it('should set form.$submitted to true', async () => { ... })
  it('should call callback when form is valid', async () => { ... })
  it('should NOT call callback when form is invalid', async () => { ... })
  it('should touch all fields on submit', async () => { ... })
  it('should remove submit listener on unmount', async () => { ... })
})
```

### `src/vue/directives/fieldController.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('shared FieldController', () => {

  it('should create one blur listener for multiple directives on same input', async () => {
    // Mount input with v-required + v-minlength + v-pattern
    // Spy on addEventListener
    // Assert blur was added exactly once
  })

  it('should create one input listener for multiple directives on same input', async () => {
    // Same — assert input listener added once
  })

  it('should increment directiveCount for each directive', () => { ... })

  it('should decrement directiveCount on directive unmount', () => { ... })

  it('should remove listeners when directiveCount reaches 0', async () => {
    // Mount input with v-required + v-minlength
    // Use v-if to remove the element
    // Spy on removeEventListener
    // Assert blur and input listeners were removed
  })

  it('should NOT remove listeners while other directives still active', async () => {
    // This tests a partial unmount scenario (if that's even possible)
    // More relevant: removing one directive from a v-if while another stays
  })

  it('should add change listener for checkbox inputs', async () => {
    // Mount <input type="checkbox" v-required>
    // Assert change listener was added
  })

  it('should remove change listener for checkbox on cleanup', async () => { ... })
})
```

### `src/vue/directives/registry.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('formRegistry', () => {

  it('should store form instance keyed by form element', () => { ... })
  it('should return undefined for unregistered form', () => { ... })
  it('should allow overwriting (re-mount same form)', () => { ... })
  it('should not leak — entry GCd when element removed', () => {
    // This is a WeakMap property — hard to test directly
    // But we can verify the entry is gone after delete
  })
})

describe('messagesRegistry', () => {
  it('should store messages context keyed by container element', () => { ... })
  it('should track child elements and their error keys', () => { ... })
})
```

---

## Layer 5: Integration Tests

### `src/integration/form-lifecycle.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('Form lifecycle - mount to unmount', () => {

  it('should create form state on mount, destroy on unmount', async () => {
    // Mount component with useForm + inputs with v-required
    // Assert form.email exists, form.$valid is computed
    // Unmount
    // Assert formRegistry no longer has the form element
  })

  it('full flow: pristine → dirty → touched → submit → reset', async () => {
    // 1. Mount form with required email field
    // 2. Assert: $pristine=true, $dirty=false, $touched=false, $submitted=false
    // 3. Simulate typing → assert: $dirty=true, $pristine=false
    // 4. Simulate blur → assert: $touched=true
    // 5. Simulate submit with invalid data → assert: $submitted=true, callback not called
    // 6. Fix the data, submit again → callback called
    // 7. Call $reset() → assert: everything back to initial
  })

  it('$error should update through full validation lifecycle', async () => {
    // 1. Empty field → $error = { required: true }
    // 2. Type 'ab' → $error = { minlength: true } (required gone)
    // 3. Type 'abc' → $error = {} (all pass)
    // 4. Clear field → $error = { required: true }
  })
})
```

### `src/integration/dynamic-fields.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('Dynamic fields - v-if', () => {

  it('should register field when v-if becomes true', async () => { ... })
  it('should unregister field when v-if becomes false', async () => { ... })
  it('form.$valid should recompute without removed field', async () => { ... })
  it('should not leave stale $error for removed field', async () => { ... })
  it('should re-register field when v-if toggles back to true', async () => { ... })
})

describe('Dynamic fields - v-for', () => {

  it('should register fields for each v-for item', async () => { ... })
  it('should unregister fields when items are spliced', async () => { ... })
  it('should handle adding new items', async () => { ... })
  it('form.$valid should reflect all dynamic fields', async () => { ... })
})

describe('Slotted fields - inputs inside wrapper components', () => {

  it('should find <form> through wrapper component slots', async () => {
    // Mount: <form> → <WrapperComponent> → <slot> → <input v-required>
    // Assert: input registers with the form, form.fieldName exists
  })

  it('should find <form> through deeply nested slots', async () => {
    // Mount: <form> → <Layout> → <slot> → <Panel> → <slot> → <input v-required>
    // Assert: el.closest('form') still finds the form through all layers
  })

  it('should work with named slots', async () => {
    // Mount: <FormField> with <template #default> containing <input v-required>
    // Assert: input registers correctly
  })

  it('should work with v-if inside slots', async () => {
    // Mount: <form> → <Wrapper> → <slot> → <template v-if="show"> → <input v-required>
    // Toggle show true/false
    // Assert: field registers/unregisters correctly
  })

  it('should NOT work when Teleport moves input outside form', async () => {
    // Mount: <form> → <Teleport to="body"> → <input v-required>
    // Assert: input does NOT register (closest('form') returns null)
    // Assert: console.warn fired
  })
})
```

### `src/integration/async-validation.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('Async validation integration', () => {

  it('should show pending state during async check', async () => { ... })
  it('should show async error in v-messages', async () => { ... })
  it('should cancel stale async when value changes rapidly', async () => { ... })
  it('should respect debounce timing', async () => { ... })
  it('should abort all async on component unmount', async () => { ... })
  it('should not update state after abort', async () => { ... })
})
```

### `src/integration/memory-leaks.test.ts` — NEW

```ts
// @vitest-environment jsdom
describe('Memory leak prevention', () => {

  it('should not leak blur listeners on v-if toggle', async () => {
    const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    // Mount component with v-if="show" on an input
    // Toggle show to false
    // Assert removeEventListener called for blur with same handler ref
    // Assert addSpy and removeSpy call counts match for blur

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('should not leak input listeners on v-if toggle', async () => {
    // Same pattern for input listener
  })

  it('should not leak listeners on repeated v-for add/remove cycles', async () => {
    const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    // Mount with v-for="item in items"
    // Add 5 items, remove 5 items, add 3, remove 3
    // Assert: total adds === total removes for blur + input

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('should not leak when component unmounts with active fields', async () => {
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    // Mount component with 5 inputs each having v-required + v-minlength
    // Unmount the entire component
    // Assert removeEventListener called for every blur + input handler

    removeSpy.mockRestore()
  })

  it('should not accumulate listeners on v-required toggle', async () => {
    const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener')

    // Mount input with v-required="show"
    // Toggle show true→false→true→false→true 10 times
    // Assert addEventListener called for blur/input only ONCE (shared controller stays)

    addSpy.mockRestore()
  })

  it('should clear debounce timers on unmount', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')

    // Mount form with async validation and debounce
    // Type something (starts debounce timer)
    // Unmount before timer fires
    // Assert clearTimeout was called

    clearSpy.mockRestore()
  })

  it('should abort in-flight async requests on unmount', async () => {
    let abortSignalAborted = false

    // Mount form with async validator that checks signal
    // Start typing (triggers async)
    // Unmount while async is in-flight
    // Assert the abort controller was triggered

    // Implementation: the async validator receives AbortSignal
  })
})
```

### `src/integration/backward-compat.test.ts` — NEW

```ts
describe('Backward compatibility', () => {

  it('validateValue() still returns { isValid, errors } (extra errorsByRule ignored)', () => {
    const engine = new ValidationEngine(['required'])
    const result = engine.validateValue('')
    const { isValid, errors } = result  // existing destructure pattern
    expect(typeof isValid).toBe('boolean')
    expect(Array.isArray(errors)).toBe(true)
  })

  it('FormValidationEngine.validate() still returns fieldErrors as string[]', () => {
    const engine = new FormValidationEngine({ name: ['required'] })
    const result = engine.validate({ name: '' })
    expect(Array.isArray(result.fieldErrors.name)).toBe(true)
    expect(typeof result.fieldErrors.name[0]).toBe('string')
  })

  it('FieldState still has isValid, errors, isDirty, isTouched', () => {
    const data = ref({ name: '' })
    const { fields } = useFormValidation(data, { name: ['required'] })
    const field = fields.value.name
    expect('isValid' in field).toBe(true)
    expect('errors' in field).toBe(true)
    expect('isDirty' in field).toBe(true)
    expect('isTouched' in field).toBe(true)
  })

  it('getRules() still returns IValidationRule[]', () => {
    const engine = new ValidationEngine(['required', 'email'])
    const rules = engine.getRules()
    expect(Array.isArray(rules)).toBe(true)
    rules.forEach(rule => {
      expect(typeof rule.isValid).toBe('function')
      expect(typeof rule.isMatch).toBe('function')
    })
  })

  it('useFormValidation deprecated API still works (errors, getFieldErrors, isFieldValid)', () => {
    const data = ref({ name: '' })
    const { errors, getFieldErrors, isFieldValid } = useFormValidation(data, { name: ['required'] })
    expect(errors.value.name).toContain('This field is required.')
    expect(getFieldErrors('name').value).toContain('This field is required.')
    expect(isFieldValid('name').value).toBe(false)
  })

  it('addRule(string) still works (single arg)', () => {
    const engine = new ValidationEngine()
    engine.addRule('required')
    expect(engine.validateValue('').isValid).toBe(false)
  })

  it('addRule(config) still works', () => {
    const engine = new ValidationEngine()
    engine.addRule({ rule: 'min', params: { length: 5 } })
    expect(engine.validateValue('ab').isValid).toBe(false)
  })

  it('addRule(IValidationRule) still works', () => {
    const engine = new ValidationEngine()
    engine.addRule(new RequiredValidationRule())
    expect(engine.validateValue('').isValid).toBe(false)
  })

  it('addRuleToField still works', () => {
    const engine = new FormValidationEngine({ name: ['required'] })
    engine.addRuleToField('name', new EmailValidationRule())
    const result = engine.validate({ name: 'notanemail' })
    expect(result.fieldErrors.name.length).toBeGreaterThan(0)
  })
})
```

---

## Test Configuration Update

### `vitest.config.ts` — MODIFY

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // Default environment for non-DOM tests
    environment: 'node',
    // Override for directive/integration tests that need DOM
    environmentMatchGlobs: [
      ['src/vue/directives/**/*.test.ts', 'jsdom'],
      ['src/integration/**/*.test.ts', 'jsdom'],
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

Also add `jsdom` to devDependencies in `package.json`:
```json
"devDependencies": {
  "jsdom": "^25.0.0",
  // ... existing
}
```

---

## Test Count Summary

| Layer | File(s) | New Tests | Total |
|---|---|---|---|
| Existing (unchanged) | 23 files | 0 | 136 |
| RequiredValidationRule extension | 1 file | ~13 | |
| ValidationEngine extension | 1 file | ~12 | |
| New rules (3 files) | 3 files | ~25 | |
| FormValidationEngine extension | 1 file | ~8 | |
| useFormValidation extension | 1 file | ~35 | |
| useForm (new) | 1 file | ~8 | |
| cssClasses (new) | 1 file | ~10 | |
| Directives (12 files) | 12 files | ~80 | |
| Registry + controller | 2 files | ~12 | |
| Integration (4 files) | 4 files | ~35 | |
| Backward compat | 1 file | ~10 | |
| **TOTAL** | **~45 files** | **~250 new** | **~386** |
