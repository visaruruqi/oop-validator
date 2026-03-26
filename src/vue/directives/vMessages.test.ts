// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { messagesRegistry } from './registry';

describe('v-messages directive', () => {
  it('should register context in messagesRegistry on mount', async () => {
    const { vMessages } = await import('./vMessages');
    const el = document.createElement('div');
    document.body.appendChild(el);

    vMessages.mounted!(el, {
      value: { required: true },
      oldValue: undefined,
      dir: {} as any,
      instance: null,
      modifiers: {},
      arg: undefined
    }, {} as any, null);

    const ctx = messagesRegistry.get(el);
    expect(ctx).toBeDefined();
    expect(ctx!.errors).toEqual({ required: true });
    expect(ctx!.multiple).toBe(false);

    vMessages.unmounted!(el, {} as any, {} as any, null);
    document.body.removeChild(el);
  });

  it('should set multiple=true with .multiple modifier', async () => {
    const { vMessages } = await import('./vMessages');
    const el = document.createElement('div');
    document.body.appendChild(el);

    vMessages.mounted!(el, {
      value: { required: true, email: true },
      oldValue: undefined,
      dir: {} as any,
      instance: null,
      modifiers: { multiple: true },
      arg: undefined
    }, {} as any, null);

    const ctx = messagesRegistry.get(el);
    expect(ctx!.multiple).toBe(true);

    vMessages.unmounted!(el, {} as any, {} as any, null);
    document.body.removeChild(el);
  });

  it('should clean up on unmount', async () => {
    const { vMessages } = await import('./vMessages');
    const el = document.createElement('div');
    document.body.appendChild(el);

    vMessages.mounted!(el, { value: {}, oldValue: undefined, dir: {} as any, instance: null, modifiers: {}, arg: undefined }, {} as any, null);
    expect(messagesRegistry.has(el)).toBe(true);

    vMessages.unmounted!(el, {} as any, {} as any, null);
    expect(messagesRegistry.has(el)).toBe(false);

    document.body.removeChild(el);
  });
});
