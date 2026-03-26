import type { FieldState } from './useFormValidation'

export interface FormClasses {
  'v-submitted'?: boolean
  'v-valid'?: boolean
  'v-invalid'?: boolean
  'v-pristine'?: boolean
  'v-dirty'?: boolean
  'v-pending'?: boolean
}

export function computeFieldClasses(field: Partial<FieldState>): Record<string, boolean> {
  const classes: Record<string, boolean> = {
    'v-valid': field.$valid ?? field.isValid ?? true,
    'v-invalid': field.$invalid ?? !(field.isValid ?? true),
    'v-pristine': field.$pristine ?? !field.isDirty ?? true,
    'v-dirty': field.$dirty ?? field.isDirty ?? false,
    'v-touched': field.$touched ?? field.isTouched ?? false,
    'v-untouched': field.$untouched ?? !field.isTouched ?? true,
    'v-pending': field.$pending ?? false,
  }

  // Per-rule classes: v-valid-required, v-invalid-minlength, etc.
  if (field.$error) {
    for (const [ruleKey, failing] of Object.entries(field.$error)) {
      classes[`v-valid-${ruleKey}`] = !failing
      classes[`v-invalid-${ruleKey}`] = failing
    }
  }

  return classes
}

export function computeFormClasses(state: {
  $submitted?: boolean
  $valid?: boolean
  $invalid?: boolean
  $pristine?: boolean
  $dirty?: boolean
  $pending?: boolean
}): Record<string, boolean> {
  return {
    'v-submitted': state.$submitted ?? false,
    'v-valid': state.$valid ?? true,
    'v-invalid': state.$invalid ?? false,
    'v-pristine': state.$pristine ?? true,
    'v-dirty': state.$dirty ?? false,
    'v-pending': state.$pending ?? false,
  }
}
