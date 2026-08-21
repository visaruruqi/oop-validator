// @vitest-environment jsdom
//
// The dirty auto-baseline: writes to the model made BEFORE any real user
// input are hydration (async loads, applied defaults) and move the dirty
// baseline with them, so loaded data never counts as user changes. The first
// DOM input freezes the baseline; from then on writes compare against it.
// This mirrors AngularJS, where $dirty was only ever set by $setViewValue.
import { describe, it, expect } from 'vitest';
import { createApp, reactive, nextTick } from 'vue';
import useFormValidation from './useFormValidation';
import { VueValidationPlugin } from './directives/install';
import { useForm } from './useForm';
import RegexValidationRule from '../rules/RegexValidationRule';

const RECORD = { name: 'Phone Charge', code: 'PHONE', default_amount: 0 };

function buildForm(initial: Record<string, any>, options: Record<string, any> = {}) {
  const formData = reactive({ ...initial });
  const form = useFormValidation(formData, {}, { validateOnMount: false, dirtyTracking: 'interaction', ...options });
  const rule = new RegexValidationRule('^[a-zA-Z0-9_-]+$');
  (rule as any).ruleKey = 'pattern';
  form.registerRule('code', 'pattern', rule);
  return { formData, form };
}

describe('useFormValidation - dirty auto-baseline (composable level)', () => {
  it('hydrating after construction does not mark fields dirty', async () => {
    const { formData, form } = buildForm({ name: null, code: null, default_amount: 0 });

    Object.assign(formData, RECORD);
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(false);
    expect(form.fields.value.code.$pristine).toBe(true);
    expect(form.isModelDirty.value).toBe(false);
  });

  it('edits after $noteUserInput are dirty against the hydrated baseline', async () => {
    const { formData, form } = buildForm({ name: null, code: null, default_amount: 0 });

    Object.assign(formData, RECORD);
    await nextTick();

    form.$noteUserInput();
    formData.code = 'PHONE2';
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(true);
    expect(form.isModelDirty.value).toBe(true);
  });

  it('programmatic writes AFTER interaction still count as dirty', async () => {
    const { formData, form } = buildForm({ name: null, code: null, default_amount: 0 });

    Object.assign(formData, RECORD);
    await nextTick();

    form.$noteUserInput();
    Object.assign(formData, { code: 'BULK' });
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(true);
  });

  it('reverting an edit back to the loaded value reads clean again', async () => {
    const { formData, form } = buildForm({ name: null, code: null, default_amount: 0 });

    Object.assign(formData, RECORD);
    await nextTick();

    form.$noteUserInput();
    formData.code = 'PHONE2';
    await nextTick();
    formData.code = 'PHONE';
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(false);
  });

  it('reset() re-arms the baseline for the next load', async () => {
    const { formData, form } = buildForm({ name: null, code: null, default_amount: 0 });

    form.$noteUserInput();
    form.reset();

    Object.assign(formData, RECORD);
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(false);
  });

  it('$setPristine() re-arms the baseline as well', async () => {
    const { formData, form } = buildForm({ name: null, code: null, default_amount: 0 });

    form.$noteUserInput();
    form.$setPristine();

    Object.assign(formData, { code: 'RELOADED' });
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(false);
  });

  it("the 'changed' validation strategy rebaselines too", async () => {
    const { formData, form } = buildForm(
      { name: null, code: null, default_amount: 0 },
      { validationStrategy: 'changed' },
    );

    Object.assign(formData, RECORD);
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(false);
  });
});

describe('useFormValidation - dirtyTracking default stays value-diff', () => {
  it('without the option, programmatic writes still mark fields dirty (back-compat)', async () => {
    const { formData, form } = buildForm({ name: null, code: null, default_amount: 0 }, { dirtyTracking: 'value' });

    Object.assign(formData, RECORD);
    await nextTick();

    expect(form.fields.value.code.$dirty).toBe(true);
    expect(form.isModelDirty.value).toBe(true);
  });
});

describe('useFormValidation - dirty auto-baseline (directive level)', () => {
  function mountEditScreen() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let formInstance: any;
    let formData: any;

    const app = createApp({
      setup() {
        formData = reactive({ code: null as string | null });
        formInstance = useForm('autoBaselineForm', formData);
        return { formData, form: formInstance };
      },
      template: `<form name="autoBaselineForm"><input name="code" v-model="formData.code" v-required /></form>`,
    });
    app.use(VueValidationPlugin);
    app.mount(container);

    return {
      formData,
      form: formInstance,
      input: container.querySelector('input') as HTMLInputElement,
      cleanup: () => {
        app.unmount();
        container.remove();
      },
    };
  }

  it('a real DOM input event freezes the baseline', async () => {
    const { formData, form, input, cleanup } = mountEditScreen();
    try {
      // Hydrate — the app writes, the baseline follows.
      formData.code = 'PHONE';
      await nextTick();
      expect(form.fields.value.code.$dirty).toBe(false);

      // The user types — from here on, writes are edits.
      input.value = 'PHONE2';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await nextTick();

      expect(form.fields.value.code.$dirty).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('blur alone (tabbing through) does NOT freeze the baseline', async () => {
    const { formData, form, input, cleanup } = mountEditScreen();
    try {
      // The user tabs through the field while data is still loading…
      input.dispatchEvent(new Event('blur', { bubbles: true }));

      // …and the record lands afterwards: still hydration, still clean.
      formData.code = 'PHONE';
      await nextTick();

      expect(form.fields.value.code.$dirty).toBe(false);
      expect(form.fields.value.code.$touched).toBe(true);
    } finally {
      cleanup();
    }
  });
});
