// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { messagesRegistry } from './registry';

describe('v-message directive', () => {
  it('should start hidden by default', async () => {
    const { vMessage } = await import('./vMessage');
    const el = document.createElement('span');
    document.body.appendChild(el);

    vMessage.mounted!(el, { value: 'required', oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect(el.style.display).toBe('none');

    vMessage.unmounted!(el, {} as any, {} as any, null);
    document.body.removeChild(el);
  });

  it('should store __vMessageKey on element', async () => {
    const { vMessage } = await import('./vMessage');
    const el = document.createElement('span');
    document.body.appendChild(el);

    vMessage.mounted!(el, { value: 'email', oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    expect((el as any).__vMessageKey).toBe('email');

    vMessage.unmounted!(el, {} as any, {} as any, null);
    document.body.removeChild(el);
  });

  it('should show when error key matches in parent v-messages', async () => {
    const { vMessage } = await import('./vMessage');
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    // Setup parent v-messages context
    messagesRegistry.set(parent, { errors: { required: true }, multiple: true });

    vMessage.mounted!(child, { value: 'required', oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);

    // Should be visible since required: true
    expect(child.style.display).toBe('');

    vMessage.unmounted!(child, {} as any, {} as any, null);
    messagesRegistry.delete(parent);
    document.body.removeChild(parent);
  });
});
