// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ref, reactive, nextTick } from 'vue';
import useFormValidation from '../vue/useFormValidation';
import { formRegistry } from '../vue/directives/registry';

describe('Form lifecycle - $error through validation lifecycle', () => {
  it('$error should update through full validation lifecycle', async () => {
    const data = ref({ email: '' });
    const { fields } = useFormValidation(data, {
      email: ['required', { rule: 'min', params: { length: 3 } }]
    });

    await nextTick();
    expect(fields.value.email.$error.required).toBe(true);

    data.value.email = 'ab';
    await nextTick();
    expect(fields.value.email.$error.required).toBeUndefined();
    expect(fields.value.email.$error.min).toBe(true);

    data.value.email = 'abc';
    await nextTick();
    expect(Object.keys(fields.value.email.$error).length).toBe(0);

    data.value.email = '';
    await nextTick();
    expect(fields.value.email.$error.required).toBe(true);
  });

  it('full flow: pristine → dirty → touched → submit → reset', async () => {
    const data = ref({ name: '' });
    const result = useFormValidation(data, { name: ['required'] });

    // Initial state
    expect(result.$pristine.value).toBe(true);
    expect(result.$dirty.value).toBe(false);
    expect(result.$submitted.value).toBe(false);

    // Type something → dirty
    data.value.name = 'changed';
    await nextTick();
    expect(result.$dirty.value).toBe(true);

    // Touch
    result.touch('name');
    expect(result.fields.value.name.$touched).toBe(true);

    // Submit with invalid state (empty)
    data.value.name = '';
    await nextTick();
    const callback = vi.fn();
    await result.$submit(callback);
    expect(result.$submitted.value).toBe(true);
    expect(callback).not.toHaveBeenCalled();

    // Fix and submit
    data.value.name = 'John';
    await nextTick();
    const callback2 = vi.fn();
    await result.$submit(callback2);
    expect(callback2).toHaveBeenCalled();

    // Reset
    result.$reset();
    await nextTick();
    expect(result.$submitted.value).toBe(false);
  });
});

describe('formRegistry - lifecycle', () => {
  it('should store and delete form instances correctly', () => {
    const formEl = document.createElement('form') as HTMLFormElement;
    document.body.appendChild(formEl);

    const mockForm = { id: 'test' } as any;
    formRegistry.set(formEl, mockForm);
    expect(formRegistry.get(formEl)).toBe(mockForm);

    formRegistry.delete(formEl);
    expect(formRegistry.get(formEl)).toBeUndefined();

    document.body.removeChild(formEl);
  });
});
