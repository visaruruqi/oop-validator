import { describe, it, expect, vi } from 'vitest';
import { reactive, nextTick } from 'vue';
import { useForm } from './useForm';
import RequiredValidationRule from '../rules/RequiredValidationRule';

describe('useForm - Proxy API', () => {
  it('form.fieldName should return field state after rule registered', async () => {
    const data = reactive({ email: '' });
    const form = useForm('testForm1', data);
    const rule = new RequiredValidationRule();
    rule.ruleKey = 'required';
    form.registerRule('email', 'required', rule);
    form.validate();
    await nextTick();
    expect(form.email).toBeDefined();
    expect(form.email.$error.required).toBe(true);
    expect(form.email.$valid).toBe(false);
  });

  it('form.$valid should return form-level validity via proxy', async () => {
    const data = reactive({ name: 'John' });
    const form = useForm('testForm2', data);
    const rule = new RequiredValidationRule();
    rule.ruleKey = 'required';
    form.registerRule('name', 'required', rule);
    form.validate();
    await nextTick();
    expect(form.$valid).toBeTruthy();
  });

  it('form.$submitted should be reactive', async () => {
    const data = reactive({ name: 'John' });
    const form = useForm('testForm3', data);
    const rule = new RequiredValidationRule();
    rule.ruleKey = 'required';
    form.registerRule('name', 'required', rule);
    form.validate();
    expect(form.$submitted.value).toBeFalsy();
    await form.$submit(() => {});
    expect(form.$submitted.value).toBeTruthy();
  });

  it('form.engine should expose FormValidationEngine', () => {
    const data = reactive({ name: '' });
    const form = useForm('testForm4', data);
    expect(form.engine).toBeDefined();
    expect(typeof form.engine.validate).toBe('function');
  });

  it('form.nonExistentField should return undefined or the underlying prop', () => {
    const data = reactive({ name: '' });
    const form = useForm('testForm5', data);
    // nonExistentField is not registered, so either undefined or target prop
    const result = (form as any).nonExistentField;
    expect(result).toBeUndefined();
  });
});
