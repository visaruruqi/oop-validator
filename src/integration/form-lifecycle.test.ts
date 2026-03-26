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
    expect(fields.value.email.$error.required).toBe(false);
    expect(fields.value.email.$error.min).toBe(true);

    data.value.email = 'abc';
    await nextTick();
    expect(Object.keys(fields.value.email.$error).length).toBe(2);

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

describe('$touched/$dirty survive validation cycles (fieldsEqual guard)', () => {
  it('$touched is not reset when unrelated data changes trigger re-validation', async () => {
    const data = ref({ email: '', username: '' });
    const { fields, touch } = useFormValidation(data, {
      email: ['required'],
      username: ['required'],
    });

    await nextTick();
    touch('email');
    expect(fields.value.email.$touched).toBe(true);

    // Changing a different field triggers validate() → fieldsEqual guard
    // must preserve email.$touched
    data.value.username = 'alice';
    await nextTick();
    expect(fields.value.email.$touched).toBe(true);

    // Changing the touched field itself must also preserve $touched
    data.value.email = 'a@b.com';
    await nextTick();
    expect(fields.value.email.$touched).toBe(true);
  });

  it('$dirty is not reset when validation runs without model changes', async () => {
    const data = ref({ name: '' });
    const { fields, validate } = useFormValidation(data, { name: ['required'] });

    await nextTick();
    data.value.name = 'x';
    await nextTick();
    expect(fields.value.name.$dirty).toBe(true);

    // Explicit re-validation must not wipe $dirty
    await validate();
    expect(fields.value.name.$dirty).toBe(true);
  });

  it('fields.value reference is stable (not replaced) when nothing changes', async () => {
    const data = ref({ x: 'hello' });
    const { fields, validate } = useFormValidation(data, { x: ['required'] });

    await nextTick();
    const ref1 = fields.value;

    // Two back-to-back validations with identical data
    await validate();
    await validate();

    // fieldsEqual returns true → fields.value must be the same object reference
    expect(fields.value).toBe(ref1);
  });

  it('fields.value IS replaced when validation result changes', async () => {
    const data = ref({ x: '' });
    const { fields } = useFormValidation(data, { x: ['required'] });

    await nextTick();
    const ref1 = fields.value;

    data.value.x = 'filled';
    await nextTick();

    // $error.required flipped — fields must be a new object
    expect(fields.value).not.toBe(ref1);
    expect(fields.value.x.$error.required).toBe(false);
  });

  it('$touched set before submit is preserved after $submit triggers re-validation', async () => {
    const data = ref({ email: '' });
    const result = useFormValidation(data, { email: ['required'] });

    await nextTick();
    result.touch('email');
    expect(result.fields.value.email.$touched).toBe(true);

    // $submit validates all fields; $touched must survive
    const cb = vi.fn();
    await result.$submit(cb);
    expect(result.fields.value.email.$touched).toBe(true);
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
