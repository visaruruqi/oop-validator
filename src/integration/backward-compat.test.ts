import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import useFormValidation from '../vue/useFormValidation';
import ValidationEngine from '../rules/ValidationEngine';
import FormValidationEngine from '../form/FormValidationEngine';

describe('Backward compatibility - validateValue', () => {
  it('existing destructure { isValid, errors } still works', () => {
    const engine = new ValidationEngine(['required']);
    const { isValid, errors } = engine.validateValue('');
    expect(isValid).toBe(false);
    expect(Array.isArray(errors)).toBe(true);
    expect(errors[0]).toBe('This field is required.');
  });

  it('extra errorsByRule property does not break existing code', () => {
    const engine = new ValidationEngine(['required', 'email']);
    const result = engine.validateValue('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    // extra property ignored
    expect(result.errorsByRule).toBeDefined();
  });
});

describe('Backward compatibility - getRules()', () => {
  it('getRules returns IValidationRule[] unchanged', () => {
    const engine = new ValidationEngine(['required', 'email']);
    const rules = engine.getRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBe(2);
    expect(typeof rules[0].isValid).toBe('function');
  });
});

describe('Backward compatibility - FormValidationEngine', () => {
  it('fieldErrors still works in validate result', () => {
    const engine = new FormValidationEngine({ name: ['required'] });
    const result = engine.validate({ name: '' });
    expect(result.fieldErrors.name).toBeDefined();
    expect(Array.isArray(result.fieldErrors.name)).toBe(true);
  });
});

describe('Backward compatibility - FieldState', () => {
  it('existing FieldState properties (isValid, errors, isDirty, isTouched) still present', () => {
    const data = ref({ name: '' });
    const { fields } = useFormValidation(data, { name: ['required'] });
    const field = fields.value.name;
    expect(typeof field.isValid).toBe('boolean');
    expect(Array.isArray(field.errors)).toBe(true);
    expect(typeof field.isDirty).toBe('boolean');
    expect(typeof field.isTouched).toBe('boolean');
  });

  it('deprecated errors, getFieldErrors, isFieldValid still work', async () => {
    const data = ref({ email: '' });
    const { errors, getFieldErrors, isFieldValid } = useFormValidation(data, { email: ['required'] });
    await nextTick();
    expect(errors.value.email).toBeDefined();
    expect(Array.isArray(getFieldErrors('email').value)).toBe(true);
    expect(typeof isFieldValid('email').value).toBe('boolean');
  });
});
