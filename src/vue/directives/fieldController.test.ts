// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { ensureFieldController, releaseFieldController, fieldControllers, formRegistry } from './registry';

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

describe('shared FieldController', () => {
  it('should create one blur listener for multiple directives on same input', () => {
    const formEl = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'email');
    formEl.appendChild(el);
    document.body.appendChild(formEl);

    const form = makeMockForm();
    formRegistry.set(formEl, form);

    const addSpy = vi.spyOn(el, 'addEventListener');

    ensureFieldController(el, form, 'email');
    ensureFieldController(el, form, 'email');
    ensureFieldController(el, form, 'email');

    // blur and input should be added only once
    const blurCalls = addSpy.mock.calls.filter(c => c[0] === 'blur');
    expect(blurCalls.length).toBe(1);

    const inputCalls = addSpy.mock.calls.filter(c => c[0] === 'input');
    expect(inputCalls.length).toBe(1);

    releaseFieldController(el, form);
    releaseFieldController(el, form);
    releaseFieldController(el, form);
    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });

  it('should increment directiveCount for each call to ensureFieldController', () => {
    const formEl = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'name');
    formEl.appendChild(el);
    document.body.appendChild(formEl);

    const form = makeMockForm();
    formRegistry.set(formEl, form);

    ensureFieldController(el, form, 'name');
    ensureFieldController(el, form, 'name');

    const controller = fieldControllers.get(el);
    expect(controller?.directiveCount).toBe(2);

    releaseFieldController(el, form);
    releaseFieldController(el, form);
    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });

  it('should remove listeners when directiveCount reaches 0', () => {
    const formEl = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('name', 'phone');
    formEl.appendChild(el);
    document.body.appendChild(formEl);

    const form = makeMockForm();
    formRegistry.set(formEl, form);
    const removeSpy = vi.spyOn(el, 'removeEventListener');

    ensureFieldController(el, form, 'phone');
    ensureFieldController(el, form, 'phone');
    releaseFieldController(el, form);
    releaseFieldController(el, form); // count reaches 0

    const blurRemoves = removeSpy.mock.calls.filter(c => c[0] === 'blur');
    expect(blurRemoves.length).toBe(1);
    expect(fieldControllers.has(el)).toBe(false);

    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });

  it('should add change listener for checkbox inputs', () => {
    const formEl = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('type', 'checkbox');
    el.setAttribute('name', 'accept');
    formEl.appendChild(el);
    document.body.appendChild(formEl);

    const form = makeMockForm();
    formRegistry.set(formEl, form);
    const addSpy = vi.spyOn(el, 'addEventListener');

    ensureFieldController(el, form, 'accept');

    const changeCalls = addSpy.mock.calls.filter(c => c[0] === 'change');
    expect(changeCalls.length).toBe(1);

    releaseFieldController(el, form);
    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });

  it('should remove change listener for checkbox on cleanup', () => {
    const formEl = document.createElement('form');
    const el = document.createElement('input');
    el.setAttribute('type', 'checkbox');
    el.setAttribute('name', 'terms');
    formEl.appendChild(el);
    document.body.appendChild(formEl);

    const form = makeMockForm();
    formRegistry.set(formEl, form);
    const removeSpy = vi.spyOn(el, 'removeEventListener');

    ensureFieldController(el, form, 'terms');
    releaseFieldController(el, form);

    const changeRemoves = removeSpy.mock.calls.filter(c => c[0] === 'change');
    expect(changeRemoves.length).toBe(1);

    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });
});
