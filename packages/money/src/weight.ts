/**
 * Gold weight.
 *
 * Stored as whole milligrams in a `bigint`. The trade quotes weights to three
 * decimal places of a gram (e.g. ۱٫۸ گرم), and 0.1 + 0.2 !== 0.3 in binary
 * floating point, so grams are never held as a `number`.
 */
import { divideRounded, type RoundingMode } from './rounding.js';

declare const milligramsBrand: unique symbol;

/** A whole number of milligrams. Construct with {@link milligrams}. */
export type Milligrams = bigint & { readonly [milligramsBrand]: 'Milligrams' };

export class WeightError extends Error {
  override readonly name = 'WeightError';
}

export const MILLIGRAMS_PER_GRAM = 1000n;

/** Maximum precision the trade uses: three decimals of a gram. */
const MAX_GRAM_DECIMALS = 3;
const GRAM_STRING = /^(\d+)(?:[.٫](\d+))?$/;

export function milligrams(value: bigint | number): Milligrams {
  if (typeof value === 'bigint') {
    if (value < 0n) throw new WeightError('Weight must not be negative');
    return value as Milligrams;
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new WeightError(`Weight in milligrams must be a non-negative safe integer, got ${value}`);
  }
  return BigInt(value) as Milligrams;
}

/**
 * Parse a decimal gram string exactly, without going through `parseFloat`.
 *
 * Accepts both the ASCII decimal point and the Persian decimal separator (U+066B).
 */
export function gramsToMilligrams(grams: string): Milligrams {
  const match = GRAM_STRING.exec(grams.trim());
  if (!match) {
    throw new WeightError(`Weight must be a non-negative decimal gram value, received "${grams}"`);
  }

  const whole = match[1] ?? '0';
  const fraction = match[2] ?? '';

  if (fraction.length > MAX_GRAM_DECIMALS) {
    throw new WeightError(
      `Weight supports at most ${MAX_GRAM_DECIMALS} decimal places (milligram precision), ` +
        `received "${grams}"`,
    );
  }

  const paddedFraction = fraction.padEnd(MAX_GRAM_DECIMALS, '0');
  return (BigInt(whole) * MILLIGRAMS_PER_GRAM + BigInt(paddedFraction)) as Milligrams;
}

/** Render milligrams as a plain-ASCII decimal gram string, trailing zeros trimmed. */
export function milligramsToGramString(weight: Milligrams): string {
  const whole = weight / MILLIGRAMS_PER_GRAM;
  const fraction = weight % MILLIGRAMS_PER_GRAM;
  if (fraction === 0n) return whole.toString();
  const padded = fraction.toString().padStart(MAX_GRAM_DECIMALS, '0').replace(/0+$/, '');
  return `${whole.toString()}.${padded}`;
}

export const addWeight = (a: Milligrams, b: Milligrams): Milligrams => (a + b) as Milligrams;

export function multiplyWeightByInteger(weight: Milligrams, factor: bigint | number): Milligrams {
  const f = typeof factor === 'bigint' ? factor : BigInt(factor);
  if (f < 0n) throw new WeightError('Weight factor must not be negative');
  return (weight * f) as Milligrams;
}

/**
 * Scale a weight by a ratio, e.g. converting between purities.
 * Exposed so callers state the rounding mode explicitly.
 */
export function scaleWeight(
  weight: Milligrams,
  numerator: bigint,
  denominator: bigint,
  mode: RoundingMode = 'half-up',
): Milligrams {
  if (numerator < 0n || denominator <= 0n) {
    throw new WeightError('scaleWeight requires a non-negative numerator and positive denominator');
  }
  return divideRounded(weight * numerator, denominator, mode) as Milligrams;
}
