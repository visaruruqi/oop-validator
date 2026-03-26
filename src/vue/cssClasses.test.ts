import { describe, it, expect } from 'vitest';
import { computeFieldClasses, computeFormClasses } from './cssClasses';

describe('computeFieldClasses', () => {
  it('should include v-valid when field is valid', () => {
    const classes = computeFieldClasses({ $valid: true, $invalid: false, $error: {} });
    expect(classes['v-valid']).toBe(true);
    expect(classes['v-invalid']).toBe(false);
  });

  it('should include v-invalid when field is invalid', () => {
    const classes = computeFieldClasses({ $valid: false, $invalid: true, $error: { required: true } });
    expect(classes['v-valid']).toBe(false);
    expect(classes['v-invalid']).toBe(true);
  });

  it('should include per-rule classes', () => {
    const classes = computeFieldClasses({
      $error: { required: true },
      $valid: false,
      $invalid: true,
    });
    expect(classes['v-invalid-required']).toBe(true);
    expect(classes['v-valid-required']).toBe(false);
  });

  it('should include touched/untouched classes', () => {
    const touched = computeFieldClasses({ $touched: true, $untouched: false, $error: {} });
    expect(touched['v-touched']).toBe(true);
    expect(touched['v-untouched']).toBe(false);

    const untouched = computeFieldClasses({ $touched: false, $untouched: true, $error: {} });
    expect(untouched['v-touched']).toBe(false);
    expect(untouched['v-untouched']).toBe(true);
  });

  it('should include pristine/dirty classes', () => {
    const pristine = computeFieldClasses({ $pristine: true, $dirty: false, $error: {} });
    expect(pristine['v-pristine']).toBe(true);
    expect(pristine['v-dirty']).toBe(false);
  });

  it('should include pending class', () => {
    const pending = computeFieldClasses({ $pending: true, $error: {} });
    expect(pending['v-pending']).toBe(true);
  });

  it('should include multiple per-rule classes', () => {
    const classes = computeFieldClasses({
      $error: { required: true, email: true },
      $valid: false,
      $invalid: true,
    });
    expect(classes['v-invalid-required']).toBe(true);
    expect(classes['v-invalid-email']).toBe(true);
  });
});

describe('computeFormClasses', () => {
  it('should include v-submitted when form is submitted', () => {
    const classes = computeFormClasses({ $submitted: true });
    expect(classes['v-submitted']).toBe(true);
  });

  it('should include v-valid/v-invalid', () => {
    const validClasses = computeFormClasses({ $valid: true, $invalid: false });
    expect(validClasses['v-valid']).toBe(true);
    expect(validClasses['v-invalid']).toBe(false);
  });

  it('should include v-pristine/v-dirty', () => {
    const classes = computeFormClasses({ $pristine: true, $dirty: false });
    expect(classes['v-pristine']).toBe(true);
    expect(classes['v-dirty']).toBe(false);
  });

  it('should include v-pending', () => {
    const classes = computeFormClasses({ $pending: true });
    expect(classes['v-pending']).toBe(true);
  });
});
