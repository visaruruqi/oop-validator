// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp, reactive, ref, nextTick } from 'vue';
import { VueValidationPlugin } from './directives/install';
import { useForm } from './useForm';
import { formRegistry, formNameRegistry } from './directives/registry';

/**
 * Regression coverage for the bug where useForm()'s one-shot onMounted lookup
 * tore down formNameRegistry even when the <form> was behind a v-if and not yet
 * in the DOM, leaving late-mounting directives unable to resolve the form.
 */

interface TestForm {
  container: HTMLDivElement;
  app: ReturnType<typeof createApp>;
  form: any;
  ready: ReturnType<typeof ref<boolean>>;
  cleanup: () => void;
}

function mountConditionalForm(formName: string, startReady: boolean): TestForm {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let formInstance: any;
  const ready = ref(startReady);

  const app = createApp({
    setup() {
      formInstance = useForm(formName, reactive({ email: '' }));
      return { form: formInstance, ready };
    },
    template: `
      <form v-if="ready" :name="formName">
        <input name="email" v-required />
      </form>
    `,
    data() {
      return { formName };
    },
  });
  app.use(VueValidationPlugin);
  app.mount(container);

  return {
    container,
    app,
    get form() { return formInstance; },
    ready,
    cleanup: () => {
      app.unmount();
      container.remove();
    },
  } as unknown as TestForm;
}

describe('useForm — conditionally-rendered <form> (v-if)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    warnSpy?.mockRestore();
  });

  it('registers v-required rules when the <form> mounts after onMounted', async () => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = mountConditionalForm('lateForm', /* startReady */ false);

    // Form is behind v-if=false — nothing in the DOM, validation is vacuously true.
    expect(t.container.querySelector('form')).toBeNull();

    // Flip the gate — the <form> and its v-required input mount now.
    t.ready.value = true;
    await nextTick();

    const formEl = t.container.querySelector('form') as HTMLFormElement;
    expect(formEl).not.toBeNull();

    // The directive resolved the form and registered its rule.
    t.form.validate();
    await nextTick();
    expect(t.form.email.$error.required).toBe(true);
    expect(t.form.validate().isValid).toBe(false);

    // No "[v-required] No useForm() found" warning was logged.
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('No useForm()'),
    );

    t.cleanup();
  });

  it('still registers via the formRegistry WeakMap path when present at mount', async () => {
    const t = mountConditionalForm('eagerForm', /* startReady */ true);
    await nextTick();

    const formEl = t.container.querySelector('form') as HTMLFormElement;
    expect(formEl).not.toBeNull();
    expect(formRegistry.has(formEl)).toBe(true);

    t.form.validate();
    await nextTick();
    expect(t.form.email.$error.required).toBe(true);
    expect(t.form.validate().isValid).toBe(false);

    t.cleanup();
  });

  it('unmounting a late-mounted form clears both registries', async () => {
    const t = mountConditionalForm('teardownForm', /* startReady */ false);

    t.ready.value = true;
    await nextTick();
    const formEl = t.container.querySelector('form') as HTMLFormElement;
    // Force the promote-on-lookup path to bind the element.
    t.form.validate();
    await nextTick();
    expect(formRegistry.has(formEl)).toBe(true);

    t.cleanup();

    expect(formRegistry.has(formEl)).toBe(false);
    expect(formNameRegistry.has('teardownForm')).toBe(false);
  });

  it('applies form-level CSS classes even when the form mounts late', async () => {
    const t = mountConditionalForm('cssForm', /* startReady */ false);

    t.ready.value = true;
    await nextTick();
    // Trigger the promote-on-lookup so the class watcher starts.
    t.form.validate();
    await nextTick();

    const formEl = t.container.querySelector('form') as HTMLFormElement;
    expect(formEl.classList.contains('v-form-pristine')).toBe(true);

    // The watcher is live: a state change repaints the form element.
    await t.form.$submit(() => {});
    await nextTick();
    expect(formEl.classList.contains('v-form-submitted')).toBe(true);

    t.cleanup();
  });
});
