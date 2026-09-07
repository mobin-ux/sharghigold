import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Vitest for the storefront.
 *
 * Only the pure modules are covered here — price derivation, the view models
 * the pages render from. Rendering components is not tested this way: it needs
 * a DOM harness, and what actually matters about this page (that it renders on
 * the server, in RTL, with the right numbers) is verified against the running
 * server, not against jsdom's approximation of one.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
  },
});
