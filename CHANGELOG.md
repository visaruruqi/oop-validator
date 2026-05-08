# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-05-08

### Added

- **Reactive CSS classes** — `v-invalid`, `v-valid`, `v-touched`, `v-invalid-{rule}` (and friends) now repaint on inputs whenever validation state changes programmatically. Calling `form.validate()`, `form.$validate()`, `form.$submit()`, `form.touch()`, or `form.touchAll()` from a button handler now updates the DOM immediately — no blur/input event required.
- **Form-level CSS classes** — the `<form>` element registered via `useForm()` now toggles aggregate state classes: `v-form-submitted`, `v-form-pristine`, `v-form-dirty`, `v-form-touched`, `v-form-untouched`, `v-form-pending`. Useful for whole-form styling (e.g. `form.v-form-touched { background: #fee }`).

### Notes

- `form.validate()` is still a pure validation call — it does **not** mark fields as touched and does **not** add `v-form-touched` / `v-form-submitted`. To reveal errors based on `.v-touched.v-invalid` styling rules, call `form.touchAll()` (or use `v-submit` / `form.$submit()`).
- No breaking changes. All existing class names and APIs are unchanged.

## [1.0.0] - 2026-03-27

First stable release. The public API is now considered production-ready.

### Breaking Changes

#### 1. Vue exports moved to `oop-validator/vue`

All Vue composables, directives, and the plugin are no longer exported from the root `oop-validator` entry point. They now live at the dedicated `oop-validator/vue` subpath.

This is a **tree-shaking improvement** — non-Vue consumers (React, Node.js, vanilla JS) no longer receive any Vue code in their bundles.

```ts
// ❌ Before (0.x) — Vue exports from root
import { useValidation, useFormValidation, useForm, VValidationPlugin } from 'oop-validator'

// ✅ Now — Vue exports from subpath
import { useValidation, useFormValidation, useForm, VueValidationPlugin } from 'oop-validator/vue'
```

**What still comes from the root** (unchanged):
```ts
import {
  ValidationEngine,
  FormValidationEngine,
  IValidationRule,
  RequiredValidationRule,
  // ... all rule classes
} from 'oop-validator'
```

#### 2. `VValidationPlugin` renamed to `VueValidationPlugin`

```ts
// ❌ Before
import { VValidationPlugin } from 'oop-validator'
app.use(VValidationPlugin)

// ✅ Now
import { VueValidationPlugin } from 'oop-validator/vue'
app.use(VueValidationPlugin)
```

### Added

- **Subpath exports** — `oop-validator` (core) and `oop-validator/vue` (Vue layer) as separate entry points
- **`dist/index.js`** — 2 KB core bundle, zero Vue dependency
- **`dist/vue.js`** — 26 KB Vue bundle, only loaded when explicitly imported
- `vue-router` moved from `dependencies` to `devDependencies` — no longer shipped to consumers

### Migration from 0.x

If you only use core classes (`ValidationEngine`, `FormValidationEngine`, rule classes) — **no changes needed**.

If you use Vue composables or directives, update two things:

1. Change import path from `'oop-validator'` to `'oop-validator/vue'`
2. Rename `VValidationPlugin` to `VueValidationPlugin`

```ts
// main.ts
import { VueValidationPlugin } from 'oop-validator/vue'    // ← /vue suffix
createApp(App).use(VueValidationPlugin).mount('#app')

// any component
import { useForm, useFormValidation } from 'oop-validator/vue'
```

## [0.6.0] - 2026-03-26

### Added — AngularJS Migration Layer

This release adds a full AngularJS `ng-form` / `FormController` equivalent for Vue 3, letting you migrate AngularJS forms to Vue 3 with minimal code changes.

#### Core Engine
- **`ruleKey` property on `IValidationRule`** — all rule instances now carry a key used for per-rule error tracking
- **`ValidationEngine.removeRule(key)`** — remove a rule from an engine at runtime
- **`ValidationEngine.validateValue()` returns `errorsByRule`** — `{ required: true, email: true }` alongside existing `errors[]`
- **`addRule(key, instance)` overload** — register a rule under a custom key
- **`FormValidationEngine` extensions**: `removeRuleFromField()`, `addField()`, `removeField()`, `getFieldEngine()`
- **`FormValidationResult.fieldErrorsByRule`** — per-field keyed error map in all `validate()` results

#### New Validation Rules
- **`NumericMinValidationRule`** — validates `Number(value) >= min` (maps to `v-min`)
- **`NumericMaxValidationRule`** — validates `Number(value) <= max` (maps to `v-max`)
- **`NumberValidationRule`** — validates that value is a valid number (maps to `v-type` on `type="number"`)

#### Vue Composable Extensions
- **Extended `FieldState`** — new properties: `$error`, `$valid`, `$invalid`, `$pristine`, `$dirty`, `$touched`, `$untouched`, `$pending`, `$name`
- **Form-level computed** — `$valid`, `$invalid`, `$pristine`, `$dirty`, `$pending`, `$error` aggregated from all fields
- **`$submitted`** — tracks whether the form has been submitted
- **`$submit(callback)`** — validates form, touchesAll, calls callback only when valid
- **`$validate()`** — programmatic full validation including async, returns `Promise<boolean>`
- **`$setPristine()`**, **`$setUntouched()`**, **`$setDirty()`** — state manipulation
- **`$setValidity(field, key, isValid)`** — manually inject/clear validation keys (server-side errors)
- **`$reset(values?)`** — reset form state with optional new values
- **`registerRule / unregisterRule / registerField / unregisterField`** — directive-friendly runtime API
- **Async validator support** — `asyncValidators` option with debounce and AbortController cancellation
- **`cssClasses` computed** — form-level CSS class object

#### New `useForm()` Composable
- **`useForm(name, data, options?)`** — wraps `useFormValidation` with a Proxy for AngularJS-style access
- `form.email.$error` instead of `form.fields.value.email.$error`
- Auto-registers/deregisters in `formRegistry` on mount/unmount
- Integrates with `v-*` directives via module-level WeakMap registry

#### Vue Directives
- **`v-required`** — `RequiredValidationRule`, supports dynamic `true`/`false` toggle
- **`v-minlength`** — `MinValidationRule` (string length)
- **`v-maxlength`** — `MaxValidationRule` (string length)
- **`v-pattern`** — `RegexValidationRule`, accepts string or `/regex/` syntax
- **`v-min`** — `NumericMinValidationRule` (numeric value)
- **`v-max`** — `NumericMaxValidationRule` (numeric value)
- **`v-type`** — dispatches email/url/date/number rules from `input[type]`
- **`v-messages`** — error message container, shows first match by default, `.multiple` modifier to show all
- **`v-message`** — per-rule error span, auto-shows/hides based on `$error`
- **`v-submit`** — intercepts form submit, auto-adds `novalidate`, calls `form.$submit(callback)`
- **`v-form-group`** — group container marker
- **`VueValidationPlugin`** — Vue plugin for `app.use(VueValidationPlugin)` to register all directives

#### Shared FieldController Architecture
- One blur + one input listener per `<input>` element, shared across all directives on that element
- Checkbox/radio/select use `change` listener
- Reference-counted cleanup — listeners removed when all directives unmount
- WeakMap-based storage (no memory leaks)

#### CSS Class Utilities
- **`computeFieldClasses(field)`** — returns `{ 'v-valid': true, 'v-invalid': false, ... }` for `:class` bindings
- **`computeFormClasses(state)`** — form-level class object including `v-submitted`
- Per-rule classes: `v-valid-required`, `v-invalid-email`, etc.

### Fixed
- **`RequiredValidationRule`** now correctly handles non-string types:
  - `number 0` → valid (was incorrectly `false`)
  - `boolean true` → valid (checked checkbox)
  - `boolean false` → invalid (unchecked checkbox)
  - `NaN` → invalid
  - `Array` → valid if non-empty, invalid if empty
  - All existing string behavior unchanged

### Zero Breaking Changes
All 142 existing tests pass unchanged. New `errorsByRule` property on `validateValue()` is additive and ignored by existing destructuring. All existing `FieldState` properties preserved.

## [0.5.6] - 2025-12-19
### Fixed
- **Reset with Custom Validation Rules**: Fixed issue where `reset()` would not properly clear errors when called after changing form values
  - Previously, changing a form value (e.g., clearing an input) and immediately calling `reset()` could result in errors reappearing due to the watcher re-validating
  - Now `reset()` properly prevents the watcher from re-validating during the reset operation
  - Added `isResetting` flag to block watcher execution during reset
  - This is particularly important when using custom validation rules with patterns like: validate → add to list → clear input → reset

### Added
- **FormValidationEngine.reset()**: New method to reset validation state for all field engines
  - `useFormValidation.reset()` now also resets the underlying `FormValidationEngine` state
  - Ensures complete state cleanup between validation cycles
  - 182 total tests passing

## [0.5.5] - 2025-11-07
### Added
- **Custom Validation Rules Support in Vue Composables**
  - Exposed `engine` property from `useFormValidation` for direct access to FormValidationEngine
  - Added `addRuleToField(fieldName, rule)` method for adding custom rules to specific fields
  - Enables dynamic addition of custom validation rules that implement `IValidationRule` interface
  - Custom rules can be added with custom error messages and parameters
  - Works with both ref() and reactive() form data

### Improved
- **Better Developer Experience for Custom Rules**
  - `addRuleToField()` now shows a helpful console warning when attempting to add a rule to a non-existent field
  - Warning message includes the list of available fields to help catch typos
  - Example: `"Cannot add rule to field "agee": field does not exist in validation config. Available fields: age, email"`

### Changed
- **API Simplification**: Removed `addRule()` method from `FormValidationEngine`
  - The `addRule()` method previously added custom rules to ALL fields indiscriminately
  - Now only `addRuleToField(fieldName, rule)` is available, requiring explicit field specification
  - This provides better control and clarity - if you need the same rule on multiple fields, call `addRuleToField()` for each field
  - More explicit API that prevents accidental rule application to unintended fields

### Example
```typescript
// Define a custom validation rule
class EvenNumberRule extends IValidationRule {
  isValid(value: any): [boolean, string] {
    const num = Number(value)
    return [num % 2 === 0, 'Value must be an even number']
  }
  isMatch(type: string): boolean {
    return type === 'evenNumber'
  }
  setParams(params: any): void {}
  setErrorMessage(message: string): void {}
}

// Use it in your Vue component - add to specific fields
const { fields, engine } = useFormValidation(formData, config)
engine.addRuleToField('age', new EvenNumberRule())
engine.addRuleToField('luckyNumber', new EvenNumberRule())
```

## [0.5.4] - 2025-10-20
### Added
- **Form-level Dirty State**: New `isModelDirty` computed property
  - Returns `true` if any field has changed from its initial value
  - Returns `false` when all fields match their initial values
  - Automatically updates when fields change or `reset()` is called
  - Perfect for "unsaved changes" warnings and enabling/disabling save buttons
  - Works with all reactive types (ref, reactive, computed, props)

## [0.5.3] - 2025-10-16
### Added
- **TypeScript Support for All Reactive Types**: Updated function signature to accept `Ref<T> | Record<string, any>`
  - Added 9 comprehensive tests for reactive(), computed(), readonly(), and props patterns
  - Full support for props.modelValue and nested reactive objects
  - All 162 tests passing with complete reactive type compatibility

## [0.5.2] - 2025-10-16
### Fixed
- **Vue Composable Flexibility**: `useFormValidation` now properly handles all reactive types
  - Uses Vue's `unref()` to support `Ref<T>`, `reactive()`, computed values, and props
  - Previously only worked with `Ref<T>` objects
  - Now works seamlessly with `props.modelValue`, `reactive()` objects, and any reactive reference
  - No breaking changes - existing code continues to work

## [0.5.1] - 2025-10-16
### Internal
- Code quality improvements

## [0.5.0] - 2025-10-16
### Added
- **Unified Fields API**: New `fields` object in `useFormValidation` Vue composable (recommended)
  - `fields.fieldName.isValid` - boolean indicating if field is valid
  - `fields.fieldName.errors` - array of error messages for the field
  - `fields.fieldName.isDirty` - boolean indicating if value changed from initial
  - `fields.fieldName.isTouched` - boolean indicating if field was focused/blurred
  - Cleaner, more intuitive API than separate `errors`, `getFieldErrors()`, `isFieldValid()`
  - All field state in one place, easier to extend in the future

- **Vue Form State Management**: New helper methods for better UX
  - `reset()` - Reset form to initial state (clears errors, isDirty, isTouched)
  - `touch(fieldName)` - Mark specific field as touched (useful for blur events)
  - `touchAll()` - Mark all fields as touched (useful for showing errors on submit)

- **Stateful JavaScript API**: New stateful methods in `ValidationEngine` class
  - `getIsValid()` - Get current validation status without re-validating
  - `getErrors()` - Get array of current error messages
  - `reset()` - Clear validation state (useful for resetting forms)
  - Validation state is automatically stored after calling `validateValue()`

### Changed
- Documentation restructured to promote new `fields` API as the recommended approach for Vue
- Old Vue API (`errors`, `getFieldErrors`, `isFieldValid`) marked as deprecated but fully supported for backward compatibility
- `ValidationEngine` now stores validation state internally (backward compatible - existing code works unchanged)

### Improved
- Better developer experience with unified `fields.fieldName.property` pattern in Vue
- Supports "show errors only after touch" UX pattern
- Supports "unsaved changes" warnings with `isDirty` tracking
- Session-based state (resets on component unmount/page refresh)
- Pure JavaScript API can now track validation state across multiple validations

## [0.4.0] - 2025-10-15
### Added
- **Configurable Validation Strategies**: New `validationStrategy` option in `useFormValidation` composable
  - `'all'` strategy: Validates all fields when any field changes (default, safest for cross-field validation)
  - `'changed'` strategy: Only validates fields that changed (optimized performance for large forms)
- **Mount Validation Control**: New `validateOnMount` option to control initial validation behavior
  - Smart defaults: `true` for 'all' strategy, `false` for 'changed' strategy
  - Can be explicitly set to override defaults for fine-grained control
- **Single Field Validation**: Added `validateField()` method to `FormValidationEngine`
  - Validates individual fields with full context for cross-field validation rules
  - Used internally by 'changed' strategy for optimized performance

### Improved
- **Performance Optimization**: 'changed' strategy significantly reduces validation overhead in large forms
  - Implements intelligent change detection using ref-based value snapshots
  - Preserves errors for unchanged fields while revalidating only modified ones
  - Properly handles Vue's deep watch limitations with reactive object tracking
- **Documentation**: Enhanced README with comprehensive configuration examples
  - Added "Validation Configuration Options" section with real-world usage scenarios
  - Updated API Reference with detailed options documentation
  - Organized documentation by framework (Pure JS, Vue.js, React, Node.js)

### Technical
- Implemented ref-based `previousValues` tracking to work around Vue's deep watch limitation
- Ensured proper reactivity by creating new error objects on each validation
- Maintained 100% test coverage with 110 passing tests (added 2 new configuration tests)

## [0.3.2] - 2025-10-14
### Improved
- **Null Safety Optimization**: Refined null safety implementation based on actual runtime requirements:
  - Removed unnecessary null checks from regex-based validation rules (EmailValidationRule, PhoneNumberValidationRule, etc.)
  - Kept null safety only where runtime exceptions occur (property access, method calls, constructor calls)
  - Improved performance by eliminating redundant safety checks
  - Fixed duplicate code in MatchFieldValidationRule implementation

### Technical
- Applied precise null safety principle: only guard against operations that throw runtime errors
- Maintained comprehensive test coverage with 106 passing tests including null safety scenarios

## [0.3.1] - 2025-10-14
### Fixed
- Fixed `useFormValidation` documentation inaccuracies:
  - Corrected `validate` function signature to include optional `values` parameter
  - Improved `errors` type precision from `Ref<object>` to `Ref<Record<string, string[]>>`

### Improved
- **JavaScript Developer Experience**: Enhanced README documentation with JavaScript-friendly improvements:
  - Replaced TypeScript type annotations with plain JavaScript comments
  - Added meaningful business context to all code examples
  - Improved code comments explaining validation purposes and return structures
  - Added practical usage guidance for common scenarios (contact forms, banking, e-commerce)
  - Made examples more accessible to JavaScript developers without TypeScript knowledge

## [0.3.0] - 2025-10-14
### Fixed
- **BREAKING**: Resolved Hot Module Reload (HMR) compatibility issues with Vite+Vue3 projects
- Removed `.ts` extensions from all import/export statements throughout the codebase
- Fixed module resolution issues that were preventing proper HMR functionality
- **CRITICAL**: Added null/undefined safety to all validation rules - prevents runtime exceptions when validation methods receive null or undefined parameters

### Changed
- Updated TypeScript configuration to disable `allowImportingTsExtensions` for better compatibility
- Improved Vite build configuration with proper ES module and UMD formats
- Added source maps for better debugging experience
- Enhanced package.json with modern ES module export maps
- Made Vue dependency optional using `peerDependenciesMeta` - Vue is only required when using `useValidation` composable

### Added
- New `useFormValidation` Vue composable for easier form validation in Vue 3 applications
- Comprehensive README examples with business-focused use cases (banking, e-commerce, contact forms)
- JavaScript-friendly comments and documentation
- Return object structure documentation for better developer experience
- Extensive null safety test suite with 48 additional tests
- Externalized Vue from library bundle to prevent dependency conflicts

### Improved
- Library is now truly framework-agnostic - core validation works in Node.js, React, Angular, or any environment
- Better tree-shaking support for bundlers
- Reduced bundle size by externalizing dependencies
- Enhanced compatibility with modern build tools and development environments

## [0.2.0] - 2025-06-11
### Added
- `FormValidationEngine` for validating multiple fields and collecting summary
  errors.
- `MatchFieldValidationRule` with support for accessing other form values.
- `useValidation` Vue composable for reactive validation workflows.
- Comprehensive suite of new validation rules including bank account, credit
  card, zip code, phone number, date, URL, username, password strength,
  IP address, currency and social security.
- Additional unit tests covering new rules and `FormValidationEngine`.
### Changed
- `ValidationEngine` now accepts custom rules during construction and supports
  regex-based rules.
- Fixed TypeScript errors, cleaned up exports and validated empty strings in
  `RegexValidationRule`.

## [0.1.1] - 2024-08-21
- Added tests for `RegexValidationRule`.
- Exported validation rules through the library index.

## [0.0.8] - 2024-08-15
- Introduced `RegexValidationRule` with initial tests.
- Replaced `String` type usages with `string` for RegExp compatibility.

## [0.0.7] - 2024-08-07
- Initial release with core validation engine and basic rules
  (`required`, `min`, `max`, `email`, `domain`).
- Provided example of creating custom rules.
- Basic project setup and documentation.

[Unreleased]: https://github.com/visaruruqi/oop-validator/compare/0.3.0...HEAD
[0.3.0]: https://github.com/visaruruqi/oop-validator/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/visaruruqi/oop-validator/compare/0.1.1...0.2.0
[0.1.1]: https://github.com/visaruruqi/oop-validator/compare/0.0.8...6a1dd02
[0.0.8]: https://github.com/visaruruqi/oop-validator/compare/0.0.7...0.0.8
[0.0.7]: https://github.com/visaruruqi/oop-validator/releases/tag/0.0.7
