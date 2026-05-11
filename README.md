# oop-validator

[![npm version](https://img.shields.io/npm/v/oop-validator.svg)](https://www.npmjs.com/package/oop-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A class-based validation library for JavaScript and TypeScript. Stack rules on individual fields, validate entire forms at once, and get structured error output — in any framework or none at all. Ships with full TypeScript type declarations.

📖 **Full documentation: [oop-validator.vercel.app](https://oop-validator.vercel.app/)**

## Features

- **Class-based rules** — every rule is a class implementing `IValidationRule`. Extend with your own business rules (see below) — no schema DSL to learn, no string parsing, just regular OOP
- **Framework-agnostic core** — works in Node.js, React, Angular, or vanilla JS with zero peer dependencies
- **Vue 3 composables** — `useFormValidation`, `useValidation`, and `useForm` for reactive form state
- **AngularJS-style directives** (optional) — `v-required`, `v-minlength`, `v-pattern`, `v-messages`, `v-submit`, … intended primarily for teams migrating from AngularJS
- **20+ built-in rules** — required, length, email, phone, URL, credit card, password strength, and more
- **Custom error messages** per rule, per field

## Installation

```sh
npm install oop-validator
```

The package ships two entry points:

| Import path | Contents | Vue required? |
|---|---|---|
| `oop-validator` | Core rules + engines (framework-agnostic) | No |
| `oop-validator/vue` | Composables + directives + plugin | Yes (peer dep) |

## Quick Start (Vue 3)

```html
<script setup>
import { ref } from 'vue'
import { useFormValidation } from 'oop-validator/vue'

const formData = ref({ email: '', password: '' })

const validationConfig = {
  email:    ['required', 'email'],
  password: ['required', { rule: 'min', params: { length: 8 } }],
}

const { fields, isValid, validate, touch, touchAll, reset } =
  useFormValidation(formData, validationConfig)

const handleSubmit = () => {
  touchAll()
  if (validate().isValid) {
    // submit formData.value
    reset()
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input
      v-model="formData.email"
      @blur="touch('email')"
      :class="{ error: fields.email.isTouched && !fields.email.isValid }"
    />
    <span v-if="fields.email.isTouched && fields.email.errors.length">
      {{ fields.email.errors[0] }}
    </span>

    <input
      v-model="formData.password"
      type="password"
      @blur="touch('password')"
      :class="{ error: fields.password.isTouched && !fields.password.isValid }"
    />
    <span v-if="fields.password.isTouched && fields.password.errors.length">
      {{ fields.password.errors[0] }}
    </span>

    <button type="submit" :disabled="!isValid">Submit</button>
  </form>
</template>
```

Each entry in `fields` exposes `{ isValid, errors, isDirty, isTouched }`. Works with `ref()`, `reactive()`, computed refs, and props alike.

> Migrating from AngularJS? oop-validator also ships AngularJS-style `v-required` / `v-messages` / `v-submit` directives. See the [docs site](https://oop-validator.vercel.app/) for the directive reference.

## Custom rules

Built-in rules cover the common cases — but the real strength of class-based validation is that **business rules are just classes you write**. Implement `IValidationRule`, and the rule plugs into the same engine, the same Vue composables, the same form errors:

```ts
import { IValidationRule } from 'oop-validator'

class HexColorValidationRule extends IValidationRule {
  errorMessage = 'Must be a valid hex color (e.g. #FF5733).'

  isValid(value) {
    if (value == null || value === '') return [true, '']  // let `required` handle empty
    const ok = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
    return [ok, ok ? '' : this.errorMessage]
  }

  isMatch(type)         { return type.toLowerCase() === 'hexcolor' }
  setParams(_)          {}
  setErrorMessage(msg)  { this.errorMessage = msg }
}
```

Wire it into a Vue form via the `engine` returned by `useFormValidation`:

```ts
const { fields, engine } = useFormValidation(formData, {
  brandColor: ['required'],  // built-in rules go in the config
})

engine.addRuleToField('brandColor', new HexColorValidationRule())  // custom rules added programmatically
```

That's it — `fields.brandColor.errors` now includes hex-color violations alongside the built-in errors. Same shape, same touched/dirty tracking, same submit behavior.

Because rules are plain classes, they're trivially:
- **Testable** — instantiate, call `isValid()`, assert
- **Composable** — inject services into the constructor (e.g. an async username-availability checker)
- **Reusable** — share rules across forms, projects, or even server-side validation

## Server-side validation (Node.js)

The core engine has zero peer dependencies — so the rules you wrote for the signup form can run again on the API server. One source of truth, no duplication, no drift.

```js
// shared/rules.js — used by both the Vue form and the Express handler
export const signupRules = {
  email:    ['required', 'email'],
  password: ['required', { rule: 'min', params: { length: 8 } }],
}
```

```js
// server.js
import express from 'express'
import { FormValidationEngine } from 'oop-validator'
import { signupRules } from './shared/rules.js'

const app = express()
app.use(express.json())

app.post('/signup', (req, res) => {
  const result = new FormValidationEngine(signupRules).validate(req.body)
  if (!result.isValid) {
    return res.status(400).json({ errors: result.fieldErrors })
  }
  // ... create user
})
```

React, Fastify, vanilla JS, and other patterns are on the [docs site](https://oop-validator.vercel.app/).

## Documentation

The full guide lives on the docs site — including all built-in rules, custom rule authoring, every directive, configuration options, the React/Node.js patterns, the API reference, and the AngularJS migration guide.

👉 **[oop-validator.vercel.app](https://oop-validator.vercel.app/)**

## License

MIT — see [LICENSE](./LICENSE).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## Contributing

Issues and PRs welcome at [github.com/visaruruqi/oop-validator](https://github.com/visaruruqi/oop-validator).
