# CLAUDE.md

## Project: oop-validator

A class-based validation library for JavaScript/TypeScript with Vue 3 composables and AngularJS-style `v-*` validation directives.

## Architecture

- `src/rules/` — Core validation rules (framework-agnostic)
- `src/form/` — FormValidationEngine (framework-agnostic)
- `src/vue/` — Vue 3 composables (`useForm`, `useFormValidation`, `useValidation`)
- `src/vue/directives/` — Vue 3 directives (`v-required`, `v-minlength`, `v-messages`, etc.)
- `docs/specs/` — Design specs from the AngularJS migration project (completed)

## Commands

```bash
npx vitest run          # run all tests
npx vitest run --watch  # watch mode
npx vitest --coverage   # with coverage
npm run typecheck       # tsc --noEmit (catches type errors build skips)
npm run build           # build library (vite + tsc --emitDeclarationOnly)
```

## Key Design Decisions

- `ValidationEngine` uses a parallel `Map<IValidationRule, string>` for rule key tracking (does not restructure the `rules` array)
- `validateValue()` returns `{ isValid, errors, errorsByRule }` — the extra property is backward-compatible
- Directives use a shared FieldController per input element (one blur + one input listener regardless of directive count)
- `useForm()` returns a Proxy for `form.fieldName.$error` access syntax
- Form registry uses `WeakMap<HTMLFormElement, FormInstance>` — auto-GC on element removal
