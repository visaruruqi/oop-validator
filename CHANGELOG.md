# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.5] - 2025-11-07
### Added
- **Custom Validation Rules Support in Vue Composables**
  - Exposed `engine` property from `useFormValidation` for direct access to FormValidationEngine
  - Added `addRuleToField(fieldName, rule)` method for adding custom rules to specific fields
  - Enables dynamic addition of custom validation rules that implement `IValidationRule` interface
  - Custom rules can be added with custom error messages and parameters
  - Works with both ref() and reactive() form data
  - Comprehensive test coverage with 179 total tests passing

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
