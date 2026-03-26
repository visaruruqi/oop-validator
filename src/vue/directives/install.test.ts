// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createApp } from 'vue';
import { VValidationPlugin } from './install';

describe('VValidationPlugin', () => {
  it('should register all directives on app', () => {
    const app = createApp({ template: '<div></div>' });
    const directiveSpy = vi.spyOn(app, 'directive');
    app.use(VValidationPlugin);

    const directiveNames = directiveSpy.mock.calls.map(c => c[0]);
    expect(directiveNames).toContain('required');
    expect(directiveNames).toContain('minlength');
    expect(directiveNames).toContain('maxlength');
    expect(directiveNames).toContain('pattern');
    expect(directiveNames).toContain('min');
    expect(directiveNames).toContain('max');
    expect(directiveNames).toContain('type');
    expect(directiveNames).toContain('messages');
    expect(directiveNames).toContain('message');
    expect(directiveNames).toContain('submit');
    expect(directiveNames).toContain('form-group');
  });
});
