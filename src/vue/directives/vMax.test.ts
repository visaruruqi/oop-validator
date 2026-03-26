// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { formRegistry } from './registry';

describe('v-max directive', () => {
  it('should register NumericMaxValidationRule (not MaxValidationRule)', async () => {
    const { vMax } = await import('./vMax');
    const NumericMaxValidationRule = (await import('../../rules/NumericMaxValidationRule')).default;
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'quantity');
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
      fields: { value: { quantity: { $valid: true, $invalid: false, $pristine: true, $dirty: false, $touched: false, $untouched: true, $pending: false, $error: {} } } }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vMax.mounted!(el, { value: 100, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(registerRule).toHaveBeenCalledWith('quantity', 'max', expect.any(NumericMaxValidationRule));

    vMax.unmounted!(el, {} as any, {} as any, null);
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should clean up on unmount', async () => {
    const { vMax } = await import('./vMax');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'price');
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

    vMax.mounted!(el, { value: 1000, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);
    vMax.unmounted!(el, {} as any, {} as any, null);

    expect(unregisterRule).toHaveBeenCalledWith('price', 'max');

    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });
});
