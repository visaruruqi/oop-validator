// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { formRegistry } from './registry';

describe('v-minlength directive', () => {
  it('should register min rule with correct length param', async () => {
    const { vMinlength } = await import('./vMinlength');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'username');
    document.body.appendChild(mockForm);
    mockForm.appendChild(el);

    const registerRule = vi.fn();
    const mockFormInstance = {
      registerRule,
      unregisterRule: vi.fn(),
      validate: vi.fn(),
      touch: vi.fn(),
      registerField: vi.fn(),
      unregisterField: vi.fn(),
      fields: { value: { username: { $valid: true, $invalid: false, $pristine: true, $dirty: false, $touched: false, $untouched: true, $pending: false, $error: {} } } }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vMinlength.mounted!(el, { value: 5, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(registerRule).toHaveBeenCalledWith('username', 'minlength', expect.any(Object));
    const ruleArg = registerRule.mock.calls[0][2];
    expect(ruleArg.ruleKey).toBe('minlength');

    vMinlength.unmounted!(el, {} as any, {} as any, null);
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should clean up on unmount', async () => {
    const { vMinlength } = await import('./vMinlength');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'password');
    document.body.appendChild(mockForm);
    mockForm.appendChild(el);

    const unregisterRule = vi.fn();
    const unregisterField = vi.fn();
    const mockFormInstance = {
      registerRule: vi.fn(),
      unregisterRule,
      validate: vi.fn(),
      touch: vi.fn(),
      registerField: vi.fn(),
      unregisterField,
      fields: { value: {} }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vMinlength.mounted!(el, { value: 8, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);
    vMinlength.unmounted!(el, {} as any, {} as any, null);

    expect(unregisterRule).toHaveBeenCalledWith('password', 'minlength');

    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });
});
