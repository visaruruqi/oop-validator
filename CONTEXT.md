# oop-validator — Project Context

> Local reference file. NOT tracked by git (listed in .gitignore).

---

## Overview

**oop-validator** is a framework-agnostic TypeScript validation library published to npm.
It follows an OOP class hierarchy for validation rules and exposes both a pure JS API and optional Vue 3 composables.

- **npm package:** `oop-validator`
- **Current version:** 0.5.8
- **License:** MIT
- **Author:** Visar Uruqi
- **Repo:** https://github.com/visaruruqi/oop-validator

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| TypeScript | ^5.9.3 | Language |
| Vite | ^7.1.9 | Build tool (lib mode) |
| Vitest | ^3.2.4 | Test runner |
| Vue 3 | ^3.5.22 | Optional peer dep (composables only) |
| @vitejs/plugin-vue | ^6.0.1 | Vue SFC support |

---

## Project Structure

```
oop-validator/
├── src/
│   ├── index.ts                     # Main public export barrel
│   ├── main.ts                      # Vue dev app entry (not part of lib)
│   ├── App.vue                      # Dev playground component
│   ├── shims-vue.d.ts               # Vue module type declaration
│   ├── vite-env.d.ts
│   ├── assets/
│   │   └── style.css
│   ├── components/
│   │   └── ValidationForm.vue       # Dev playground form
│   ├── rules/
│   │   ├── IValidationRule.ts       # Base class (abstract-like)
│   │   ├── ValidationEngine.ts      # Core engine - validates a single value
│   │   ├── index.ts                 # Rule barrel (internal use)
│   │   ├── RequiredValidationRule.ts
│   │   ├── MinValidationRule.ts
│   │   ├── MaxValidationRule.ts
│   │   ├── EmailValidationRule.ts
│   │   ├── DomainValidationRule.ts
│   │   ├── RegexValidationRule.ts
│   │   ├── BankAccountValidationRule.ts
│   │   ├── CreditCardValidationRule.ts
│   │   ├── ZipCodeValidationRule.ts
│   │   ├── PhoneNumberValidationRule.ts
│   │   ├── DateValidationRule.ts
│   │   ├── UrlValidationRule.ts
│   │   ├── UsernameValidationRule.ts
│   │   ├── PasswordStrengthValidationRule.ts
│   │   ├── IpAddressValidationRule.ts
│   │   ├── CurrencyValidationRule.ts
│   │   ├── SocialSecurityValidationRule.ts
│   │   ├── MatchFieldValidationRule.ts  # Cross-field (uses setContext)
│   │   └── *.test.ts                    # Vitest test files per rule
│   ├── form/
│   │   ├── FormValidationEngine.ts      # Multi-field validation engine
│   │   └── FormValidationEngine.test.ts
│   └── vue/
│       ├── useValidation.ts             # Composable: single-field reactive validation
│       ├── useValidation.test.ts
│       ├── useFormValidation.ts         # Composable: multi-field form validation
│       └── useFormValidation.test.ts
├── index.html                           # Dev app entry
├── vite.config.ts                       # Build config (lib mode)
├── vitest.config.ts                     # Test config
├── package.json
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## Architecture

### Class Hierarchy

```
IValidationRule (base class)
  ├── RequiredValidationRule
  ├── MinValidationRule
  ├── MaxValidationRule
  ├── EmailValidationRule
  ├── DomainValidationRule
  ├── RegexValidationRule
  ├── BankAccountValidationRule
  ├── CreditCardValidationRule
  ├── ZipCodeValidationRule
  ├── PhoneNumberValidationRule
  ├── DateValidationRule
  ├── UrlValidationRule
  ├── UsernameValidationRule
  ├── PasswordStrengthValidationRule
  ├── IpAddressValidationRule
  ├── CurrencyValidationRule
  ├── SocialSecurityValidationRule
  └── MatchFieldValidationRule  (also implements optional setContext())
```

### IValidationRule Interface (base class)

Every validation rule must implement:

```ts
isValid(param: string): [boolean, string]     // [isValid, errorMessage]
isMatch(type: string): boolean                 // matches rule string identifier
setParams(params: any): void                   // configure rule params
setErrorMessage(message: string): void         // override error message

// Optional — for cross-field validation:
setContext?(values: Record<string, any>): void
```

### ValidationEngine (`src/rules/ValidationEngine.ts`)

Manages a list of rules for a single field/value. Internally stateful since v0.5.0.

**Key methods:**
- `constructor(rules: Array<string | { rule, params, message? } | IValidationRule>)`
- `validateValue(value: any): { isValid: boolean, errors: string[] }`
- `addRule(rule)` — adds a built-in string rule, config object, or custom IValidationRule instance
- `getErrors()` / `getIsValid()` — stateful getters (no re-validation)
- `reset()` — clears stored state
- `getRules()` — returns rule array (used by FormValidationEngine for context injection)

**Rule string → class mapping (switch in createRule):**

| String key | Class |
|---|---|
| `required` | RequiredValidationRule |
| `min` | MinValidationRule |
| `max` | MaxValidationRule |
| `email` | EmailValidationRule |
| `domain` | DomainValidationRule |
| `regex` | RegexValidationRule |
| `bankaccount` | BankAccountValidationRule |
| `creditcard` | CreditCardValidationRule |
| `zipcode` | ZipCodeValidationRule |
| `phone` | PhoneNumberValidationRule |
| `date` | DateValidationRule |
| `url` | UrlValidationRule |
| `username` | UsernameValidationRule |
| `password` | PasswordStrengthValidationRule |
| `ip` | IpAddressValidationRule |
| `currency` | CurrencyValidationRule |
| `ssn` | SocialSecurityValidationRule |
| `matchfield` | MatchFieldValidationRule |

> Note: the `matchfield` rule is NOT in the switch (it lives in FormValidationEngine context). It is added via config object or custom addRule.

### FormValidationEngine (`src/form/FormValidationEngine.ts`)

Wraps one `ValidationEngine` per field. Supports cross-field rules via `setContext`.

**Key types:**
```ts
type FieldRules = Array<string | { rule, params, message? } | IValidationRule>
type FormConfig = Record<string, FieldRules>

interface FormValidationResult {
  isValid: boolean
  fieldErrors: Record<string, string[]>
  summary: string[]   // "fieldName: error message" prefixed strings
}
```

**Key methods:**
- `validate(values)` — validates all fields, injects context into rules with `setContext`
- `validateField(fieldName, value, allValues?)` — validates single field with context
- `addRuleToField(fieldName, rule)` — add custom rule to one field; warns if field missing
- `reset()` — calls `reset()` on all internal ValidationEngine instances

---

## Vue Composables

### useValidation (`src/vue/useValidation.ts`)

Single-field reactive validation. Watches a `Ref<any>` and re-validates on change.

```ts
useValidation(value: Ref<any>, rules: UseValidationRule[])
// Returns: { errors: Ref<string[]>, isValid: Ref<boolean>, validate: (value?) => boolean }
```

### useFormValidation (`src/vue/useFormValidation.ts`)

Multi-field form validation with full state management. Built on `FormValidationEngine`.

```ts
useFormValidation(formValues, config, options?)
// options: { validationStrategy: 'all'|'changed', validateOnMount: boolean }
```

**Returns (current/recommended API):**
```ts
fields: Ref<Record<string, {
  isValid: boolean,
  errors: string[],
  isDirty: boolean,    // changed from initial value
  isTouched: boolean   // user has interacted (blur)
}>>
isValid: Ref<boolean>
isModelDirty: Ref<boolean>   // true if any field is dirty
summary: Ref<string[]>
validate: (values?) => FormValidationResult
reset: () => void            // resets state + prevents watcher re-fire
touch: (fieldName) => void
touchAll: () => void
engine: FormValidationEngine  // for adding custom rules
```

**Deprecated (backward-compat):** `errors`, `getFieldErrors()`, `isFieldValid()`

**Validation strategies:**
- `'all'` (default) — re-validates all fields on any change; safe for cross-field rules
- `'changed'` — only re-validates the changed field; better perf for large forms

**validateOnMount:**
- Default `true` (runs validation immediately on creation)
- Set `false` to wait for user interaction

**Reset guard:** `isResetting` flag prevents the watcher from re-triggering during `reset()`.

---

## Build Configuration

**Vite (lib mode):**
- Entry: `src/index.ts`
- Outputs: `dist/oop-validator.es.js` (ESM) + `dist/oop-validator.umd.js` (UMD)
- Vue is externalized (`external: ['vue']`) — not bundled
- TypeScript declarations emitted via `tsc --emitDeclarationOnly` → `dist/types/index.d.ts`
- Source maps enabled

**package.json exports:**
```json
{
  "main": "dist/oop-validator.umd.js",
  "module": "dist/oop-validator.es.js",
  "types": "dist/types/index.d.ts"
}
```

---

## Testing

- **Runner:** Vitest (`npm test`)
- **Environment:** node
- **Config:** `vitest.config.ts` (globals: true)
- Test files co-located with source: `*.test.ts` next to each rule/composable
- Notable test files:
  - `src/rules/NullSafety.test.ts` — cross-rule null/undefined safety suite
  - `src/form/FormValidationEngine.test.ts`
  - `src/vue/useValidation.test.ts`
  - `src/vue/useFormValidation.test.ts`
- **Total tests at v0.5.6:** 182 passing

---

## Null/Undefined Handling Convention

Decided at v0.3.2 — applied consistently:

- Rules that access `.length`, `.trim()`, or call constructors: **guard against null/undefined** (return `[true, ""]` to pass — let `required` handle presence)
- Regex-based rules that just call `.test()`: **no guard needed** (RegExp.test handles gracefully)
- `RequiredValidationRule`: returns `[false, error]` for null/undefined (it defines presence)
- `MinValidationRule` / `MaxValidationRule`: return `[true, ""]` for null/undefined

---

## Rule Behavior Notes

- **`regex` rule:** skips validation for empty string (validates format, not presence)
- **`matchfield` rule:** uses `setContext(values)` to access sibling field value by name, OR accepts a getter function; supports config via `params.otherField` (string) or `params.getter` (function)
- **`min`/`max`:** `params.length` for string length; both reject non-string types
- **All format rules** (email, url, phone, etc.): pass on empty/null (delegate presence to `required`)

---

## Custom Rule Pattern

```ts
class MyRule extends IValidationRule {
  private errorMessage = 'Custom error'

  isValid(param: any): [boolean, string] {
    const valid = /* logic */
    return [valid, valid ? '' : this.errorMessage]
  }
  isMatch(type: string): boolean { return type.toLowerCase() === 'myrule' }
  setParams(params: any): void { /* optional */ }
  setErrorMessage(message: string): void { this.errorMessage = message }
}

// Pure JS usage:
const engine = new ValidationEngine(['required'])
engine.addRule(new MyRule())

// Vue composable usage:
const { engine } = useFormValidation(formData, config, { validateOnMount: false })
engine.addRuleToField('fieldName', new MyRule())
```

---

## Version History Summary

| Version | Key Changes |
|---------|-------------|
| 0.5.8 | Current (bump) |
| 0.5.6 | Fixed reset() watcher re-fire bug; FormValidationEngine.reset() added |
| 0.5.5 | Exposed `engine` from useFormValidation; addRuleToField() with warnings |
| 0.5.4 | isModelDirty computed property |
| 0.5.3 | TypeScript support for all reactive types (reactive, computed, props) |
| 0.5.2 | unref() for broader reactive type support |
| 0.5.0 | Unified `fields` API; touch/touchAll/reset; stateful ValidationEngine |
| 0.4.0 | validationStrategy option; validateOnMount; validateField() |
| 0.3.2 | Null safety refinement |
| 0.3.0 | HMR fix; null safety across all rules; useFormValidation composable |
| 0.2.0 | FormValidationEngine; MatchFieldValidationRule; all domain-specific rules |
| 0.1.1 | RegexValidationRule tests & exports |
| 0.0.7 | Initial release (required, min, max, email, domain) |

---

## Known Patterns / Gotchas

1. **Custom rules in config string** — don't reference a custom rule string name in config (e.g., `'myRule'`) — it will hit the `default` switch case and log a warning. Add custom rules programmatically via `engine.addRule()` or `engine.addRuleToField()`.

2. **matchfield rule string** — `'matchField'` as a string config key does NOT work through the switch (there's no case for it). Use the class directly or a config object with `params.otherField`.

3. **Vue peer dep is optional** — the lib bundles Vue composables but Vue is external. The composables import from 'vue' at runtime. In non-Vue environments only import core classes.

4. **`src/rules/index.ts` is internal** — uses `@/rules/RegexValidationRule` alias. Not the public export barrel (`src/index.ts`).

5. **Two dev entry points** — `src/main.ts` + `App.vue` + `ValidationForm.vue` are for the local Vite dev server only; they are not part of the published library.
