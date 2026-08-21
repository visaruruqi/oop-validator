// @vitest-environment jsdom
/**
 * Tests that CSS classes (v-invalid, v-touched, v-form-*) update on the DOM
 * when validation state is changed *programmatically* — i.e. without any blur
 * or input event firing on the inputs.
 *
 * The user-facing scenario:
 *
 *   async function handleSave() {
 *     const result = form.validate()
 *     if (!result.isValid) return    // styling must already reflect errors
 *     ...
 *   }
 */
import { describe, it, expect } from 'vitest';
import { createApp, reactive, nextTick } from 'vue';
import { useForm } from '../vue/useForm';
import { VueValidationPlugin } from '../vue/directives/install';

function mountForm(formName: string, data: Record<string, any>, template: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let capturedInstance: any;

  const app = createApp({
    setup() {
      capturedInstance = useForm(formName, reactive(data));
      return { form: capturedInstance };
    },
    template,
  });
  app.use(VueValidationPlugin);
  app.mount(container);

  return {
    container,
    get form() { return capturedInstance; },
    formEl: container.querySelector('form') as HTMLFormElement,
    inputEl: (name: string) => container.querySelector(`[name="${name}"]`) as HTMLInputElement,
    cleanup: () => { app.unmount(); container.remove(); },
  };
}

describe('Programmatic validate() repaints CSS classes', () => {
  it('form.validate() adds v-invalid + v-invalid-required to required-but-empty input without blur/input', async () => {
    const { form, inputEl, cleanup } = mountForm(
      'progValidate1',
      { email: '' },
      `<form name="progValidate1"><input name="email" v-required /></form>`,
    );
    await nextTick();

    const input = inputEl('email');
    // Initially the field is pristine/untouched but already invalid (required + empty).
    // Whatever the initial classes say, the test focus is: programmatic validate()
    // must result in v-invalid being present after the call.

    form.validate();
    await nextTick();

    expect(input.classList.contains('v-invalid')).toBe(true);
    expect(input.classList.contains('v-invalid-required')).toBe(true);
    expect(input.classList.contains('v-valid')).toBe(false);

    cleanup();
  });

  it('form.$validate() (async) lights up v-invalid on the input', async () => {
    const { form, inputEl, cleanup } = mountForm(
      'progValidate2',
      { email: '' },
      `<form name="progValidate2"><input name="email" v-required /></form>`,
    );
    await nextTick();

    await form.$validate();
    await nextTick();

    const input = inputEl('email');
    expect(input.classList.contains('v-invalid')).toBe(true);
    expect(input.classList.contains('v-invalid-required')).toBe(true);

    cleanup();
  });

  it('form.validate() does NOT add v-touched to inputs (regression guard)', async () => {
    const { form, inputEl, cleanup } = mountForm(
      'progValidate3',
      { email: '' },
      `<form name="progValidate3"><input name="email" v-required /></form>`,
    );
    await nextTick();

    form.validate();
    await nextTick();

    const input = inputEl('email');
    expect(input.classList.contains('v-touched')).toBe(false);
    expect(input.classList.contains('v-untouched')).toBe(true);

    cleanup();
  });

  it('classes flip from invalid to valid when underlying data changes and validate() is called', async () => {
    const data = reactive({ email: '' });
    const container = document.createElement('div');
    document.body.appendChild(container);
    let formInstance: any;

    const app = createApp({
      setup() {
        formInstance = useForm('progValidate4', data);
        return { form: formInstance };
      },
      template: `<form name="progValidate4"><input name="email" v-required /></form>`,
    });
    app.use(VueValidationPlugin);
    app.mount(container);
    await nextTick();

    const input = container.querySelector('[name="email"]') as HTMLInputElement;

    formInstance.validate();
    await nextTick();
    expect(input.classList.contains('v-invalid')).toBe(true);

    data.email = 'a@b.com';
    formInstance.validate();
    await nextTick();
    expect(input.classList.contains('v-valid')).toBe(true);
    expect(input.classList.contains('v-invalid')).toBe(false);
    expect(input.classList.contains('v-invalid-required')).toBe(false);

    app.unmount();
    container.remove();
  });

  it('form.touchAll() adds v-touched to registered inputs', async () => {
    const { form, inputEl, cleanup } = mountForm(
      'progValidate5',
      { email: '', name: '' },
      `<form name="progValidate5">
        <input name="email" v-required />
        <input name="name" v-required />
      </form>`,
    );
    await nextTick();

    form.touchAll();
    await nextTick();

    expect(inputEl('email').classList.contains('v-touched')).toBe(true);
    expect(inputEl('name').classList.contains('v-touched')).toBe(true);

    cleanup();
  });
});

describe('Form element gets aggregate v-form-* classes', () => {
  it('initial state: v-form-pristine + v-form-untouched, no v-form-dirty/touched/submitted', async () => {
    const { formEl, cleanup } = mountForm(
      'formClass1',
      { email: '' },
      `<form name="formClass1"><input name="email" v-required /></form>`,
    );
    await nextTick();

    expect(formEl.classList.contains('v-form-pristine')).toBe(true);
    expect(formEl.classList.contains('v-form-untouched')).toBe(true);
    expect(formEl.classList.contains('v-form-dirty')).toBe(false);
    expect(formEl.classList.contains('v-form-touched')).toBe(false);
    expect(formEl.classList.contains('v-form-submitted')).toBe(false);

    cleanup();
  });

  it('form.validate() does NOT add v-form-touched or v-form-submitted', async () => {
    const { form, formEl, cleanup } = mountForm(
      'formClass2',
      { email: '' },
      `<form name="formClass2"><input name="email" v-required /></form>`,
    );
    await nextTick();

    form.validate();
    await nextTick();

    expect(formEl.classList.contains('v-form-touched')).toBe(false);
    expect(formEl.classList.contains('v-form-submitted')).toBe(false);

    cleanup();
  });

  it('form.touchAll() flips v-form-touched on the form element', async () => {
    const { form, formEl, cleanup } = mountForm(
      'formClass3',
      { email: '' },
      `<form name="formClass3"><input name="email" v-required /></form>`,
    );
    await nextTick();

    expect(formEl.classList.contains('v-form-untouched')).toBe(true);

    form.touchAll();
    await nextTick();

    expect(formEl.classList.contains('v-form-touched')).toBe(true);
    expect(formEl.classList.contains('v-form-untouched')).toBe(false);

    cleanup();
  });

  it('changing field value flips v-form-pristine → v-form-dirty', async () => {
    const data = reactive({ email: '' });
    const container = document.createElement('div');
    document.body.appendChild(container);
    let formInstance: any;

    const app = createApp({
      setup() {
        formInstance = useForm('formClass4', data);
        return { form: formInstance };
      },
      template: `<form name="formClass4"><input name="email" v-required /></form>`,
    });
    app.use(VueValidationPlugin);
    app.mount(container);
    await nextTick();

    const formEl = container.querySelector('form') as HTMLFormElement;
    expect(formEl.classList.contains('v-form-pristine')).toBe(true);

    // useForm defaults dirtyTracking: 'interaction' — a bare programmatic
    // write is hydration and moves the baseline. A real user edit is a DOM
    // input event plus the model write it produces.
    const inputEl = container.querySelector('input') as HTMLInputElement;
    inputEl.value = 'a@b.com';
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    data.email = 'a@b.com';
    await nextTick();

    expect(formEl.classList.contains('v-form-dirty')).toBe(true);
    expect(formEl.classList.contains('v-form-pristine')).toBe(false);

    app.unmount();
    container.remove();
  });

  it('$submit() adds v-form-submitted on the form element', async () => {
    const { form, formEl, cleanup } = mountForm(
      'formClass5',
      { email: '' },
      `<form name="formClass5"><input name="email" v-required /></form>`,
    );
    await nextTick();

    expect(formEl.classList.contains('v-form-submitted')).toBe(false);

    await form.$submit(() => {});
    await nextTick();

    expect(formEl.classList.contains('v-form-submitted')).toBe(true);

    cleanup();
  });
});
