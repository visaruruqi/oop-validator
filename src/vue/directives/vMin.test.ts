// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { formRegistry } from './registry';

describe('v-min directive', () => {
  it('should register NumericMinValidationRule (not MinValidationRule)', async () => {
    const { vMin } = await import('./vMin');
    const NumericMinValidationRule = (await import('../../rules/NumericMinValidationRule')).default;
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'age');
    el.setAttribute('type', 'number');
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
      fields: { value: { age: { $valid: true, $invalid: false, $pristine: true, $dirty: false, $touched: false, $untouched: true, $pending: false, $error: {} } } }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vMin.mounted!(el, { value: 18, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(registerRule).toHaveBeenCalledWith('age', 'min', expect.any(NumericMinValidationRule));

    vMin.unmounted!(el, {} as any, {} as any, null);
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should clean up on unmount', async () => {
    const { vMin } = await import('./vMin');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'score');
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

    vMin.mounted!(el, { value: 0, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);
    vMin.unmounted!(el, {} as any, {} as any, null);

    expect(unregisterRule).toHaveBeenCalledWith('score', 'min');

    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });
});
