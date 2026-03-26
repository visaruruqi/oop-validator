# CLAUDE.md

## Project: oop-validator

A class-based validation library for JavaScript/TypeScript with Vue 3 composables.

## Current Task: AngularJS Migration Directives

We are adding Vue 3 `v-*` directives that mirror AngularJS `ng-*` form validation directives. Read these spec files before making any changes:

1. **`docs/specs/vue3-angularjs-validation-prompt.md`** — Main implementation spec. Architecture, every file to modify/add, code samples, critical rules. START HERE.
2. **`docs/specs/test-specification.md`** — Complete test plan. Every test file, every describe/it block.
3. **`docs/specs/gap-addendum.md`** — Additional test cases and scenarios from final audit.
4. **`docs/specs/internal-lifecycle-reference.ts`** — Event listener lifecycle patterns. How directives manage cleanup.
5. **`docs/specs/sample-RegisterForm.vue`** — Target developer experience (basic form).
6. **`docs/specs/sample-DynamicOrderForm.vue`** — Target developer experience (dynamic fields, async).
7. **`docs/specs/slot-analysis.vue`** — Slot scenarios analysis.

## Branch

All work on branch: `feature/vue-directives-angularjs-migration`

## Key Rules

- Do NOT break existing API — all 136 existing tests must pass
- Use parallel `Map<IValidationRule, string>` for key tracking — do NOT restructure the `rules` array
- Extend `validateValue()` return type — do NOT create separate methods
- Run `npx vitest run` after each phase to verify nothing broke
- Commit after each phase with a descriptive message
- Read the full spec files before starting implementation

## Workflow

Execute all 5 phases sequentially. After each phase: run tests, fix any failures, commit. Do NOT proceed to the next phase until all tests pass.

## Test Command

```bash
npx vitest run          # run all tests
npx vitest run --watch  # watch mode
npx vitest --coverage   # with coverage report
```

## Build Command

```bash
npm run build
```
