import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        copyPublicDir: false,
        lib: {
            entry: {
                'index': './src/index.ts',
                'vue':   './src/vue.ts',
            },
            formats: ['es'],
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                // ESM only — named entry files land at dist/index.js and dist/vue.js
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                globals: { vue: 'Vue' },
            }
        },
        sourcemap: false
    }
});
