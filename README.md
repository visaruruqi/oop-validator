# oop-validator

[![npm version](https://img.shields.io/npm/v/oop-validator.svg)](https://www.npmjs.com/package/oop-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A class-based validation library for JavaScript and TypeScript. Stack rules on individual fields, validate entire forms at once, and get structured error output — in any framework or none at all. Ships with full TypeScript type declarations.

## Key Features

- **Class-based rules** — each rule implements `IValidationRule`, making them easy to extend, compose, and test independently
- **Framework-agnostic core** — works in Node.js, React, Angular, or vanilla JS with zero peer dependencies
- **Optional Vue 3 composables** — `useValidation` and `useFormValidation` for reactive form state out of the box
- **Form-level validation** — `FormValidationEngine` validates all fields at once and returns per-field errors plus a flat summary
- **Custom error messages** — override the default error message per rule, per field
- **20 built-in rules** — required, min/max length, email, phone, URL, credit card, password strength, and more

## Installation

You can install oop-validator via npm:

```sh
npm install oop-validator
```

## Quick Start

Validate a single value:

```javascript
import { ValidationEngine } from 'oop-validator';

const engine = new ValidationEngine(['required', 'email']);

const result = engine.validateValue('user@example.com');
console.log(result.isValid); // true
console.log(result.errors);  // []

const invalid = engine.validateValue('not-an-email');
console.log(invalid.isValid); // false
console.log(invalid.errors);  // ['This field must be a valid email address.']
```

Validate a whole form:

```javascript
import { FormValidationEngine } from 'oop-validator';

const engine = new FormValidationEngine({
  email:    ['required', 'email'],
  password: ['required', { rule: 'min', params: { length: 8 } }],
});

const result = engine.validate({
  email:    'user@example.com',
  password: 'short',
});

console.log(result.isValid);      // false
console.log(result.fieldErrors);
// { email: [], password: ['This field must be at least 8 characters long.'] }
```

The core library is **framework-agnostic** — works in Node.js, React, Angular, or any environment. Vue composables (`useValidation`, `useFormValidation`) are included and only require Vue as a peer dependency.

## Table of Contents

- [Quick Start](#quick-start)
- [Pure JavaScript API](#pure-javascript-api)
  - [Basic Validation Engine](#basic-validation-engine)
  - [Custom Validation Rules](#custom-validation-rules)
  - [Form Validation Engine](#form-validation-engine)
- [Vue.js Composables](#vuejs-composables)
  - [Adding Custom Validation Rules](#adding-custom-validation-rules)
  - [Validation Configuration Options](#validation-configuration-options)
- [React Integration](#react-integration)
  - [React Hook Examples](#react-hook-examples)
  - [Component Integration](#component-integration)
- [Node.js Environment](#nodejs-environment)
  - [Server-side Validation](#server-side-validation)
  - [API Request Validation](#api-request-validation)
- [Available Validation Rules](#available-validation-rules)
- [API Reference](#api-reference)
- [HMR Compatibility](#hmr-compatibility)

---

## Pure JavaScript API

The core library works in any JavaScript environment — vanilla JS, any framework, or server-side Node.js. All validation methods return a consistent shape:

- `validateValue()` → `{ isValid: boolean, errors: string[] }`
- `validate()` (form) → `{ isValid: boolean, fieldErrors: Record<string, string[]>, summary: string[] }`

### Basic Validation Engine

Use `ValidationEngine` for validating individual fields or values. Perfect for real-time field validation, search inputs, or any single-value validation.

```javascript
import { ValidationEngine } from 'oop-validator';

const productRules = [
  'required',
  { rule: 'min', params: { length: 3 }, message: 'Product name must be at least 3 characters.' },
  { rule: 'max', params: { length: 50 }, message: 'Product name cannot exceed 50 characters.' },
];

const productValidation = new ValidationEngine(productRules);

// ❌ Empty value — caught by required rule
const emptyResult = productValidation.validateValue('');
console.log(emptyResult.isValid); // false
console.log(emptyResult.errors);  // ['This field is required.', 'Product name must be at least 3 characters.']

// ❌ Too short — caught by min rule
const shortResult = productValidation.validateValue('AB');
console.log(shortResult.isValid); // false
console.log(shortResult.errors);  // ['Product name must be at least 3 characters.']

// ✅ Valid
const validResult = productValidation.validateValue('Premium Coffee Beans');
console.log(validResult.isValid); // true
console.log(validResult.errors);  // []

// --- Email ---
const emailValidation = new ValidationEngine(['required', 'email']);

// ❌ Invalid format
const badEmail = emailValidation.validateValue('not-an-email');
console.log(badEmail.isValid); // false
console.log(badEmail.errors);  // ['This field must be a valid email address.']

// ✅ Valid
const goodEmail = emailValidation.validateValue('user@company.com');
console.log(goodEmail.isValid); // true
console.log(goodEmail.errors);  // []

// --- Currency ---
const priceValidation = new ValidationEngine(['required', 'currency']);

// ❌ Not a currency value
const badPrice = priceValidation.validateValue('one hundred dollars');
console.log(badPrice.isValid); // false
console.log(badPrice.errors);  // ['This field must be a valid currency amount.']

// ✅ Valid
const goodPrice = priceValidation.validateValue('$99.99');
console.log(goodPrice.isValid); // true
console.log(goodPrice.errors);  // []
```

#### Stateful API

`ValidationEngine` tracks validation state internally, so you can check the result without re-running validation:

```javascript
import { ValidationEngine } from 'oop-validator';

const emailValidation = new ValidationEngine(['required', 'email']);

// Validate a value
emailValidation.validateValue('invalid-email');

// Get current validation state (without re-validating)
console.log(emailValidation.getIsValid());  // false
console.log(emailValidation.getErrors());   // ['This field must be a valid email address.']

// Validate again with valid input
emailValidation.validateValue('valid@example.com');

console.log(emailValidation.getIsValid());  // true
console.log(emailValidation.getErrors());   // []

// Reset validation state (useful for clearing form errors)
emailValidation.reset();

console.log(emailValidation.getIsValid());  // true
console.log(emailValidation.getErrors());   // []
```

**Stateful methods:**
- `getIsValid()` - Returns current validation status (true/false)
- `getErrors()` - Returns array of current error messages
- `reset()` - Clears validation state (sets isValid to true, clears errors)

**Use cases:**
- ✅ Check validation status without re-running validation
- ✅ Reset form fields after successful submission
- ✅ Clear errors when user starts typing
- ✅ Track validation state across multiple validations


### Custom Validation Rules

Create your own validation rules for business-specific requirements:

```javascript
import { ValidationEngine, IValidationRule } from 'oop-validator'

// A custom rule that validates hex color codes (e.g. #FF5733)
// Use this pattern for any business-specific rule not covered by the built-ins
class HexColorValidationRule extends IValidationRule {
    errorMessage = 'This field must be a valid hex color (e.g. #FF5733).'

    isValid(param) {
        if (param == null || param === '') return [true, ''] // let required handle emptiness
        const isValid = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(param)
        return [isValid, isValid ? '' : this.errorMessage]
    }

    isMatch(type) {
        return type.toLowerCase() === 'hexcolor'
    }

    setParams(params) {}

    setErrorMessage(message) {
        this.errorMessage = message
    }
}

const colorValidation = new ValidationEngine(['required'])
colorValidation.addRule(new HexColorValidationRule())

// ❌ Empty — caught by required rule
const emptyColor = colorValidation.validateValue('')
console.log(emptyColor.isValid); // false
console.log(emptyColor.errors);  // ['This field is required.']

// ❌ Not a hex color — caught by custom rule
const badColor = colorValidation.validateValue('red')
console.log(badColor.isValid); // false
console.log(badColor.errors);  // ['This field must be a valid hex color (e.g. #FF5733).']

// ✅ Valid
const goodColor = colorValidation.validateValue('#FF5733')
console.log(goodColor.isValid); // true
console.log(goodColor.errors);  // []
```

---

### Form Validation Engine

Use `FormValidationEngine` for validating multiple fields at once. Perfect for forms, API requests, or any multi-field validation.

```javascript
import { FormValidationEngine } from 'oop-validator';

// Sample contact form data (typically from user input)
const contactForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
};

// Define validation rules for each field
const contactFormEngine = new FormValidationEngine({
  firstName: ['required', { rule: 'min', params: { length: 2 } }], // Must exist and be at least 2 chars
  lastName: ['required', { rule: 'min', params: { length: 2 } }], // Must exist and be at least 2 chars
  email: ['required', 'email'], // Must exist and be valid email format
  phone: ['required', 'phone'], // Must exist and be valid phone format
  country: ['required'], // Must exist (not empty)
});

// ❌ Validate the empty form — every field fails
const contactResult = contactFormEngine.validate(contactForm);
console.log(contactResult.isValid); // false
console.log(contactResult.fieldErrors);
// {
//   firstName: ['This field is required.'],
//   lastName:  ['This field is required.'],
//   email:     ['This field is required.'],
//   phone:     ['This field is required.'],
//   country:   ['This field is required.']
// }
console.log(contactResult.summary);
// [
//   'firstName: This field is required.',
//   'lastName: This field is required.',
//   'email: This field is required.',
//   'phone: This field is required.',
//   'country: This field is required.'
// ]

// ✅ Validate a filled form — all fields pass
const validResult = contactFormEngine.validate({
  firstName: 'Jane',
  lastName:  'Doe',
  email:     'jane@example.com',
  phone:     '+1234567890',
  country:   'USA',
});
console.log(validResult.isValid);      // true
console.log(validResult.fieldErrors);  // { firstName: [], lastName: [], email: [], phone: [], country: [] }
console.log(validResult.summary);      // []
```

### Banking Form Example

```javascript
import { FormValidationEngine } from 'oop-validator';

const bankingForm = {
  accountNumber: '',
  routingNumber: '',
  accountType: '',
  currency: '',
  initialDeposit: '',
};

const bankingEngine = new FormValidationEngine({
  accountNumber:  ['required', 'bankAccount'],
  routingNumber:  ['required', { rule: 'min', params: { length: 9 } }],
  accountType:    ['required'],
  currency:       ['required', 'currency'],
  initialDeposit: ['required'],
});

// ❌ Validate the empty form
const bankingResult = bankingEngine.validate(bankingForm);
console.log(bankingResult.isValid); // false
console.log(bankingResult.fieldErrors);
// {
//   accountNumber:  ['This field is required.'],
//   routingNumber:  ['This field is required.'],
//   accountType:    ['This field is required.'],
//   currency:       ['This field is required.'],
//   initialDeposit: ['This field is required.']
// }

// ✅ Validate a filled form
const validBanking = bankingEngine.validate({
  accountNumber:  '12345678',
  routingNumber:  '021000021',
  accountType:    'checking',
  currency:       'USD',
  initialDeposit: '$500.00',
});
console.log(validBanking.isValid); // true
```

---

## Vue.js Composables

The library includes optional Vue.js composables that provide reactive validation with automatic updates when your form data changes. Perfect for Vue 3 Composition API projects.

**Installation for Vue projects:**

```bash
npm install oop-validator vue
```

### useValidation - Single Field Validation

The `useValidation` composable is perfect for validating individual form fields with real-time reactive feedback.

```javascript
import { ref } from 'vue';
import { useValidation } from 'oop-validator';

// Single field validation with automatic reactivity
const email = ref('');

// Setup validation rules
const emailRules = ['required', 'email'];

// Get reactive validation state
const { errors, isValid, validate } = useValidation(email, emailRules);

// Validation runs automatically when email.value changes
// errors.value will contain array of error messages
// isValid.value will be true/false

// You can also manually trigger validation
const manualCheck = () => {
  validate(email.value);
};
```

**Usage in Vue component:**

```html
<template>
  <div class="field">
    <input
      v-model="email"
      type="email"
      placeholder="Enter your email"
      :class="{ error: !isValid }"
    />
    <span v-if="errors.length" class="error-message">
      {{ errors[0] }}
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useValidation } from 'oop-validator';

const email = ref('');
const { errors, isValid } = useValidation(email, ['required', 'email']);
</script>
```

### useFormValidation - Multi-Field Form Validation

The `useFormValidation` composable handles complex forms with multiple fields and provides comprehensive error management through the `fields` API.

> **Note:** Works with any reactive type - `ref()`, `reactive()`, computed values, and props like `modelValue`.

#### Fields API (Recommended)

```javascript
import { ref } from 'vue';
import { useFormValidation } from 'oop-validator';

// Form data - works with ref(), reactive(), or any reactive type
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
});

// Validation configuration
const validationConfig = {
  firstName: ['required', { rule: 'min', params: { length: 2 } }],
  lastName: ['required', { rule: 'min', params: { length: 2 } }],
  email: ['required', 'email'],
  phone: ['required', 'phone'],
};

// Get reactive validation state with new fields API
const {
  fields,         // Unified field state object (recommended)
  isValid,        // Form-level validity
  isModelDirty,   // Form-level dirty state (true if any field changed)
  validate,       // Manual validation trigger
  reset,          // Reset form to initial state
  touch,          // Mark specific field as touched
  touchAll,       // Mark all fields as touched
} = useFormValidation(formData, validationConfig);

// Access complete field state through fields object
console.log(fields.value.email.isValid)    // true/false - field is valid
console.log(fields.value.email.errors)     // string[] - error messages
console.log(fields.value.email.isDirty)    // true/false - value changed from initial
console.log(fields.value.email.isTouched)  // true/false - field was focused/blurred

// Check if form has unsaved changes
console.log(isModelDirty.value)            // true/false - any field is dirty

// Handle form submission
const handleSubmit = () => {
  touchAll() // Show errors on all fields
  const result = validate();
  if (result.isValid) {
    console.log('Form is valid, submitting...', formData.value);
    reset() // Reset form after successful submission
  }
};

// Handle field blur
const handleBlur = (fieldName) => {
  touch(fieldName) // Mark field as touched when user leaves it
};

// Warn user about unsaved changes
const handleNavigation = () => {
  if (isModelDirty.value) {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
    if (!confirmed) return false;
  }
  // Navigate away
  return true;
};
```

**Full Vue component example with new fields API:**

```html
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Unsaved changes indicator -->
    <div v-if="isModelDirty" class="alert alert-warning">
      You have unsaved changes
    </div>

    <div class="field">
      <input
        v-model="formData.firstName"
        placeholder="First Name"
        @blur="touch('firstName')"
        :class="{ 
          error: fields.firstName.isTouched && !fields.firstName.isValid,
          success: fields.firstName.isValid && fields.firstName.isDirty
        }"
      />
      <!-- Show checkmark if field is valid and modified -->
      <span v-if="fields.firstName.isValid && fields.firstName.isDirty" class="valid-icon">✓</span>
      <!-- Only show errors after field is touched -->
      <span v-if="fields.firstName.isTouched && fields.firstName.errors.length" class="error-message">
        {{ fields.firstName.errors[0] }}
      </span>
    </div>

    <div class="field">
      <input
        v-model="formData.email"
        type="email"
        placeholder="Email"
        @blur="touch('email')"
        :class="{ 
          error: fields.email.isTouched && !fields.email.isValid,
          success: fields.email.isValid && fields.email.isDirty
        }"
      />
      <span v-if="fields.email.isValid && fields.email.isDirty" class="valid-icon">✓</span>
      <span v-if="fields.email.isTouched && fields.email.errors.length" class="error-message">
        {{ fields.email.errors[0] }}
      </span>
    </div>

    <button type="submit" :disabled="!isValid">Submit Form</button>
    <button type="button" @click="reset">Reset Form</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { useFormValidation } from 'oop-validator';

const formData = ref({
  firstName: '',
  email: '',
});

const config = {
  firstName: ['required'],
  email: ['required', 'email'],
};

const { fields, isValid, validate, reset, touch, touchAll } =
  useFormValidation(formData, config);

const handleSubmit = () => {
  touchAll() // Show all errors on submit attempt
  const result = validate();
  if (result.isValid) {
    console.log('Submitting:', formData.value);
    // After successful API call:
    reset() // Reset form state
  }
};
</script>
```

#### Legacy API (Deprecated)

`errors`, `getFieldErrors()`, and `isFieldValid()` are still returned for backward compatibility but superseded by `fields.fieldName.errors` and `fields.fieldName.isValid`.

### Working with Different Reactive Types

The composable works seamlessly with all Vue reactive types:

```javascript
import { ref, reactive, computed } from 'vue';

// ✅ Works with ref()
const formData = ref({ email: '', password: '' });
useFormValidation(formData, config);

// ✅ Works with reactive()
const formData = reactive({ email: '', password: '' });
useFormValidation(formData, config);

// ✅ Works with computed()
const formData = computed(() => ({ ...someState }));
useFormValidation(formData, config);

// ✅ Works with props (like v-model)
const props = defineProps(['modelValue']);
useFormValidation(props.modelValue, config);
```

---

### Adding Custom Validation Rules

You can extend the validation system with your own custom rules by accessing the `engine` property from `useFormValidation`.

> **⚠️ Important:** Do not reference your custom rule's string name in the config — it won't exist in the built-in switch. Add the rule instance programmatically via `engine.addRuleToField()` instead.

```javascript
import { ref } from 'vue';
import { useFormValidation, IValidationRule } from 'oop-validator';

// 1. Define your custom validation rule
class EvenNumberValidationRule extends IValidationRule {
  private errorMessage = 'Value must be an even number';

  isValid(value: any): [boolean, string] {
    const num = Number(value);
    const valid = !isNaN(num) && num % 2 === 0;
    return [valid, valid ? '' : this.errorMessage];
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'evennumber';
  }

  setParams(params: any): void {}
  setErrorMessage(message: string): void {
    this.errorMessage = message;
  }
}

const formData = ref({
  age: '',
  luckyNumber: '',
});

// 2. Use only built-in rules in config
const config = {
  age: ['required'],  // Don't reference 'evenNumber' here
  luckyNumber: ['required'],
};

// 3. Get engine and add custom rule BEFORE any validation
const { fields, isValid, engine } = useFormValidation(formData, config, {
  validateOnMount: false
});

// 4. Add custom rule to specific fields
engine.addRuleToField('age', new EvenNumberValidationRule());
engine.addRuleToField('luckyNumber', new EvenNumberValidationRule());
```

---

#### Important Notes
- ⚠️ **Don't reference custom rule names in the config** - they won't exist during initialization
- ⚠️ **`addRuleToField()` only works for fields that exist in the config** - you'll see a console warning for non-existent fields
- Add custom rules **immediately after** getting the engine reference, before user interaction
- Custom rules must implement the `IValidationRule` interface with 4 required methods:
  - `isValid(value)` - Returns `[boolean, string]` tuple (valid status and error message)
  - `isMatch(type)` - Returns true if the rule matches the validation type string
  - `setParams(params)` - Sets custom parameters for the rule
  - `setErrorMessage(message)` - Sets a custom error message

**Example - Correct field names:**
```javascript
const config = {
  age: ['required'],      // ✅ 'age' field exists
  email: ['required'],    // ✅ 'email' field exists
};

const { engine } = useFormValidation(formData, config);

// ✅ Works - field 'age' exists in config
engine.addRuleToField('age', new EvenNumberValidationRule());

// ❌ Shows warning - field 'agee' (typo) doesn't exist in config
// Console: "Cannot add rule to field "agee": field does not exist in validation config. Available fields: age, email"
engine.addRuleToField('agee', new EvenNumberValidationRule());

// ❌ Shows warning - field 'username' was never defined in config
// Console: "Cannot add rule to field "username": field does not exist in validation config. Available fields: age, email"
engine.addRuleToField('username', new CustomRule());
```

---

**Custom Rule with Parameters and Error Messages:**

```javascript
class MinAgeValidationRule extends IValidationRule {
  private minAge = 18;
  private errorMessage = 'Age must be at least 18';

  isValid(value: any): [boolean, string] {
    const age = Number(value);
    const valid = !isNaN(age) && age >= this.minAge;
    return [valid, valid ? '' : this.errorMessage];
  }

  isMatch(type: string): boolean {
    return type.toLowerCase() === 'minage';
  }

  setParams(params: any): void {
    if (params.age) this.minAge = params.age;
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message;
  }
}

// Usage with custom parameters
const { engine } = useFormValidation(formData, config);

const ageRule = new MinAgeValidationRule();
ageRule.setParams({ age: 21 });
ageRule.setErrorMessage('You must be at least 21 years old');
engine.addRuleToField('age', ageRule);
```

### Validation Configuration Options

The `useFormValidation` composable accepts an optional third parameter for configuration:

```javascript
const { fields, isValid } = useFormValidation(formData, config, {
  validationStrategy: 'all' | 'changed',  // How to validate (default: 'all')
  validateOnMount: true | false            // Validate immediately (default: depends on strategy)
})
```

#### Validation Strategies

**`validationStrategy: 'all'`** (default)
- Validates **all fields** whenever any field changes
- Safest option for forms with cross-field validation (like password confirmation)
- Default behavior - ensures consistency

**`validationStrategy: 'changed'`**
- Only validates **fields that changed** for better performance
- Ideal for large forms or real-time validation scenarios
- May miss cross-field validation dependencies

#### Validate On Mount

**`validateOnMount: boolean`**
- Controls whether validation runs immediately when the form loads
- **Default for 'all' strategy**: `true` (show all errors immediately)
- **Default for 'changed' strategy**: `false` (wait for user interaction)

#### Configuration Examples

```javascript
// Default: validate all fields immediately
const { fields, isValid } = useFormValidation(formData, config)

// Performance mode: only validate changed fields, no initial errors
const { fields, isValid } = useFormValidation(formData, config, {
  validationStrategy: 'changed'
})

// Validate all fields, but wait for user interaction
const { fields, isValid } = useFormValidation(formData, config, {
  validationStrategy: 'all',
  validateOnMount: false
})

// Show all errors immediately, but only revalidate changed fields
const { fields, isValid } = useFormValidation(formData, config, {
  validationStrategy: 'changed',
  validateOnMount: true
})
```

---

## React Integration

The core validation engines work perfectly with React's state management. Here are practical examples for different React patterns.

### React Hook Examples

```javascript
import { useEffect, useState } from 'react';
import { FormValidationEngine } from 'oop-validator';

// Contact form with React hooks
function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Create validation engine
  const contactEngine = new FormValidationEngine({
    firstName: ['required', { rule: 'min', params: { length: 2 } }],
    lastName: ['required', { rule: 'min', params: { length: 2 } }],
    email: ['required', 'email'],
    phone: ['required', 'phone'],
  });

  // Validate on form data changes
  useEffect(() => {
    const result = contactEngine.validate(formData);
    setErrors(result.fieldErrors);
    setIsValid(result.isValid);
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      console.log('Submitting form:', formData);
      // API call or further processing
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          className={errors.firstName?.length ? 'error' : ''}
        />
        {errors.firstName?.map((error, index) => (
          <span key={index} className="error-message">
            {error}
          </span>
        ))}
      </div>

      <div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={errors.email?.length ? 'error' : ''}
        />
        {errors.email?.map((error, index) => (
          <span key={index} className="error-message">
            {error}
          </span>
        ))}
      </div>

      <button type="submit" disabled={!isValid}>
        Submit Contact Form
      </button>
    </form>
  );
}
```

### Component Integration

```javascript
import { useEffect, useState } from 'react';
import { ValidationEngine } from 'oop-validator';

// Single field validation component
function ValidatedInput({ value, onChange, rules, placeholder }) {
  const [errors, setErrors] = useState([]);
  const validationEngine = new ValidationEngine(rules);

  useEffect(() => {
    const result = validationEngine.validateValue(value);
    setErrors(result.errors);
  }, [value]);

  return (
    <div className="field">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={errors.length ? 'error' : ''}
      />
      {errors.map((error, index) => (
        <span key={index} className="error-message">
          {error}
        </span>
      ))}
    </div>
  );
}

// Usage in parent component
function ProductForm() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');

  return (
    <form>
      <ValidatedInput
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        rules={['required', { rule: 'min', params: { length: 3 } }]}
        placeholder="Product Name"
      />

      <ValidatedInput
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        rules={['required', 'currency']}
        placeholder="Price"
      />
    </form>
  );
}
```

---

## Node.js Environment

The validation library is perfect for server-side validation in Node.js applications, API request validation, and data processing.

### Server-side Validation

```javascript
const { FormValidationEngine, ValidationEngine } = require('oop-validator');

// Express.js middleware for request validation
function validateContactForm(req, res, next) {
  const contactEngine = new FormValidationEngine({
    firstName: ['required', { rule: 'min', params: { length: 2 } }],
    lastName: ['required', { rule: 'min', params: { length: 2 } }],
    email: ['required', 'email'],
    phone: ['required', 'phone'],
    message: ['required', { rule: 'max', params: { length: 1000 } }],
  });

  const result = contactEngine.validate(req.body);

  if (!result.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.fieldErrors,
      summary: result.summary,
    });
  }

  next(); // Validation passed, continue to next middleware
}

// Use in Express routes
app.post('/api/contact', validateContactForm, (req, res) => {
  // Process validated contact form data
  console.log('Valid contact form:', req.body);
  res.json({ success: true, message: 'Contact form submitted successfully' });
});
```

### API Request Validation

```javascript
const { FormValidationEngine, MatchFieldValidationRule } = require('oop-validator');

// User registration validation
function validateUserRegistration(userData) {
  const userEngine = new FormValidationEngine({
    username:        ['required', 'username'],
    email:           ['required', 'email'],
    password:        ['required', 'password'],
    confirmPassword: ['required', new MatchFieldValidationRule('password')],
    age:             ['required'],
  });

  return userEngine.validate(userData);
}

// Product validation for e-commerce API
function validateProduct(productData) {
  const productEngine = new FormValidationEngine({
    name: ['required', { rule: 'min', params: { length: 3 } }],
    sku: ['required', { rule: 'regex', params: { regex: '^[A-Z0-9-]+$' } }],
    price: ['required', 'currency'],
    category: ['required'],
    description: [{ rule: 'max', params: { length: 2000 } }],
  });

  return productEngine.validate(productData);
}

// Usage in API handlers
async function createProduct(req, res) {
  const validationResult = validateProduct(req.body);

  if (!validationResult.isValid) {
    return res.status(400).json({
      error: 'Invalid product data',
      validation_errors: validationResult.fieldErrors,
    });
  }

  try {
    // Save to database
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}

// Database model validation
class User {
  static validate(userData) {
    const userEngine = new FormValidationEngine({
      email: ['required', 'email'],
      firstName: ['required'],
      lastName: ['required'],
      dateOfBirth: ['required', 'date'],
      socialSecurity: ['ssn'], // Optional field
    });

    return userEngine.validate(userData);
  }

  static async create(userData) {
    const validation = User.validate(userData);

    if (!validation.isValid) {
      throw new Error(
        `User validation failed: ${validation.summary.join(', ')}`
      );
    }

    // Proceed with user creation
    return await database.users.insert(userData);
  }
}
```

---

## Available Validation Rules

The library includes a comprehensive set of built-in validation rules for common business needs:

### Basic Rules

- **`required`** - Field must not be empty
- **`min`** - Minimum string length: `{ rule: 'min', params: { length: 3 } }`
- **`max`** - Maximum string length: `{ rule: 'max', params: { length: 50 } }`

### Format Rules

- **`email`** - Valid email address format
- **`url`** - Valid URL format
- **`phone`** - Valid phone number format
- **`date`** - Valid date format

### Financial Rules

- **`currency`** - Valid currency format ($123.45, €99.00, etc.)
- **`bankAccount`** - Valid bank account number
- **`creditCard`** - Valid credit card number

### Geographic Rules

- **`zipCode`** - Valid ZIP/postal code
- **`domain`** - Valid domain name
- **`ip`** - Valid IP address

### Identity Rules

- **`ssn`** - Valid social security number
- **`username`** - Valid username format

### Advanced Rules

- **`regex`** - Custom regex pattern: `{ rule: 'regex', params: { regex: '^[A-Z]+$' } }`
- **`password`** - Password strength validation
- **`MatchFieldValidationRule`** - Cross-field match (use the class directly, no string key): `new MatchFieldValidationRule('otherFieldName')`

### Custom Messages

All rules support custom error messages:

```javascript
{
  rule: 'min',
  params: { length: 8 },
  message: 'Password must be at least 8 characters long'
}
```

---

## API Reference

### ValidationEngine

**Constructor:**

```javascript
new ValidationEngine(rules: Array<string | RuleConfig>)
```

**Methods:**

- `validateValue(value: any): ValidationResult` - Validates a value against all rules and stores the result
- `addRule(rule: IValidationRule): void` - Adds a custom validation rule instance
- `getIsValid(): boolean` - Returns the last stored validation status (no re-validation)
- `getErrors(): string[]` - Returns the last stored error array (no re-validation)
- `reset(): void` - Clears stored state (sets isValid to true, errors to [])

**Return Type:**

```javascript
{
  isValid: boolean,
  errors: string[]
}
```

### FormValidationEngine

**Constructor:**

```javascript
new FormValidationEngine(config: { [fieldName: string]: Array<string | RuleConfig> })
```

**Methods:**

- `validate(data: object): FormValidationResult` - Validates all form fields
- `validateField(fieldName: string, value: any, allValues?: object): ValidationResult` - Validates a single field
- `addRuleToField(fieldName: string, rule: IValidationRule): void` - Adds a custom validation rule to a specific field
- `reset(): void` - Resets validation state for all field engines

**Return Type:**

```javascript
{
  isValid: boolean,
  fieldErrors: { [fieldName: string]: string[] },
  summary: string[]
}
```

### Vue Composables

#### useValidation

```javascript
useValidation(
  value: Ref<any>,
  rules: Array<string | RuleConfig>
): {
  errors: Ref<string[]>,
  isValid: Ref<boolean>,
  validate: (value?: string) => boolean
}
```

#### useFormValidation

```javascript
useFormValidation(
  formData: Ref<object> | object,
  config: { [fieldName: string]: Array<string | RuleConfig> },
  options?: {
    validationStrategy?: 'all' | 'changed',  // default: 'all'
    validateOnMount?: boolean                 // default: true for 'all', false for 'changed'
  }
): {
  fields: Ref<{
    [fieldName: string]: {
      isValid: boolean,
      errors: string[],
      isDirty: boolean,
      isTouched: boolean
    }
  }>,
  
  // Form-level state
  isValid: Ref<boolean>,
  isModelDirty: Ref<boolean>,
  summary: Ref<string[]>,
  
  // Actions
  validate: (values?: object) => FormValidationResult,
  reset: () => void,
  touch: (fieldName: string) => void,
  touchAll: () => void,
  
  // Engine access for custom rules
  engine: FormValidationEngine,
  
  // Deprecated (still supported)
  errors: Ref<{ [fieldName: string]: string[] }>,
  getFieldErrors: (field: string) => Ref<string[]>,
  isFieldValid: (field: string) => Ref<boolean>
}
```

**Options:**

- **`validationStrategy`**: 
  - `'all'` (default): Validates all fields when any field changes
  - `'changed'`: Only validates fields that changed (better performance)
  
- **`validateOnMount`**: 
  - Controls whether validation runs immediately on mount
  - Default: `true` for 'all' strategy, `false` for 'changed' strategy

---

## HMR Compatibility

oop-validator is fully compatible with Vite's Hot Module Reload (HMR) and other modern bundlers (Webpack, Rollup, etc.). Vue is externalized from the bundle — it is only required as a peer dependency when using the Vue composables.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
