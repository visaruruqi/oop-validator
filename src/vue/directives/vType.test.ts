// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { formRegistry } from './registry';

describe('v-type directive', () => {
  async function mountDirective(elType: string, bindingValue?: string) {
    const { vType } = await import('./vType');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'testField');
    el.setAttribute('type', elType);
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
      fields: { value: { testField: { $valid: true, $invalid: false, $pristine: true, $dirty: false, $touched: false, $untouched: true, $pending: false, $error: {} } } }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vType.mounted!(el, { value: bindingValue, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    return { el, registerRule, mockForm, vType, mockFormInstance };
  }

  it('should register email rule for type="email"', async () => {
    const { registerRule, mockForm, el } = await mountDirective('email');
    expect(registerRule).toHaveBeenCalledWith('testField', 'email', expect.any(Object));
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should register number rule for type="number"', async () => {
    const { registerRule, mockForm, el } = await mountDirective('number');
    expect(registerRule).toHaveBeenCalledWith('testField', 'number', expect.any(Object));
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should register url rule for type="url"', async () => {
    const { registerRule, mockForm, el } = await mountDirective('url');
    expect(registerRule).toHaveBeenCalledWith('testField', 'url', expect.any(Object));
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should not register anything for type="text"', async () => {
    const { registerRule, mockForm, el } = await mountDirective('text');
    expect(registerRule).not.toHaveBeenCalled();
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });
});
