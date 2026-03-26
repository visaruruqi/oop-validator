// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { ensureFieldController, releaseFieldController, fieldControllers, formRegistry } from '../vue/directives/registry';

describe('Memory leaks - event listener tracking', () => {
  function makeMockForm() {
    return {
      registerRule: vi.fn(),
      unregisterRule: vi.fn(),
      validate: vi.fn(),
      touch: vi.fn(),
      registerField: vi.fn(),
      unregisterField: vi.fn(),
      fields: { value: {} },
    } as any;
  }

  it('should not leak event listeners when directive count reaches 0', () => {
    const formEl = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'testField');
    formEl.appendChild(el);
    document.body.appendChild(formEl);

    const form = makeMockForm();
    formRegistry.set(formEl, form);

    const addSpy = vi.spyOn(el, 'addEventListener');
    const removeSpy = vi.spyOn(el, 'removeEventListener');

    ensureFieldController(el, form, 'testField');
    ensureFieldController(el, form, 'testField');

    const addCount = addSpy.mock.calls.length;

    releaseFieldController(el, form);
    releaseFieldController(el, form);

    const removeCount = removeSpy.mock.calls.length;
    expect(removeCount).toBeGreaterThanOrEqual(addCount);
    expect(fieldControllers.has(el)).toBe(false);

    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });

  it('should not leak event listeners for checkbox inputs', () => {
    const formEl = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('type', 'checkbox');
    el.setAttribute('name', 'agree');
    formEl.appendChild(el);
    document.body.appendChild(formEl);

    const form = makeMockForm();
    formRegistry.set(formEl, form);

    const addSpy = vi.spyOn(el, 'addEventListener');
    const removeSpy = vi.spyOn(el, 'removeEventListener');

    ensureFieldController(el, form, 'agree');
    const addCount = addSpy.mock.calls.length;
    releaseFieldController(el, form);
    const removeCount = removeSpy.mock.calls.length;

    expect(removeCount).toBeGreaterThanOrEqual(addCount);

    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });
});
