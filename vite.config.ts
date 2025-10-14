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
            formats: ['es', 'umd']
        },
        rollupOptions: {
            // Don't bundle Vue - it should be provided by the consumer when using Vue features
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        },
        sourcemap: true
    }
});
