import { defineConfig } from 'vitest/config';

// `base` must match the deploy path (REQUIREMENTS §12). Override with
// INKLING_BASE=/inkling/ when building for a GitHub Pages project site.
export default defineConfig({
  base: process.env.INKLING_BASE ?? '/',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
