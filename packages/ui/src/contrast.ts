/**
 * WCAG 2.1 contrast arithmetic.
 *
 * This exists so that the accessibility floor the design system sets for itself
 * is an executable assertion rather than a claim in a readme. Token pairings
 * are checked in the test suite, so a future palette change that quietly breaks
 * a text colour fails the build instead of shipping.
 */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export class ColorError extends Error {
  override readonly name = 'ColorError';
}

const HEX = /^#?([0-9a-f]{6})$/i;

export function parseHex(value: string): Rgb {
  const match = HEX.exec(value.trim());
  if (!match?.[1]) {
    throw new ColorError(`Expected a six-digit hex colour, received "${value}"`);
  }
  const int = Number.parseInt(match[1], 16);
  return {
    r: (int >> 16) & 0xff,
    g: (int >> 8) & 0xff,
    b: int & 0xff,
  };
}

/** Linearise one 8-bit channel, per the sRGB transfer function. */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, per WCAG 2.1. */
export function relativeLuminance(color: Rgb): number {
  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

/** Contrast ratio between two colours, from 1:1 to 21:1. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(parseHex(foreground));
  const b = relativeLuminance(parseHex(background));
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA thresholds. Large text is >=18.66px bold or >=24px regular. */
export const AA_NORMAL_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AAA_NORMAL_TEXT = 7;

export function meetsAA(foreground: string, background: string, largeText = false): boolean {
  const required = largeText ? AA_LARGE_TEXT : AA_NORMAL_TEXT;
  return contrastRatio(foreground, background) >= required;
}

/**
 * The palette primitives, mirrored from tokens/colors.css.
 *
 * Duplicated here deliberately and only for testing: CSS custom properties
 * cannot be read without a browser, and the alternative is not testing the
 * palette at all. The test suite asserts these stay in step with the stylesheet.
 */
export const PALETTE = {
  teal900: '#101F1D',
  teal800: '#16282B',
  teal600: '#243C40',
  gold700: '#7E6B40',
  gold600: '#9A8352',
  gold500: '#BBA57E',
  gold400: '#CBB994',
  ivory: '#FAF8F4',
  white: '#FFFFFF',
  warm600: '#5E5850',
  warm500: '#837C70',
  green500: '#29A868',
  red500: '#F06565',
} as const;
