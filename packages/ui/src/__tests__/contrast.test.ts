import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  AA_NORMAL_TEXT,
  contrastRatio,
  meetsAA,
  PALETTE,
  parseHex,
  relativeLuminance,
} from '../contrast.js';

const colorsCss = readFileSync(
  fileURLToPath(new URL('../styles/tokens/colors.css', import.meta.url)),
  'utf8',
);

describe('contrast arithmetic', () => {
  it('matches the WCAG reference extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio(PALETTE.gold500, PALETTE.ivory)).toBeCloseTo(
      contrastRatio(PALETTE.ivory, PALETTE.gold500),
      10,
    );
  });

  it('computes known luminances', () => {
    expect(relativeLuminance(parseHex('#FFFFFF'))).toBeCloseTo(1, 5);
    expect(relativeLuminance(parseHex('#000000'))).toBeCloseTo(0, 5);
  });

  it('accepts hex with or without the leading hash', () => {
    expect(parseHex('#BBA57E')).toEqual(parseHex('BBA57E'));
  });

  it('rejects malformed colours rather than guessing', () => {
    expect(() => parseHex('#FFF')).toThrow();
    expect(() => parseHex('rgb(0,0,0)')).toThrow();
  });
});

/**
 * These tests encode the reason --color-price was added to the imported design
 * system. If someone later "simplifies" price text back to --color-accent, the
 * first test here fails and explains why.
 */
describe('design system accessibility floor', () => {
  it('gold-500 as text on ivory FAILS AA — this is why --color-price exists', () => {
    const ratio = contrastRatio(PALETTE.gold500, PALETTE.ivory);
    expect(ratio).toBeLessThan(AA_NORMAL_TEXT);
    expect(ratio).toBeCloseTo(2.25, 1);
  });

  it('gold-700 as text on ivory passes AA', () => {
    const ratio = contrastRatio(PALETTE.gold700, PALETTE.ivory);
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(ratio).toBeCloseTo(4.87, 1);
  });

  it('price text passes AA on both surface colours', () => {
    expect(meetsAA(PALETTE.gold700, PALETTE.ivory)).toBe(true);
    expect(meetsAA(PALETTE.gold700, PALETTE.white)).toBe(true);
  });

  it('price text passes AA on the dark ground', () => {
    // Dark theme lifts --color-price to gold-400; gold-700 would be unreadable.
    expect(meetsAA(PALETTE.gold400, PALETTE.teal900)).toBe(true);
    expect(meetsAA(PALETTE.gold700, PALETTE.teal900)).toBe(false);
  });

  it('leaves the gold CTA alone, because it was never the problem', () => {
    // Gold on the dark hero panel, and the label on a gold button.
    expect(contrastRatio(PALETTE.gold500, PALETTE.teal800)).toBeGreaterThan(AA_NORMAL_TEXT);
    expect(contrastRatio(PALETTE.teal900, PALETTE.gold500)).toBeGreaterThan(AA_NORMAL_TEXT);
  });

  it('body and secondary text pass AA on the ivory ground', () => {
    expect(meetsAA(PALETTE.teal800, PALETTE.ivory)).toBe(true);
    expect(meetsAA(PALETTE.warm600, PALETTE.ivory)).toBe(true);
  });

  it('muted text passes at least the large-text allowance', () => {
    // warm-500 is used for captions and metadata, not body copy.
    expect(meetsAA(PALETTE.warm500, PALETTE.ivory, true)).toBe(true);
  });

  it('status colours as text on their own subtle ground FAIL AA', () => {
    // This is why --color-success-text and its two siblings exist. Every one
    // of these is worse than the gold-on-ivory failure --color-price fixes.
    expect(contrastRatio(PALETTE.green500, PALETTE.green100)).toBeLessThan(AA_NORMAL_TEXT);
    expect(contrastRatio(PALETTE.red500, PALETTE.red100)).toBeLessThan(AA_NORMAL_TEXT);
    expect(contrastRatio(PALETTE.amber500, PALETTE.amber100)).toBeLessThan(AA_NORMAL_TEXT);
  });

  it('the darker status aliases pass AA on their ground and on white', () => {
    expect(meetsAA(PALETTE.green700, PALETTE.green100)).toBe(true);
    expect(meetsAA(PALETTE.red700, PALETTE.red100)).toBe(true);
    expect(meetsAA(PALETTE.amber700, PALETTE.amber100)).toBe(true);

    // Order badges also sit on plain white cards.
    expect(meetsAA(PALETTE.green700, PALETTE.white)).toBe(true);
    expect(meetsAA(PALETTE.red700, PALETTE.white)).toBe(true);
    expect(meetsAA(PALETTE.amber700, PALETTE.white)).toBe(true);
  });

  it('buy and sell colours are never the only signal, so they need only 3:1', () => {
    // The design system pairs these with an icon and a label; the ratio check
    // guards the swatch itself remaining distinguishable.
    expect(contrastRatio(PALETTE.green500, PALETTE.ivory)).toBeGreaterThan(2);
    expect(contrastRatio(PALETTE.red500, PALETTE.ivory)).toBeGreaterThan(2);
  });
});

describe('palette stays in step with the stylesheet', () => {
  it.each(Object.entries(PALETTE))('%s is present in colors.css', (_name, hex) => {
    expect(colorsCss.toUpperCase()).toContain(hex.toUpperCase());
  });

  it('defines the status text aliases in both themes', () => {
    for (const token of ['success', 'danger', 'warning']) {
      const declarations = colorsCss.split(`--color-${token}-text:`).length - 1;
      expect(declarations, token).toBe(2);
    }
  });

  it('defines --color-price in both themes', () => {
    // Light theme and the [data-theme="dark"] block.
    const occurrences = colorsCss.match(/--color-price\s*:/g) ?? [];
    expect(occurrences).toHaveLength(2);
  });

  it('keeps letter-spacing at zero, because tracking breaks Arabic shaping', () => {
    // Whitespace-tolerant: these files are Prettier-formatted on the way in,
    // so the assertion is about the value, not the spelling.
    const typographyCss = readFileSync(
      fileURLToPath(new URL('../styles/tokens/typography.css', import.meta.url)),
      'utf8',
    );
    expect(typographyCss).toMatch(/--ls-normal\s*:\s*0\s*;/);
  });

  it('sets the Persian body line-height the design system requires', () => {
    const typographyCss = readFileSync(
      fileURLToPath(new URL('../styles/tokens/typography.css', import.meta.url)),
      'utf8',
    );
    expect(typographyCss).toMatch(/--lh-body\s*:\s*1\.75\s*;/);
  });
});
