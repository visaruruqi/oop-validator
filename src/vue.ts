// Vue-specific entry point — composables + directives + plugin
// Import from 'oop-validator/vue'
export { default as useValidation } from './vue/useValidation'
export { default as useFormValidation } from './vue/useFormValidation'
export { useForm } from './vue/useForm'
export type { UseFormResult } from './vue/useForm'
export type { FieldState, UseFormValidationOptions, UseFormValidationResult } from './vue/useFormValidation'

export { computeFieldClasses, computeFormClasses } from './vue/cssClasses'

export {
  VueValidationPlugin,
  vRequired,
  vMinlength,
  vMaxlength,
  vPattern,
  vMin,
  vMax,
  vType,
  vMessages,
  vMessage,
  vSubmit,
  vFormGroup,
} from './vue/directives/install'
