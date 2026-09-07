/**
 * Rial amounts.
 *
 * The Iranian rial has no minor unit in circulation, so an amount is always a
 * whole number of rials and is represented as a `bigint`. There is no floating
 * point anywhere in this module — IEEE-754 cannot represent typical Iranian
 * gold order totals exactly, and silent precision loss on money is a defect.
 *
 * Rial is the storage and settlement unit because it is what Iranian payment
 * gateways transact in. Toman is a presentation concern; see `format.ts`.
 */
import { divideRounded, type RoundingMode } from './rounding.js';

declare const rialsBrand: unique symbol;

/** A whole number of Iranian rials. Construct with {@link rials}. */
export type Rials = bigint & { readonly [rialsBrand]: 'Rials' };

export class MoneyError extends Error {
  override readonly name = 'MoneyError';
}

const INTEGER_STRING = /^-?\d+$/;

/**
 * Build a `Rials` value, rejecting anything that is not an exact integer.
 *
 * `number` input is only accepted when it is a safe integer: a float that has
 * already lost precision must not be laundered into the money type.
 */
export function rials(value: bigint | number | string): Rials {
  if (typeof value === 'bigint') return value as Rials;

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new MoneyError(
        `Rial amount must be a safe integer, received ${String(value)}. ` +
          'Pass a bigint or a decimal string for large or fractional input.',
      );
    }
    return BigInt(value) as Rials;
  }

  const trimmed = value.trim();
  if (!INTEGER_STRING.test(trimmed)) {
    throw new MoneyError(`Rial amount must be an integer string, received "${value}"`);
  }
  return BigInt(trimmed) as Rials;
}

export const ZERO_RIALS = 0n as Rials;

export const addRials = (a: Rials, b: Rials): Rials => (a + b) as Rials;
export const subtractRials = (a: Rials, b: Rials): Rials => (a - b) as Rials;
export const negateRials = (a: Rials): Rials => -a as Rials;
export const absRials = (a: Rials): Rials => (a < 0n ? -a : a) as Rials;
export const isNegativeRials = (a: Rials): boolean => a < 0n;

export function sumRials(amounts: readonly Rials[]): Rials {
  let total = 0n;
  for (const amount of amounts) total += amount;
  return total as Rials;
}

export function multiplyRialsByInteger(amount: Rials, factor: bigint | number): Rials {
  const f = typeof factor === 'number' ? BigInt(assertSafeInteger(factor, 'factor')) : factor;
  return (amount * f) as Rials;
}

/**
 * Scale an amount by a rate expressed in basis points (1 bp = 0.01%).
 *
 * Rates are integers rather than decimals so that a percentage can never
 * introduce a binary-floating-point error into a price.
 */
export function scaleRialsByBasisPoints(
  amount: Rials,
  basisPoints: number,
  mode: RoundingMode = 'half-up',
): Rials {
  assertSafeInteger(basisPoints, 'basisPoints');
  if (basisPoints < 0) {
    throw new MoneyError(`basisPoints must not be negative, received ${basisPoints}`);
  }
  return divideRounded(amount * BigInt(basisPoints), 10_000n, mode) as Rials;
}

/**
 * Split an amount into parts proportional to `weights`, such that the parts sum
 * back to exactly the original amount.
 *
 * Uses largest-remainder allocation: each part gets the floor of its exact
 * share, then the leftover rials are handed out one at a time to the parts with
 * the largest fractional remainder. Without this, an installment schedule or a
 * per-line tax split silently loses or invents rials.
 */
export function allocateRials(amount: Rials, weights: readonly bigint[]): Rials[] {
  if (weights.length === 0) {
    throw new MoneyError('allocateRials requires at least one weight');
  }
  if (weights.some((w) => w < 0n)) {
    throw new MoneyError('allocateRials weights must not be negative');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0n);
  if (totalWeight === 0n) {
    throw new MoneyError('allocateRials requires a non-zero total weight');
  }

  const negative = amount < 0n;
  const magnitude = negative ? -amount : amount;

  const parts: bigint[] = [];
  const remainders: { index: number; remainder: bigint }[] = [];
  let distributed = 0n;

  for (const [index, weight] of weights.entries()) {
    const exact = magnitude * weight;
    const part = exact / totalWeight;
    parts.push(part);
    remainders.push({ index, remainder: exact % totalWeight });
    distributed += part;
  }

  let leftover = magnitude - distributed;
  // Ties resolve to the earlier index, so allocation is deterministic.
  remainders.sort((a, b) => {
    if (a.remainder === b.remainder) return a.index - b.index;
    return a.remainder > b.remainder ? -1 : 1;
  });

  for (const { index } of remainders) {
    if (leftover === 0n) break;
    parts[index] = (parts[index] ?? 0n) + 1n;
    leftover -= 1n;
  }

  return parts.map((part) => (negative ? -part : part) as Rials);
}

function assertSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} must be a safe integer, received ${String(value)}`);
  }
  return value;
}
