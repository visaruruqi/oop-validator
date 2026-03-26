// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, reactive, nextTick, ref } from 'vue';
import { VValidationPlugin } from './install';
import { useForm } from '../useForm';
import { formRegistry } from './registry';

function createTestForm(formName: string, data: Record<string, any>) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let formInstance: any;

  const app = createApp({
    setup() {
      formInstance = useForm(formName, reactive(data));
      return { form: formInstance };
    },
    template: `<form name="${formName}"></form>`,
  });
  app.use(VValidationPlugin);
  app.mount(container);

  // Manually register form in registry (since onMounted uses document.querySelector)
  const formEl = container.querySelector('form') as HTMLFormElement;
  if (formEl) {
    formRegistry.set(formEl, formInstance);
  }

  return {
    container,
    formEl: formEl!,
    form: formInstance,
    cleanup: () => {
      app.unmount();
      container.remove();
    }
  };
}

describe('v-required directive', () => {
  it('should warn if input has no name attribute', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { vRequired } = await import('./vRequired');
    const el = document.createElement('input');
    const mockForm = document.createElement('form');
    document.body.appendChild(mockForm);
    mockForm.appendChild(el);
    formRegistry.set(mockForm as HTMLFormElement, { registerRule: vi.fn(), unregisterRule: vi.fn(), fields: { value: {} }, validate: vi.fn(), touch: vi.fn(), registerField: vi.fn(), unregisterField: vi.fn() } as any);

    vRequired.mounted!(el, { value: true, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[v-required]'));

    warnSpy.mockRestore();
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should register required rule when mounted on named input', async () => {
    const { vRequired } = await import('./vRequired');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'email');
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
      fields: { value: { email: { $valid: true, $invalid: false, $pristine: true, $dirty: false, $touched: false, $untouched: true, $pending: false, $error: {} } } }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vRequired.mounted!(el, { value: true, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(registerRule).toHaveBeenCalledWith('email', 'required', expect.any(Object));

    vRequired.unmounted!(el, {} as any, {} as any, null);
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });

  it('should not register rule when binding value is false', async () => {
    const { vRequired } = await import('./vRequired');
    const mockForm = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'optionalField');
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
      fields: { value: {} }
    } as any;
    formRegistry.set(mockForm as HTMLFormElement, mockFormInstance);

    vRequired.mounted!(el, { value: false, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(registerRule).not.toHaveBeenCalled();

    vRequired.unmounted!(el, {} as any, {} as any, null);
    formRegistry.delete(mockForm as HTMLFormElement);
    document.body.removeChild(mockForm);
  });
});
