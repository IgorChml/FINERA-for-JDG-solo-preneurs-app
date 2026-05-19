import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/plugins/**'],
    },
  },
  resolve: {
    alias: {
      '@finera/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
