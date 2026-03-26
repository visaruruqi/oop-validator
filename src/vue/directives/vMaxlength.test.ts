// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { formRegistry } from './registry';

describe('v-maxlength directive', () => {
  it('should register max rule with correct length param', async () => {
    const { vMaxlength } = await import('./vMaxlength');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'bio');
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
      fields: { value: { bio: { $valid: true, $invalid: false, $pristine: true, $dirty: false, $touched: false, $untouched: true, $pending: false, $error: {} } } }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vMaxlength.mounted!(el, { value: 200, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(registerRule).toHaveBeenCalledWith('bio', 'maxlength', expect.any(Object));

    vMaxlength.unmounted!(el, {} as any, {} as any, null);
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should clean up on unmount', async () => {
    const { vMaxlength } = await import('./vMaxlength');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'title');
    document.body.appendChild(mockForm);
    mockForm.appendChild(el);

    const unregisterRule = vi.fn();
    const mockFormInstance = {
      registerRule: vi.fn(),
      unregisterRule,
      validate: vi.fn(),
      touch: vi.fn(),
      registerField: vi.fn(),
      unregisterField: vi.fn(),
      fields: { value: {} }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vMaxlength.mounted!(el, { value: 100, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);
    vMaxlength.unmounted!(el, {} as any, {} as any, null);

    expect(unregisterRule).toHaveBeenCalledWith('title', 'maxlength');

    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should work on textarea elements', async () => {
    const { vMaxlength } = await import('./vMaxlength');
    const mockForm = document.createElement('form');
    const el = document.createElement('textarea');
    el.setAttribute('name', 'description');
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
      fields: { value: { description: { $valid: true, $invalid: false, $pristine: true, $dirty: false, $touched: false, $untouched: true, $pending: false, $error: {} } } }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vMaxlength.mounted!(el as any, { value: 500, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(registerRule).toHaveBeenCalledWith('description', 'maxlength', expect.any(Object));

    vMaxlength.unmounted!(el as any, {} as any, {} as any, null);
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });
});
