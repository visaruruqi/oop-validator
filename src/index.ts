export { default as MinValidationRule } from "./rules/MinValidationRule";
export { default as EmailValidationRule } from "./rules/EmailValidationRule";
export { default as DomainValidationRule } from "./rules/DomainValidationRule";
export { default as MaxValidationRule } from "./rules/MaxValidationRule";
export { default as RequiredValidationRule } from "./rules/RequiredValidationRule";
export { default as ValidationEngine } from "./rules/ValidationEngine";
export { default as IValidationRule } from "./rules/IValidationRule";
export { default as RegexValidationRule } from "./rules/RegexValidationRule";
export { default as BankAccountValidationRule } from "./rules/BankAccountValidationRule";
export { default as CreditCardValidationRule } from "./rules/CreditCardValidationRule";
export { default as ZipCodeValidationRule } from "./rules/ZipCodeValidationRule";
export { default as PhoneNumberValidationRule } from "./rules/PhoneNumberValidationRule";
export { default as DateValidationRule } from "./rules/DateValidationRule";
export { default as UrlValidationRule } from "./rules/UrlValidationRule";
export { default as UsernameValidationRule } from "./rules/UsernameValidationRule";
export { default as PasswordStrengthValidationRule } from "./rules/PasswordStrengthValidationRule";
export { default as IpAddressValidationRule } from "./rules/IpAddressValidationRule";
export { default as CurrencyValidationRule } from "./rules/CurrencyValidationRule";
export { default as SocialSecurityValidationRule } from "./rules/SocialSecurityValidationRule";

export { default as FormValidationEngine } from "./form/FormValidationEngine";
export { default as MatchFieldValidationRule } from "./rules/MatchFieldValidationRule";

// Vue-specific exports (requires Vue to be available)
export { default as useValidation } from "./vue/useValidation";
export { default as useFormValidation } from "./vue/useFormValidation";

// New Vue composables
export { useForm } from './vue/useForm'
export type { UseFormResult } from './vue/useForm'
export type { FieldState, UseFormValidationOptions, UseFormValidationResult } from './vue/useFormValidation'
export type { FormConfig, FieldRules, FormValidationResult } from './form/FormValidationEngine'

// CSS class utilities
export { computeFieldClasses, computeFormClasses } from './vue/cssClasses'

// New numeric rules
export { default as NumericMinValidationRule } from './rules/NumericMinValidationRule'
export { default as NumericMaxValidationRule } from './rules/NumericMaxValidationRule'
export { default as NumberValidationRule } from './rules/NumberValidationRule'

// Vue directives
export { VValidationPlugin, vRequired, vMinlength, vMaxlength, vPattern, vMin, vMax, vType, vMessages, vMessage, vSubmit, vFormGroup } from './vue/directives/install'
