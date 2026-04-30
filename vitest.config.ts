import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        exclude: ['node_modules', 'e2e', '.next', '.claude', '**/*.spec.ts'],
        setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'server-only': path.resolve(__dirname, './src/lib/test-utils/server-only-mock.ts'),
        }
    }
})
