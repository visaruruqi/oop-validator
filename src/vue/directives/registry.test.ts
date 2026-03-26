// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { formRegistry, messagesRegistry, fieldControllers } from './registry';

describe('formRegistry', () => {
  it('should store form instance keyed by form element', () => {
    const formEl = document.createElement('form') as HTMLFormElement;
    const mockForm = { validate: () => {}, fields: { value: {} } } as any;
    formRegistry.set(formEl, mockForm);
    expect(formRegistry.get(formEl)).toBe(mockForm);
    formRegistry.delete(formEl);
  });

  it('should return undefined for unregistered form', () => {
    const formEl = document.createElement('form') as HTMLFormElement;
    expect(formRegistry.get(formEl)).toBeUndefined();
  });

  it('should allow overwriting (re-mount same form)', () => {
    const formEl = document.createElement('form') as HTMLFormElement;
    const mockForm1 = { id: 1 } as any;
    const mockForm2 = { id: 2 } as any;
    formRegistry.set(formEl, mockForm1);
    formRegistry.set(formEl, mockForm2);
    expect(formRegistry.get(formEl)).toBe(mockForm2);
    formRegistry.delete(formEl);
  });
});

describe('messagesRegistry', () => {
  it('should store messages context keyed by container element', () => {
    const el = document.createElement('div');
    const context = { errors: { required: true }, multiple: false };
    messagesRegistry.set(el, context);
    expect(messagesRegistry.get(el)).toEqual(context);
    messagesRegistry.delete(el);
  });
});

describe('fieldControllers', () => {
  it('should store field controllers by element', () => {
    const el = document.createElement('input');
    const controller = {
      fieldName: 'email',
      blurHandler: () => {},
      inputHandler: () => {},
      directiveCount: 1,
    };
    fieldControllers.set(el, controller);
    expect(fieldControllers.get(el)).toBe(controller);
    fieldControllers.delete(el);
  });
});
