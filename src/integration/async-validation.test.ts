import { describe, it, expect, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import useFormValidation from '../vue/useFormValidation';

describe('Async validation', () => {
  it('should set $pending during async validation', async () => {
    let resolveValidator: (v: boolean) => void = () => {};
    const asyncPromise = new Promise<boolean>(r => { resolveValidator = r })

    const data = ref({ email: 'test@test.com' });
    const result = useFormValidation(data, { email: ['required'] }, {
      asyncValidators: { email: { unique: () => asyncPromise } },
      validateOnMount: true,
      debounce: 0,
    });

    await nextTick();
    await new Promise(r => setTimeout(r, 10));
    expect(result.fields.value.email.$pending).toBe(true);
    expect(result.$pending.value).toBe(true);

    resolveValidator(true);
    await new Promise(r => setTimeout(r, 50));
    await nextTick();
    expect(result.fields.value.email.$pending).toBe(false);
  });

  it('should add error key on async failure', async () => {
    const data = ref({ email: 'taken@test.com' });
    const result = useFormValidation(data, { email: ['required'] }, {
      asyncValidators: { email: { uniqueEmail: async () => false } },
      validateOnMount: true,
      debounce: 0,
    });
    await new Promise(r => setTimeout(r, 50));
    await nextTick();
    expect(result.fields.value.email.$error.uniqueEmail).toBe(true);
  });

  it('should skip async if sync fails', async () => {
    const asyncFn = vi.fn().mockResolvedValue(true);
    const data = ref({ email: '' });
    useFormValidation(data, { email: ['required'] }, {
      asyncValidators: { email: { unique: asyncFn } },
      validateOnMount: true,
      debounce: 0,
    });
    await nextTick();
    await new Promise(r => setTimeout(r, 20));
    expect(asyncFn).not.toHaveBeenCalled();
  });
});
