import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'oop-validator',
            fileName: (format) => `oop-validator.${format}.js`,
        }
    }
});
