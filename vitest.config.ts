import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        environmentMatchGlobs: [
            ['src/vue/directives/**/*.test.ts', 'jsdom'],
            ['src/integration/**/*.test.ts', 'jsdom'],
        ],
        coverage: {
            reporter: ['text', 'json', 'html'],
        },
    },
});
