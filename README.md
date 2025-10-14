# oop-validator

oop-validator is a versatile and robust validation library designed to seamlessly integrate with any UI framework or library. Whether you're building applications with Vue.js, React, Angular, or any other front-end technology, oop-validator provides a comprehensive and flexible solution for all your validation needs.

## Key Features

- **Framework-Agnostic**: Designed to work with any UI framework, ensuring maximum flexibility for your projects.
- **HMR Compatible**: Full compatibility with Vite, Webpack, and other modern development tools with Hot Module Reload.
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

## Development Experience

### Hot Module Reload (HMR) Compatibility

**v0.3.0+** oop-validator is fully compatible with Vite's Hot Module Reload (HMR) and other modern development tools. The library has been optimized to work seamlessly with:

- **Vite + Vue 3** projects
- **Vite + React** projects  
- **Webpack** with hot reloading
- **Other modern bundlers** with HMR support

Previous versions (< 0.3.0) had module resolution issues that could break HMR when importing the library. These issues have been completely resolved by:

- Removing TypeScript file extensions from imports/exports
- Optimizing module resolution for modern bundlers
- Externalizing framework dependencies (Vue, React, etc.)
- Using proper ES module export maps

### Framework Dependencies

The core validation library is **completely framework-agnostic** and works in any environment:

- ✅ **Node.js** - Server-side validation
- ✅ **React** - Client-side validation  
- ✅ **Angular** - Any Angular version
- ✅ **Vanilla JavaScript** - No framework needed
- ✅ **Vue.js** - Includes optional Vue composable (`useValidation`)

**Vue Dependency**: Vue is only required if you use the `useValidation` composable. All other features work without any framework dependencies.

## Return Object Structures

All validation methods return consistent, predictable objects to make error handling straightforward:

### Single Field Validation Result
```javascript
// ValidationEngine.validateValue() always returns:
{
  isValid: boolean,    // true if validation passed, false if failed
  errors: string[]     // array of error messages (empty when valid)
}
```

### Form Validation Result  
```javascript
// FormValidationEngine.validate() always returns:
{
  isValid: boolean,        // true only if ALL fields pass validation
  fieldErrors: {           // object with field names as keys
    fieldName: string[]    // arrays of error messages per field
  },
  summary: string[]        // flat array of ALL errors with field prefixes
}
```

### Vue Composable Returns
```javascript
// useValidation() returns reactive Vue refs:
{
  errors: /* Vue ref containing array */ string[],         // reactive array of error messages  
  isValid: /* Vue ref containing boolean */ boolean,       // reactive validation status
  validate: (value?) => boolean  // manual validation function
}

// useFormValidation() returns reactive Vue refs and helper functions:
{
  errors: /* Vue ref containing object */ { [fieldName: string]: string[] },     // reactive object with errors by field
  isValid: /* Vue ref containing boolean */ boolean,                             // reactive overall form validity
  summary: /* Vue ref containing array */ string[],                             // reactive array of all errors
  validate: (values?) => FormValidationResult,  // returns FormValidationResult, optional values param
  getFieldErrors: (field) => /* Vue ref */ string[], // get reactive field errors
  isFieldValid: (field) => /* Vue ref */ boolean     // get reactive field validity
}
```

## USAGE

### Basic Single Field Validation

```js
import { ValidationEngine } from 'oop-validator';

// Product name validation - ensure it meets business requirements
const productRules = [
    'required',  // Field must not be empty
    { rule: 'min', params: { length: 3 }, message: "Product name must be at least 3 characters." },
    { rule: 'max', params: { length: 50 }, message: "Product name cannot exceed 50 characters." }
];

const productValidation = new ValidationEngine(productRules);

// Validate product name input from user
const productResult = productValidation.validateValue('Premium Coffee Beans');
// productResult is a plain JavaScript object with this structure:
// {
//   isValid: true,     // boolean - true if ALL rules passed
//   errors: []         // array of strings - validation error messages (empty when valid)
// }
if (!productResult.isValid) {
    // Show validation errors to user (e.g., in form field)
    console.log('Product name errors:', productResult.errors);
}

// Email validation for contact forms - check format is correct
const emailValidation = new ValidationEngine(['required', 'email']);
const emailResult = emailValidation.validateValue('contact@business.com');
// emailResult example when INVALID:
// {
//   isValid: false,
//   errors: ["This field is required.", "This field must be a valid email address."]
// }
if (!emailResult.isValid) {
    // Display these errors next to the email input field
    console.log('Email validation errors:', emailResult.errors);
}

// Currency validation for pricing - ensure proper money format
const priceValidation = new ValidationEngine(['required', 'currency']);
const priceResult = priceValidation.validateValue('$299.99');
// priceResult example when VALID:
// {
//   isValid: true,    // All validation rules passed
//   errors: []        // No errors found
// }
if (!priceResult.isValid) {
    // Show price format errors to user
    console.log('Price validation errors:', priceResult.errors);
}
```

## Custom Validation Rule

```js
import { IValidationRule } from 'oop-validator';

// Create a custom rule for business-specific validation needs
export class PhoneNumberValidationRule extends IValidationRule {
    // Private property to store the error message
    private errorMessage = "This field must be a valid phone number.";

    // Main validation logic - returns [isValid, errorMessage]
    isValid(param) {
        // Simple international phone number pattern
        const phonePattern = /^\+?[1-9]\d{1,14}$/;
        const isValid = phonePattern.test(param);
        // Return array: [boolean success, string error message]
        return [isValid, isValid ? "" : this.errorMessage];
    }

    // Check if this rule handles a specific validation type
    isMatch(type) {
        return type.toLowerCase() === 'phone';
    }

    // Configure rule parameters (not used for phone validation)
    setParams(params) {
        // No parameters needed for phone number rule
    }

    // Allow customizing the error message
    setErrorMessage(message) {
        this.errorMessage = message;
    }
}

// Register and use the custom rule
const validationEngine = new ValidationEngine(['required', 'phone']);
validationEngine.addRule(new PhoneNumberValidationRule());

const phoneResult = validationEngine.validateValue('+1234567890');
if (!phoneResult.isValid) {
    // Handle phone validation errors in your UI
    console.log('Phone validation errors:', phoneResult.errors);
}
```

## Form Validation Examples

The `FormValidationEngine` helps validate multiple fields at once and collect a summary of problems. Each field uses the same rules that `ValidationEngine` understands. Perfect for contact forms, registration, checkout processes, etc.

### Contact Form Validation

```js
import { FormValidationEngine } from 'oop-validator'

// Sample contact form data (typically from user input)
const contactForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: ''
}

// Define validation rules for each field
const contactFormEngine = new FormValidationEngine({
  firstName: ['required', { rule: 'min', params: { length: 2 } }],  // Must exist and be at least 2 chars
  lastName: ['required', { rule: 'min', params: { length: 2 } }],   // Must exist and be at least 2 chars
  email: ['required', 'email'],      // Must exist and be valid email format
  phone: ['required', 'phone'],      // Must exist and be valid phone format
  country: ['required']              // Must exist (not empty)
})

// Validate the entire form at once
const contactResult = contactFormEngine.validate(contactForm)
// contactResult is a plain JavaScript object with this structure:
// {
//   isValid: false,        // boolean - true only if ALL fields pass validation
//   fieldErrors: {         // object with errors grouped by field name (for showing errors per field)
//     firstName: ["This field is required."],
//     lastName: ["This field is required."], 
//     email: ["This field is required.", "This field must be a valid email address."],
//     phone: ["This field is required.", "This field must be a valid phone number."],
//     country: ["This field is required."]
//   },
//   summary: [             // array of ALL error messages with field prefixes (for error summary lists)
//     "firstName: This field is required.",
//     "lastName: This field is required.",
//     "email: This field is required.",
//     "email: This field must be a valid email address.",
//     "phone: This field is required.",
//     "phone: This field must be a valid phone number.",
//     "country: This field is required."
//   ]
// }
console.log(contactResult.fieldErrors) // Use to show errors next to specific input fields
console.log(contactResult.summary)     // Use to show all errors in an error summary box
```

### Banking Form Validation

```js
import { FormValidationEngine } from 'oop-validator'

// Sample banking form data (from user input fields)
const bankingForm = {
  accountNumber: '',
  routingNumber: '',
  accountType: '',
  currency: '',
  initialDeposit: ''
}

const bankingEngine = new FormValidationEngine({
  accountNumber: ['required', 'bankAccount'],
  routingNumber: ['required', { rule: 'min', params: { length: 9 } }],
  accountType: ['required'],
  currency: ['required', 'currency'],
  initialDeposit: ['required', { rule: 'min', params: { amount: 25 } }]
})

const bankingResult = bankingEngine.validate(bankingForm)
```

### E-commerce Product Form

```ts
import { FormValidationEngine } from 'oop-validator'

const productForm = {
  productName: '',
  sku: '',
  price: '',
  website: '',
  description: ''
}

const productEngine = new FormValidationEngine({
  productName: ['required', { rule: 'min', params: { length: 3 } }],
  sku: ['required', { rule: 'regex', params: { pattern: /^[A-Z0-9-]+$/ } }],
  price: ['required', 'currency'],
  website: ['url'],
  description: [{ rule: 'max', params: { length: 500 } }]
})

const productResult = productEngine.validate(productForm)
```

### Address/Shipping Form

```ts
import { FormValidationEngine } from 'oop-validator'

const shippingForm = {
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  country: ''
}

const shippingEngine = new FormValidationEngine({
  streetAddress: ['required'],
  city: ['required'],
  state: ['required'],
  zipCode: ['required', 'zipCode'],
  country: ['required']
})

const shippingResult = shippingEngine.validate(shippingForm)
```

### Event Registration Form

```ts
import { FormValidationEngine } from 'oop-validator'

const eventForm = {
  attendeeName: '',
  email: '',
  eventDate: '',
  ticketQuantity: '',
  specialRequests: ''
}

const eventEngine = new FormValidationEngine({
  attendeeName: ['required'],
  email: ['required', 'email'],
  eventDate: ['required', 'date'],
  ticketQuantity: ['required', { rule: 'min', params: { value: 1 } }],
  specialRequests: [{ rule: 'max', params: { length: 200 } }]
})

const eventResult = eventEngine.validate(eventForm)
```

Custom rules like `MatchFieldValidationRule` can access other fields by name or via a callback, making dependent validations straightforward.

## Reactive Framework Integration

`FormValidationEngine` works well inside reactive workflows. Invoke `validate` whenever the form state changes so error information stays current.

### Vue Example - Contact Form

```ts
import { reactive, watch } from 'vue'
import { FormValidationEngine } from 'oop-validator'

const contactEngine = new FormValidationEngine({
  firstName: ['required', { rule: 'min', params: { length: 2 } }],
  lastName: ['required', { rule: 'min', params: { length: 2 } }],
  email: ['required', 'email'],
  phone: ['required', 'phone']
})

const contactState = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  errors: {}
})

watch(contactState, (current) => {
  const result = contactEngine.validate(current)
  contactState.errors = result.fieldErrors
}, { deep: true })
```

### React Example - Product Form

```tsx
import { useEffect, useState } from 'react'
import { FormValidationEngine } from 'oop-validator'

const productEngine = new FormValidationEngine({
  productName: ['required', { rule: 'min', params: { length: 3 } }],
  sku: ['required'],
  price: ['required', 'currency'],
  website: ['url']
})

function ProductForm() {
  const [productData, setProductData] = useState({
    productName: '',
    sku: '',
    price: '',
    website: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const result = productEngine.validate(productData)
    setErrors(result.fieldErrors)
  }, [productData])

  // render ...
}
```

### Angular Example - Banking Form

```ts
import { Component } from '@angular/core'
import { FormValidationEngine } from 'oop-validator'

@Component({
  selector: 'app-banking-form',
  template: '...'
})
export class BankingFormComponent {
  private bankingEngine = new FormValidationEngine({
    accountNumber: ['required', 'bankAccount'],
    routingNumber: ['required', { rule: 'min', params: { length: 9 } }],
    accountType: ['required'],
    currency: ['required', 'currency']
  })

  bankingData = {
    accountNumber: '',
    routingNumber: '',
    accountType: '',
    currency: ''
  }

  errors: any = {}

  onFormChange() {
    const result = this.bankingEngine.validate(this.bankingData)
    this.errors = result.fieldErrors
  }
}
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
## Vue Composable Helpers

> **Note**: Vue is an optional dependency. These composables are only available when Vue 3 is installed in your project.

### Single Field Validation

For projects using Vue's Composition API, the `useValidation` composable keeps validation state reactive for individual fields.

```ts
import { ref } from 'vue'
import { useValidation } from 'oop-validator'

// Product name validation
const productName = ref('')
// useValidation returns an object with reactive properties:
// {
//   errors: ref([]),       // Vue ref containing array of error messages
//   isValid: ref(true),    // Vue ref containing validation status boolean
//   validate: function()   // Function to manually trigger validation
// }
const { errors, isValid } = useValidation(productName, [
  'required', 
  { rule: 'min', params: { length: 3 } }
])

// Email validation  
const contactEmail = ref('')
// Using destructuring with renaming to avoid variable name conflicts
const { errors: emailErrors, isValid: isEmailValid } = useValidation(contactEmail, [
  'required', 
  'email'
])

// Currency validation
const productPrice = ref('')
// Each useValidation call returns its own independent validation state
const { errors: priceErrors, isValid: isPriceValid } = useValidation(productPrice, [
  'required', 
  'currency'
])

// All validation states update automatically when input values change
// Example: when productName.value = 'ab', errors.value = ["Minimum length is 3 characters."]
```

### Form Validation

For complete form validation, use the `useFormValidation` composable that wraps `FormValidationEngine` with Vue reactivity.

#### Contact Form Example

```ts
import { ref } from 'vue'
import { useFormValidation } from 'oop-validator'

// Create reactive form data (automatically validates when data changes)
const contactForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: ''
})

// Define validation rules for each field (same as FormValidationEngine)
const contactConfig = {
  firstName: ['required', { rule: 'min', params: { length: 2 } }],  // Required + min 2 chars
  lastName: ['required', { rule: 'min', params: { length: 2 } }],   // Required + min 2 chars
  email: ['required', 'email'],      // Required + valid email format
  phone: ['required', 'phone'],      // Required + valid phone format
  country: ['required']              // Required (not empty)
}

// useFormValidation returns an object with these reactive properties and functions:
// {
//   errors: ref({          // Vue ref containing object with errors by field
//     firstName: [],       // Array of error messages for this field
//     lastName: [],
//     email: ["This field must be a valid email address."],
//     phone: [],
//     country: []
//   }),
//   isValid: ref(false),   // Vue ref - true only when ALL fields are valid
//   summary: ref([]),      // Vue ref containing flat array of all errors
//   validate: function(),  // Function that returns full validation result object
//   getFieldErrors: function(fieldName),  // Function returning Vue ref with field errors
//   isFieldValid: function(fieldName)     // Function returning Vue ref with field validity
// }
const { 
  errors,           // Reactive object containing validation errors for each field
  isValid,          // Reactive boolean indicating if the entire form is valid
  summary,          // Reactive array of all validation error messages
  validate,         // Function to manually trigger validation
  getFieldErrors,   // Function to get reactive validation errors for a specific field
  isFieldValid      // Function to check if a specific field is valid (returns reactive boolean)
} = useFormValidation(contactForm, contactConfig)

// Helper functions for working with individual field validation in your Vue template
const firstNameErrors = getFieldErrors('firstName')  // Returns Vue ref with array: ref(["This field is required."])
const isEmailValid = isFieldValid('email')           // Returns Vue ref with boolean: ref(false)
```

#### Banking Form Example

```js
import { ref } from 'vue'
import { useFormValidation } from 'oop-validator'

// Reactive banking form data (updates trigger automatic validation)
const bankingForm = ref({
  accountNumber: '',
  routingNumber: '',
  accountType: '',
  currency: '',
  initialDeposit: ''
})

// Validation rules for banking requirements
const bankingConfig = {
  accountNumber: ['required', 'bankAccount'],    // Required + valid bank account format
  routingNumber: ['required', { rule: 'min', params: { length: 9 } }],  // Required + min 9 digits
  accountType: ['required'],                     // Required field
  currency: ['required', 'currency'],           // Required + valid currency format
  initialDeposit: ['required', { rule: 'min', params: { amount: 25 } }]  // Required + min $25
}

// Get reactive validation state and functions
const { errors, isValid, validate } = useFormValidation(bankingForm, bankingConfig)

// validate() returns the same structure as FormValidationEngine.validate():
// {
//   isValid: boolean,      // true if all fields pass validation
//   fieldErrors: {         // object with arrays of errors per field
//     accountNumber: ["This field is required."],
//     routingNumber: [],
//     accountType: ["This field is required."],
//     currency: [],
//     initialDeposit: ["This field is required."]
//   },
//   summary: [             // flat array of all errors with field names
//     "accountNumber: This field is required.",
//     "accountType: This field is required.",
//     "initialDeposit: This field is required."
//   ]
// }
const handleSubmit = () => {
  const result = validate()  // Manual validation trigger
  if (result.isValid) {
    // All fields passed validation - safe to submit
    console.log('Banking form is valid, processing...')
  } else {
    // Show validation errors to user
    console.log('Form has errors:', result.summary)
  }
}
```

#### E-commerce Product Form Example

```js
import { ref } from 'vue'
import { useFormValidation } from 'oop-validator'

// Reactive product form data (automatically validates on changes)
const productForm = ref({
  productName: '',
  sku: '',
  price: '',
  website: '',
  description: ''
})

// Validation rules for product data requirements
const productConfig = {
  productName: ['required', { rule: 'min', params: { length: 3 } }],  // Required + min 3 chars
  sku: ['required', { rule: 'regex', params: { pattern: /^[A-Z0-9-]+$/ } }],  // Required + uppercase alphanumeric with dashes
  price: ['required', 'currency'],      // Required + valid currency format ($99.99)
  website: ['url'],                     // Optional but must be valid URL if provided
  description: [{ rule: 'max', params: { length: 500 } }]  // Optional but max 500 chars if provided
}

// Get reactive validation state and helper functions
const { errors, isValid, getFieldErrors, isFieldValid } = useFormValidation(productForm, productConfig)

// Helper functions for individual field validation in your Vue template
const productNameErrors = getFieldErrors('productName')  // Returns reactive array of error messages for product name
const isPriceValid = isFieldValid('price')               // Returns reactive boolean for price field validity

// Use in Vue template:
// <input v-model="productForm.productName" :class="{ error: !isPriceValid.value }" />
// <div v-for="error in productNameErrors.value">{{ error }}</div>
```

**Key Features:**
- **Reactive**: Automatically validates when form data changes
- **Field-specific helpers**: Get validation state for individual fields  
- **Manual validation**: Trigger validation on-demand with `validate()` function
- **Full compatibility**: Uses the same rules as `FormValidationEngine`
- **JavaScript/TypeScript friendly**: Works with or without TypeScript

## Available Validation Rules

The library includes a comprehensive set of built-in validation rules for common business needs:

### Basic Rules
- **`required`** - Field must not be empty
- **`min`** - Minimum length or value: `{ rule: 'min', params: { length: 3 } }`
- **`max`** - Maximum length or value: `{ rule: 'max', params: { length: 50 } }`

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
- **`ipAddress`** - Valid IP address

### Identity Rules
- **`socialSecurity`** - Valid social security number
- **`username`** - Valid username format

### Advanced Rules
- **`regex`** - Custom regex pattern: `{ rule: 'regex', params: { pattern: /^[A-Z]+$/ } }`
- **`passwordStrength`** - Password strength validation
- **`MatchFieldValidationRule`** - Cross-field validation (matches another field)

### Custom Messages
All rules support custom error messages:
```ts
{
  rule: 'min',
  params: { length: 8 },
  message: 'Password must be at least 8 characters long'
}
```

