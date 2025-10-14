# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-10-14
### Fixed
- **BREAKING**: Resolved Hot Module Reload (HMR) compatibility issues with Vite+Vue3 projects
- Removed `.ts` extensions from all import/export statements throughout the codebase
- Fixed module resolution issues that were preventing proper HMR functionality

### Changed
- Updated TypeScript configuration to disable `allowImportingTsExtensions` for better compatibility
- Improved Vite build configuration with proper ES module and UMD formats
- Added source maps for better debugging experience
- Enhanced package.json with modern ES module export maps
- Made Vue dependency optional using `peerDependenciesMeta` - Vue is only required when using `useValidation` composable
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
