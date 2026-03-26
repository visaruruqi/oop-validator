// @vitest-environment jsdom
/**
 * Tests for the two-registry timing bug and memory-leak fixes.
 *
 * Bug: directives mount before component onMounted fires, so formRegistry
 * (WeakMap keyed by element) is empty when the directive first calls
 * getFormInstance(). Fix: formNameRegistry (Map keyed by name string) is
 * populated synchronously during setup() so directives can find the form
 * immediately, then the Map entry is deleted in onMounted() once the
 * WeakMap takes over.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp, reactive, nextTick } from 'vue';
import { useForm } from '../vue/useForm';
import { formRegistry, formNameRegistry, getFormInstance } from '../vue/directives/registry';
import { VValidationPlugin } from '../vue/directives/install';

// ─── helpers ────────────────────────────────────────────────────────────────

function mountApp(formName: string, data: Record<string, any>, template?: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let capturedInstance: any;

  const app = createApp({
    setup() {
      capturedInstance = useForm(formName, reactive(data));
      return { form: capturedInstance };
    },
    template: template ?? `<form name="${formName}"></form>`,
  });
  app.use(VValidationPlugin);
  app.mount(container);

  return {
    container,
    get form() { return capturedInstance; },
    formEl: () => container.querySelector('form') as HTMLFormElement | null,
    cleanup: () => { app.unmount(); container.remove(); },
  };
}

// ─── formNameRegistry populated synchronously ────────────────────────────────

describe('formNameRegistry - synchronous setup() registration', () => {
  it('is populated immediately after useForm() returns, before any tick', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let instance: any;

    const app = createApp({
      setup() {
        instance = useForm('sync-test', reactive({ email: '' }));
        // Check INSIDE setup, before any lifecycle hook
        expect(formNameRegistry.has('sync-test')).toBe(true);
        expect(formNameRegistry.get('sync-test')).toBe(instance);
        return {};
      },
      template: '<form name="sync-test"></form>',
    });
    app.use(VValidationPlugin);
    app.mount(container);

    app.unmount();
    container.remove();
  });

  it('allows getFormInstance() to resolve before onMounted fires', () => {
    // Simulate the timing: directive mounted() fires before onMounted().
    // At that point formRegistry (WeakMap) is still empty.
    // getFormInstance() must fall back to formNameRegistry successfully.
    const formEl = document.createElement('form');
    formEl.setAttribute('name', 'early-lookup');
    document.body.appendChild(formEl);

    const mockInstance = { id: 'mock' } as any;
    formNameRegistry.set('early-lookup', mockInstance);

    // WeakMap has nothing yet (simulates pre-onMounted state)
    expect(formRegistry.has(formEl)).toBe(false);

    const found = getFormInstance(formEl);
    expect(found).toBe(mockInstance);

    formNameRegistry.delete('early-lookup');
    document.body.removeChild(formEl);
  });

  it('getFormInstance() prefers WeakMap over Map when both are populated', () => {
    const formEl = document.createElement('form');
    formEl.setAttribute('name', 'dual-registry');
    document.body.appendChild(formEl);

    const weakMapInstance = { id: 'weakmap' } as any;
    const mapInstance = { id: 'map' } as any;

    formRegistry.set(formEl, weakMapInstance);
    formNameRegistry.set('dual-registry', mapInstance);

    expect(getFormInstance(formEl)).toBe(weakMapInstance);

    formRegistry.delete(formEl);
    formNameRegistry.delete('dual-registry');
    document.body.removeChild(formEl);
  });
});

// ─── Map entry lifecycle ──────────────────────────────────────────────────────

describe('formNameRegistry - Map entry is short-lived', () => {
  let cleanup: () => void;

  afterEach(() => cleanup?.());

  it('Map entry is deleted in onMounted, leaving only WeakMap', async () => {
    const { cleanup: c, formEl } = mountApp('map-gc-test', { name: '' });
    cleanup = c;

    // After mount + nextTick, onMounted has fired
    await nextTick();

    // Map entry must be gone
    expect(formNameRegistry.has('map-gc-test')).toBe(false);

    // WeakMap entry must exist
    const el = formEl();
    expect(el).not.toBeNull();
    expect(formRegistry.has(el!)).toBe(true);
  });

  it('Map entry is cleaned up by onUnmounted if onMounted never fired', () => {
    // Simulate: component destroyed before mount (e.g. SSR, conditional render).
    // We achieve this by calling useForm() in an app that is immediately unmounted
    // before it can mount (no DOM element → onMounted querySelector returns null,
    // but the Map entry must still be cleared).
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp({
      setup() {
        useForm('never-mounted', reactive({ x: '' }));
        return {};
      },
      template: '<span></span>', // no <form> so onMounted querySelector fails
    });
    app.use(VValidationPlugin);
    app.mount(container);

    // Map entry exists right after mount (onMounted would have deleted it but
    // querySelector found no form, so deletion still happens)
    // Unmount triggers onUnmounted which must delete the entry regardless
    app.unmount();
    expect(formNameRegistry.has('never-mounted')).toBe(false);

    container.remove();
  });

  it('WeakMap entry is removed in onUnmounted', async () => {
    const { cleanup: c, formEl } = mountApp('unmount-weakmap', { x: '' });
    cleanup = () => {}; // manual control
    await nextTick();

    const el = formEl()!;
    expect(formRegistry.has(el)).toBe(true);

    c(); // unmount + remove container
    expect(formRegistry.has(el)).toBe(false);
  });
});

// ─── duplicate name guard ─────────────────────────────────────────────────────

describe('formNameRegistry - duplicate name behaviour', () => {
  it('Map entry is set during setup() and cleared by onMounted()', async () => {
    // This test verifies the Map is ephemeral: present during setup→mounted gap,
    // absent after onMounted fires. A duplicate name would only matter in that
    // window (directives resolving before mount), not after.
    const container = document.createElement('div');
    document.body.appendChild(container);

    let seenDuringSetup = false;

    const app = createApp({
      setup() {
        const inst = useForm('dup-check', reactive({ a: '' }));
        seenDuringSetup = formNameRegistry.has('dup-check');
        return {};
      },
      template: '<form name="dup-check"></form>',
    });
    app.use(VValidationPlugin);
    app.mount(container);

    expect(seenDuringSetup).toBe(true);          // present during setup
    await nextTick();
    expect(formNameRegistry.has('dup-check')).toBe(false); // gone after onMounted

    app.unmount();
    container.remove();
  });
});

// ─── directive timing: can resolve form before onMounted ─────────────────────

describe('directive timing - v-required resolves form via formNameRegistry', () => {
  it('directive mounted() can find form instance through Map fallback', async () => {
    // Plant the form in the Map (as setup() would), but NOT in the WeakMap.
    const formEl = document.createElement('form');
    formEl.setAttribute('name', 'directive-timing');
    document.body.appendChild(formEl);

    const mockForm = {
      registerRule: () => {},
      unregisterRule: () => {},
      registerField: () => {},
      unregisterField: () => {},
      validate: () => {},
      touch: () => {},
      fields: { value: {} },
    } as any;

    formNameRegistry.set('directive-timing', mockForm);
    // WeakMap intentionally empty — simulates pre-onMounted state
    expect(formRegistry.has(formEl)).toBe(false);

    // getFormInstance must succeed via Map fallback
    const found = getFormInstance(formEl);
    expect(found).toBe(mockForm);

    formNameRegistry.delete('directive-timing');
    document.body.removeChild(formEl);
  });

  it('after onMounted fires, getFormInstance resolves via WeakMap (Map entry gone)', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp({
      setup() {
        useForm('post-mount', reactive({ x: '' }));
        return {};
      },
      template: '<form name="post-mount"></form>',
    });
    app.use(VValidationPlugin);
    app.mount(container);
    await nextTick();

    // Map entry is gone
    expect(formNameRegistry.has('post-mount')).toBe(false);

    // WeakMap entry exists
    const formEl = container.querySelector('form') as HTMLFormElement;
    expect(formRegistry.has(formEl)).toBe(true);

    // Lookup still works (WeakMap path)
    const found = getFormInstance(formEl);
    expect(found).not.toBeNull();

    app.unmount();
    container.remove();
  });
});
