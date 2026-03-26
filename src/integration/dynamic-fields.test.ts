// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import useFormValidation from '../vue/useFormValidation';

describe('Dynamic fields - registerField / unregisterField', () => {
  it('should register field when added dynamically', () => {
    const data = ref({ email: '' });
    const result = useFormValidation(data, {}, { validateOnMount: false });
    result.registerField('email');
    expect(result.fields.value.email).toBeDefined();
  });

  it('should unregister field and remove from state', () => {
    const data = ref({ email: '' });
    const result = useFormValidation(data, {}, { validateOnMount: false });
    result.registerField('email');
    result.unregisterField('email');
    expect(result.fields.value.email).toBeUndefined();
  });

  it('form $valid should recompute without removed field', async () => {
    const data = ref({ email: '', name: 'John' });
    const result = useFormValidation(data, { name: ['required'] }, { validateOnMount: true });
    await nextTick();
    expect(result.$valid.value).toBe(true);
  });
});
