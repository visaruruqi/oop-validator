# FlexiValidate

FlexiValidate is a versatile and robust validation library designed to seamlessly integrate with any UI framework or library. Whether you're building applications with Vue.js, React, Angular, or any other front-end technology, FlexiValidate provides a comprehensive and flexible solution for all your validation needs.

## Key Features

- **Framework-Agnostic**: Designed to work with any UI framework, ensuring maximum flexibility for your projects.
- **Extensible**: Easily extend the library with custom validation rules to meet specific application requirements.
- **Comprehensive Rule Set**: Includes built-in validation rules such as required, minimum and maximum length, email format, domain validation, and more.
- **Customizable Error Messages**: Configure error messages for each validation rule to provide clear and user-friendly feedback.
- **Easy Integration**: Simple setup and intuitive API make it easy to integrate into existing projects.
- **Lightweight and Performant**: Optimized for performance, ensuring minimal impact on application load times and responsiveness.

## Installation

You can install FlexiValidate via npm:

```sh
npm install flexivalidate
```
## USAGE

```
import { ValidationEngine, RequiredValidationRule, MinValidationRule, MaxValidationRule, EmailValidationRule } from 'flexivalidate';

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
class CustomRule implements IValidationRule {
    private errorMessage: string = "This field must be 'custom'.";

    isValid(param: string): [boolean, string] {
        const isValid = param === 'custom';
        return [isValid, isValid ? "" : this.errorMessage];
    }

    isMatch(type: string): boolean {
        return type.toLowerCase() === 'custom';
    }

    setParams(params: any): void {
        // Custom parameters if needed
    }

    setErrorMessage(message: string): void {
        this.errorMessage = message;
    }
}

// Add the custom rule to the validation engine
validationEngine.addRule(new CustomRule());

const customFieldResult = validationEngine.validateValue('not-custom');
if (!customFieldResult.isValid) {
    console.log('Custom field validation errors:', customFieldResult.errors);
}
```
