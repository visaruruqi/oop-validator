# oop-validator

oop-validator is a versatile and robust validation library designed to seamlessly integrate with any UI framework or library. Whether you're building applications with Vue.js, React, Angular, or any other front-end technology, oop-validator provides a comprehensive and flexible solution for all your validation needs.

## Key Features

- **Framework-Agnostic**: Designed to work with any UI framework, ensuring maximum flexibility for your projects.
- **Extensible**: Easily extend the library with custom validation rules to meet specific application requirements.
- **Comprehensive Rule Set**: Includes built-in validation rules such as required, minimum and maximum length, email format, domain validation, and more.
- **Customizable Error Messages**: Configure error messages for each validation rule to provide clear and user-friendly feedback.
- **Easy Integration**: Simple setup and intuitive API make it easy to integrate into existing projects.
- **Lightweight and Performant**: Optimized for performance, ensuring minimal impact on application load times and responsiveness.

## Installation

You can install oop-validator via npm:

```sh
npm install oop-validator
```
## USAGE

```ts
import { ValidationEngine, RequiredValidationRule, MinValidationRule, MaxValidationRule, EmailValidationRule } from 'oop-validator';

// Define the validation rules
const rules = [
    'required',
    { rule: 'min', params: { length: 3 }, message: "Minimum length is 3 characters." },
    { rule: 'max', params: { length: 15 }, message: "Maximum length is 15 characters." },
    'email'
];

// Initialize the validation engine with desired rules
const validationEngine = new ValidationEngine(rules);

// Validate a single value
const emailResult = validationEngine.validateValue('user@example.com');
if (!emailResult.isValid) {
    console.log('Email validation errors:', emailResult.errors);
}

const usernameResult = validationEngine.validateValue('us');
if (!usernameResult.isValid) {
    console.log('Username validation errors:', usernameResult.errors);
}
```

## Custom Validation Rule

```ts
import { IValidationRule } from 'oop-validator';

export class PhoneNumberValidationRule extends IValidationRule {
    private errorMessage: string = "This field must be a valid phone number.";

    isValid(param: string): [boolean, string] {
        // A simple regex for validating phone numbers
        const phonePattern = /^\+?[1-9]\d{1,14}$/;
        const isValid = phonePattern.test(param);
        return [isValid, isValid ? "" : this.errorMessage];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'phone';
    }

    setParams(params: any): void {
        // No parameters needed for phone number rule
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}


// Add the custom rule to the validation engine
validationEngine.addRule(new PhoneNumberValidationRule());

const phoneResult = validationEngine.validateValue('+1234567890');
if (!phoneResult.isValid) {
    console.log('Phone validation errors:', phoneResult.errors);
}
```

## Form Validation Example

The `FormValidationEngine` helps validate multiple fields at once and collect a summary of problems. Each field uses the same rules that `ValidationEngine` understands.

```ts
import { FormValidationEngine, MatchFieldValidationRule } from 'oop-validator'

const values = {
  username: '',
  password: '',
  confirmPassword: ''
}

const formEngine = new FormValidationEngine({
  username: ['required'],
  password: ['required', { rule: 'min', params: { length: 8 } }],
  confirmPassword: [
    'required',
    new MatchFieldValidationRule('password')
  ]
})

const result = formEngine.validate(values)
console.log(result.fieldErrors) // errors per field
console.log(result.summary)     // full list of errors
```

Custom rules like `MatchFieldValidationRule` can access other fields by name or via a callback, making dependent validations straightforward.

## Reactive Framework Integration

`FormValidationEngine` works well inside reactive workflows. Invoke `validate` whenever the form state changes so error information stays current.

### Vue example

```ts
import { reactive, watch } from 'vue'
import { FormValidationEngine, MatchFieldValidationRule } from 'oop-validator'

const formEngine = new FormValidationEngine({
  username: ['required'],
  password: ['required', { rule: 'min', params: { length: 8 } }],
  confirmPassword: [
    'required',
    new MatchFieldValidationRule('password')
  ]
})

const state = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  errors: {}
})

watch(state, (current) => {
  const result = formEngine.validate(current)
  state.errors = result.fieldErrors
}, { deep: true })
```

### React example

```tsx
import { useEffect, useState } from 'react'
import { FormValidationEngine, MatchFieldValidationRule } from 'oop-validator'

const formEngine = new FormValidationEngine({
  username: ['required'],
  password: ['required', { rule: 'min', params: { length: 8 } }],
  confirmPassword: [
    'required',
    new MatchFieldValidationRule('password')
  ]
})

function MyForm() {
  const [values, setValues] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const result = formEngine.validate(values)
    setErrors(result.fieldErrors)
  }, [values])

  // render ...
}
```

These snippets reuse the same rule configuration shown earlier, ensuring consistent validation logic across frameworks.
=======
## Vue Composable Helper

For projects using Vue's Composition API, the `useValidation` composable keeps validation state reactive.

```ts
import { ref } from 'vue'
import { useValidation } from 'oop-validator'

const username = ref('')
const { errors, isValid } = useValidation(username, ['required', { rule: 'min', params: { length: 3 } }])

// `errors` and `isValid` update automatically when `username` changes
```
