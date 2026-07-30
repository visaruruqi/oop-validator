// @vitest-environment jsdom
//
// Regression: a field rendered behind v-if used to keep its rules registered
// after it was removed. Vue detaches the element before running a directive's
// `unmounted` hook, so `el.closest('form')` was already null and the cleanup
// silently did nothing — leaving the form permanently invalid, and v-submit
// refusing to call its handler with no error message on screen (the element
// that would have shown it is gone).
import { describe, it, expect } from 'vitest';
import { createApp, reactive, ref, nextTick } from 'vue';
import { VueValidationPlugin } from '../vue/directives/install';
import { useForm } from '../vue/useForm';
import { formRegistry } from '../vue/directives/registry';

function mountConditionalForm() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const showDate = ref(true);
  const formData = reactive({ date: null as string | null, name: 'someone' });
  let form: any;

  const app = createApp({
    setup() {
      form = useForm('conditionalForm', formData);
      return { form, showDate, formData };
    },
    template: `
      <form name="conditionalForm">
        <input v-if="showDate" type="text" name="date" v-model="formData.date" v-required />
        <input v-else type="text" name="name" v-model="formData.name" />
      </form>
    `,
  });
  app.use(VueValidationPlugin);
  app.mount(container);

  formRegistry.set(container.querySelector('form') as HTMLFormElement, form);

  return {
    showDate,
    getForm: () => form,
    cleanup: () => {
      app.unmount();
      container.remove();
    },
  };
}

describe('Conditionally rendered fields', () => {
  it('drops rules of a required field once v-if removes it', async () => {
    const { showDate, getForm, cleanup } = mountConditionalForm();
    await nextTick();

    getForm().validate();
    expect(getForm().$valid.value).toBe(false); // date is empty and required

    showDate.value = false;
    await nextTick();
    await nextTick();

    getForm().validate();
    expect(Object.keys(getForm().fields.value)).not.toContain('date');
    expect(getForm().$valid.value).toBe(true);

    cleanup();
  });

  it('re-registers the rules when v-if brings the field back', async () => {
    const { showDate, getForm, cleanup } = mountConditionalForm();
    await nextTick();

    showDate.value = false;
    await nextTick();
    await nextTick();

    showDate.value = true;
    await nextTick();
    await nextTick();

    getForm().validate();
    expect(getForm().$valid.value).toBe(false);
    expect(getForm().$error.value.date).toEqual({ required: true });

    cleanup();
  });
});
