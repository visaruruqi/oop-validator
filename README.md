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

```
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

```
import { IValidationRule } from 'oop-validator';

export class PhoneNumberValidationRule implements IValidationRule {
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
