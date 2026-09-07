import { defineConfig } from 'vitest/config';

// Only decorator-free modules are unit-tested here: esbuild, which Vitest uses
// to transform, does not emit design:paramtypes metadata, so anything relying
// on Nest dependency injection must be exercised through Nest's own test
// harness instead. Keeping that boundary explicit avoids silent DI failures.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
