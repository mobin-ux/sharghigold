import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The webfonts exist twice on purpose: `packages/ui/assets/fonts` holds the
 * canonical copies, and `apps/storefront/public/fonts` is what actually gets
 * served, because `tokens/fonts.css` references them at the absolute path
 * `/fonts/…` and Next only serves what is under `public/`.
 *
 * Two copies means they can drift, and drift here is close to invisible: the
 * page keeps rendering, just in a different weight or an older cut. This pins
 * them together.
 */
const CANONICAL = join(import.meta.dirname, '../../../../packages/ui/assets/fonts');
const SERVED = join(import.meta.dirname, '../../public/fonts');

/** Every face declared in `packages/ui/src/styles/tokens/fonts.css`. */
const EXPECTED = [
  'AriaWeb-Bold.woff2',
  'AriaWeb-ExtraBold.woff2',
  'AriaWeb-Heavy.woff2',
  'AriaWeb-Medium.woff2',
  'AriaWeb-Regular.woff2',
  'AriaWeb-SemiBold.woff2',
  'PeydaWebFaNum-Black.woff2',
  'PeydaWebFaNum-Bold.woff2',
  'PeydaWebFaNum-Medium.woff2',
  'PeydaWebFaNum-Regular.woff2',
  'PeydaWebFaNum-SemiBold.woff2',
];

const woff2In = (dir: string): string[] =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.woff2'))
    .sort();

const sha256 = (path: string): string =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

describe('webfonts', () => {
  it('serves every face the token layer declares', () => {
    expect(woff2In(SERVED)).toEqual(EXPECTED);
    expect(woff2In(CANONICAL)).toEqual(EXPECTED);
  });

  it('serves byte-identical copies of the canonical files', () => {
    for (const name of EXPECTED) {
      expect(sha256(join(SERVED, name)), `${name} differs from the canonical copy`).toBe(
        sha256(join(CANONICAL, name)),
      );
    }
  });

  it('serves real woff2 binaries, not placeholders', () => {
    for (const name of EXPECTED) {
      const bytes = readFileSync(join(SERVED, name));
      // wOF2 — the woff2 magic number.
      expect(bytes.subarray(0, 4).toString('ascii'), `${name} is not a woff2`).toBe('wOF2');
      expect(bytes.byteLength).toBeGreaterThan(1_000);
    }
  });
});
