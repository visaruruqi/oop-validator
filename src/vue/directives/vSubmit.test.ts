// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { formRegistry } from './registry';

describe('v-submit directive', () => {
  it('should add novalidate attribute on mount', async () => {
    const { vSubmit } = await import('./vSubmit');
    const formEl = document.createElement('form');
    document.body.appendChild(formEl);

    vSubmit.mounted!(formEl, { value: vi.fn(), oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(formEl.hasAttribute('novalidate')).toBe(true);

    vSubmit.unmounted!(formEl, {} as any, {} as any, null);
    document.body.removeChild(formEl);
  });

  it('should prevent default form submission', async () => {
    const { vSubmit } = await import('./vSubmit');
    const formEl = document.createElement('form');
    document.body.appendChild(formEl);

    const callback = vi.fn();
    const mockForm = {
      $submit: vi.fn().mockResolvedValue(undefined),
      $valid: { value: true },
      validate: vi.fn(),
      touchAll: vi.fn(),
    } as any;
    formRegistry.set(formEl, mockForm);

    vSubmit.mounted!(formEl, { value: callback, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    const submitEvent = new Event('submit', { cancelable: true });
    const preventSpy = vi.spyOn(submitEvent, 'preventDefault');
    formEl.dispatchEvent(submitEvent);

    expect(preventSpy).toHaveBeenCalled();

    vSubmit.unmounted!(formEl, {} as any, {} as any, null);
    formRegistry.delete(formEl);
    document.body.removeChild(formEl);
  });

  it('should remove submit listener on unmount', async () => {
    const { vSubmit } = await import('./vSubmit');
    const formEl = document.createElement('form');
    document.body.appendChild(formEl);

    const removeSpy = vi.spyOn(formEl, 'removeEventListener');

    vSubmit.mounted!(formEl, { value: vi.fn(), oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);
    vSubmit.unmounted!(formEl, {} as any, {} as any, null);

    expect(removeSpy).toHaveBeenCalledWith('submit', expect.any(Function));

    document.body.removeChild(formEl);
  });
});
