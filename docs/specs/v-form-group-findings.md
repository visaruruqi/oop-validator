# `v-form-group` — Findings & Decision Pending

**Status:** Investigation complete. No-op directive currently shipped. Decision deferred.
**Date investigated:** 2026-05-11
**Examples reviewed:** 34 real AngularJS templates from a hospitality/PMS codebase mid-migration to Vue.

---

## TL;DR

`v-form-group` is currently a **no-op directive** that pretends to provide nested-form scoping. It accepts a binding value, stores it on a DOM expando property, and nothing in the codebase reads that property. Removing it has zero behavioral impact for consumers — only "breakage" is a Vue runtime warning replacing the silent no-op.

Investigation was triggered by a real AngularJS-to-Vue migration project asking whether the library could provide an `ng-form` equivalent. The conclusion is that **`ng-form` is form-structure scaffolding, not validation** — and this library's mission is validation. Form scoping for repeated rows is a framework-level concern that belongs in user code (per-row Vue sub-components, `provide`/`inject` form contexts, etc.), not in a validation library.

---

## What the directive does today

[src/vue/directives/vFormGroup.ts](../../src/vue/directives/vFormGroup.ts):

1. **`mounted`:** Sets `el.__vFormGroupName = bindingValue` (non-standard DOM expando). Stores `{ groupName }` in a private WeakMap.
2. **`updated`:** Updates the expando and WeakMap entry when binding changes.
3. **`unmounted`:** Clears both.

**Nothing reads `__vFormGroupName`** — verified by grepping the entire codebase and the examples repo.

It does **not**:
- Create a form context, scope, or namespace
- Namespace field names (a `<input name="email" v-required>` inside `<div v-form-group="'x'">` still registers on the outer form as `email`)
- Aggregate `$valid` / `$invalid` / `$dirty` / `$touched`
- Apply CSS classes (despite [oop-validator-examples/GETTING-STARTED.md:297](../../../oop-validator-examples/GETTING-STARTED.md) claiming "Mirror field classes on wrapper" — that doc is false)
- Show up in `useForm` / `useFormValidation` returns

**Only observable effect:** `<div v-form-group="...">` doesn't produce Vue's "Failed to resolve directive" warning (because the directive technically exists).

---

## Public API surface (impact if removed)

Files that reference `vFormGroup`:

| File | What it does |
|---|---|
| `src/vue/directives/vFormGroup.ts` | The directive itself |
| `src/vue/directives/install.ts:12,26,41` | Imports, registers via `app.directive('form-group', vFormGroup)`, re-exports |
| `src/vue.ts:23` | Re-exports from `oop-validator/vue` subpath |
| `src/vue/directives/install.test.ts:23` | Single assertion `expect(directiveNames).toContain('form-group')` |
| `CHANGELOG.md:165` | v1.0.0 historical entry: "group container marker" |
| `oop-validator-examples/README.md:66` | Lists it in directive grid |
| `oop-validator-examples/GETTING-STARTED.md:297` | False description ("Mirror field classes on wrapper") |

Two consumer-facing surfaces break on hard removal:

1. **Named import:** `import { vFormGroup } from 'oop-validator/vue'` — TypeScript error, runtime `undefined`.
2. **Template directive:** `<div v-form-group="...">` — Vue warns "Failed to resolve directive: form-group" at runtime. Already a no-op, so no real behavior is lost.

---

## Why investigation was triggered

User has an active AngularJS-to-Vue migration project where the original AngularJS templates use `<ng-form>` heavily for repeated row validation. The question was whether the library should provide a faithful `ng-form` port via `v-form-group`.

### What `ng-form` does in AngularJS 1.8

`<ng-form>` exists because **HTML does not allow nested `<form>` elements** — the parser silently strips inner ones. AngularJS provides `ng-form` (and its `ng-form="name"` attribute form) as a workaround to get logical nested-form scopes. Each `ng-form` creates its own `FormController` that:

- Aggregates `$valid` / `$invalid` / `$dirty` from children → propagates **up** to parent form
- Cascades `$setPristine` / `$setUntouched` **down** to children
- Cascades `$setSubmitted` **root-first then down** all sub-forms
- Auto-deregisters from parent when DOM unmounts (e.g. `ng-repeat` row removal)
- Provides `parent.subFormName.fieldName.$error.required` drill-down access

Source: [AngularJS 1.8.3 form.js](https://raw.githubusercontent.com/angular/angular.js/v1.8.3/src/ng/directive/form.js).

### What 34 real migration examples actually used

Examined 34 production AngularJS templates from the user's migration codebase (hospitality/PMS domain — hotel configuration screens, audit logs, payment gateway settings, room inventory, etc.).

**Patterns observed:**

| Pattern | Count |
|---|---|
| `<ng-form>` row-namespacing inside `ng-repeat`, single level | ~28 |
| `<ng-form>` standalone (no enclosing `<form>`, acts as root) | 2 |
| `<ng-form>` nested 2-deep (inner sub-form inside outer sub-form, both in `ng-repeat`) | 2 |
| `<ng-form>` decorative with no validation inside | 1 |
| `ng-form="name"` attribute form (vs. element form) | 2 |

**Patterns NOT observed (0/34):**

- Drilling `outerForm.subForm.field.$error` from outside the sub-form's local scope
- Cascading `$setPristine` / `$setUntouched` / `$setSubmitted` on sub-forms
- Sub-forms used for logical grouping (street/city/zip-style) outside of `ng-repeat` for namespacing
- Controller JS calling sub-form methods (`subForm.$validate()`, etc.)
- Deep nesting beyond 2 levels

**Why migrators in this codebase use `<ng-form>`:** almost exclusively to namespace field names inside `ng-repeat` rows so that template references like `subForm.fieldName.$error.required` resolve to the *current row's* field, avoiding collisions across rows. The aggregation-into-parent behavior is consumed only implicitly via the submit handler reading `parentForm.$valid`. Nothing else from `ng-form`'s feature surface is exercised.

---

## Why this is the wrong feature for this library

Reframing prompted by the user mid-investigation:

> "This is a validation library and asking you to add a ng-form equivalent is not valid from my side as we are not building a feature for forms, rather we are dealing with validations in forms."

That observation is correct. The library's mission per [README.md](../../README.md) and [CLAUDE.md](../../CLAUDE.md):

> "A class-based validation library for JavaScript/TypeScript with Vue 3 composables and AngularJS-style `v-*` validation directives."

Every other directive in the library *validates a value*: `v-required`, `v-pattern`, `v-minlength`, `v-min`, `v-type`. `v-form-group` would not — it would create form-structure scopes. That's a different responsibility, more naturally addressed by Vue's own framework primitives (per-row sub-components, `provide`/`inject`, scoped slots).

**What the migration actually needs from a validation library** (and already gets):
- Per-field validators
- Aggregated `$valid` / `$invalid` / `$dirty` / `$touched`
- Error-message resolution
- Lifecycle-aware field registration/deregistration

All provided by `useFormValidation`, `useForm`, and the existing `v-*` validation directives.

**What the migration needs that doesn't belong in this library:**
- Nested form-structure scopes → user code (sub-components per row)
- DOM-level field-name collision avoidance across `ng-repeat` rows → Vue's natural component scoping (each row is its own component instance with its own `useForm` if needed)

---

## Side-findings worth filing separately (NOT `v-form-group`)

The example review surfaced two genuine library-level concerns unrelated to form grouping. Both are **validation** concerns and squarely in-scope:

### 1. Cross-field validation gap

Observed in examples 14, 17, 30, etc. via AngularJS's `ui-validate` directive:

```html
ui-validate="{ dateGreater: 'vm.isGrater($value, vm.sync_step_end_date, syncStepForm)' }"
```

Pattern: field A's validator needs to read field B's value (e.g., date-range checking — start before end, no overlap with sibling rows).

**Current state of the library:** custom rules (`IValidationRule`) operate on the field's own value in isolation. No native pattern for "rule on field A reads sibling field B." Users would need to use a watcher in their component and imperatively call form methods.

**Recommended:** a follow-up investigation into whether to provide a first-class cross-field validation API. Possibilities include:
- Rule constructor that receives the form context and can read other field values
- A `setContext()` injection point in custom rules
- An explicit "compare fields" rule helper
- Documentation pattern showing the watcher-based approach for users who prefer it

### 2. `v-if`-gated field deregistration

Observed in example 17 (`outboundSyncForm` with three mutually-exclusive `<div ng-if>` sections, only one mounted at a time).

When `v-if` removes a `required` field, the form's `$valid` should flip back to `true` if that was the only invalid field. Standard Vue directive `unmounted` hooks should handle this for free — but worth a dedicated regression test to confirm.

**Recommended:** add a test case to the existing test suite that exercises `v-if`-controlled field mount/unmount and asserts `form.$valid` recovers correctly.

---

## Bugs in source AngularJS templates (informational)

Multiple migration examples contained bugs in the AngularJS source that were invisible because the affected fields lacked validation rules. Documented here so the migrator can find and fix them during the port:

- **Example 5:** Same `<ng-form>` name reused 7× in one row (accidental copy-paste). AngularJS "last wins" on scope, so template references resolve to the wrong sub-form.
- **Example 14:** `ratePlansForm.$submitted` referenced where parent `GoogleConfigForm.$submitted` was intended. Sub-form's `$submitted` is always false (no `<ng-form ng-submit>`), so the gate is dead.
- **Example 15:** `<ui-select name="multi_property_routed_property_form">` has the same `name` as its enclosing `<ng-form>`. Template references mix the two.
- **Example 21:** `<ng-form name="financialExtractForm">` wraps only ONE field; the save button checks `financialExtractForm.$valid` only, so other fields' `required` doesn't block the save.
- **Example 27:** Multiple inner `<ng-form>`s reuse the outer form's name (`housekeepingChecklistsForm`). Last write wins on scope.
- **Examples 28, 29:** `ng-form="sourceForm"` on `<tr>` + per-cell `<ng-form>` + error gates referencing `sourceForm.$submitted` which is never set.

**Library aid worth considering:** `console.warn` when `v-form-group` (if it ever does real work) is given the same name as an enclosing form, or when a referenced field name doesn't resolve.

---

## Decision options (for future)

When picking this up again, three reasonable paths:

### Option A: Delete entirely (cleanest)

Remove [src/vue/directives/vFormGroup.ts](../../src/vue/directives/vFormGroup.ts) and all references. Document in CHANGELOG that `v-form-group` was a no-op and is removed because form-structure scoping is out of scope for a validation library.

- **Semver:** technically major (removes named export + directive). Pragmatically arguable as minor with prominent CHANGELOG entry, because no real behavior is lost.
- **Pro:** honest. Surfaces the gap rather than hiding it.
- **Con:** consumers who happen to write `<div v-form-group>` get a Vue runtime warning until they remove the attribute.

### Option B: Deprecation runway (lowest risk)

Add `console.warn` on first use, `@deprecated` JSDoc, schedule removal for v2.0.

- **Semver:** patch or minor (no removal).
- **Pro:** gives consumers visibility to migrate.
- **Con:** keeps the no-op in the bundle for one more cycle. Cost ~~~0 LoC.

### Option C: Implement (not recommended for this library)

Build a real `v-form-group` faithful to the 34 observed patterns. Scope established by this investigation:
- Single-level row-namespacing inside `v-for`
- Standalone-as-root use
- 2-level nesting via `provide`/`inject` chain
- Auto-deregister on unmount
- Local-scope template access only (no drilling)
- ~250-400 LoC + ~12 tests

**Not recommended** because this is form-structure work, not validation. If a migration needs this behavior, Vue's component model already provides it — per-row sub-component with its own `useForm`/`useFormValidation` is the idiomatic solution and doesn't require special library support.

---

## Recommended path

**Option A or B**, in conjunction with two genuinely in-scope follow-ups:

1. Investigate the **cross-field validation** gap (#1 in side-findings above) — this is real validation work the library should address.
2. Add the **`v-if` deregistration regression test** (#2 in side-findings above) — quick win, defensive.

Specifically NOT recommended: building Option C. The investigation surfaced that the user already independently arrived at the same conclusion mid-conversation ("we are not building a feature for forms, rather we are dealing with validations in forms"). Trust that judgment.

---

## References

- Current implementation: [src/vue/directives/vFormGroup.ts](../../src/vue/directives/vFormGroup.ts)
- Plugin registration: [src/vue/directives/install.ts:26](../../src/vue/directives/install.ts)
- Test that asserts it's registered: [src/vue/directives/install.test.ts:23](../../src/vue/directives/install.test.ts)
- Original spec intent: [docs/specs/gap-addendum.md](./gap-addendum.md) (search for "vFormGroup")
- AngularJS 1.8 `ngForm` source: https://raw.githubusercontent.com/angular/angular.js/v1.8.3/src/ng/directive/form.js
- AngularJS `ngForm` docs: https://docs.angularjs.org/api/ng/directive/ngForm
