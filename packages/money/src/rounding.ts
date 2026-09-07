/**
 * Deterministic integer rounding for money and weight arithmetic.
 *
 * Every monetary division in this codebase goes through `divideRounded`. There
 * is no implicit rounding anywhere else: a caller must always state the mode,
 * because "which way does the half-rial go" is a business decision, not a
 * mathematical detail.
 */

export type RoundingMode =
  /** Round half away from zero. The default for consumer-facing money. */
  | 'half-up'
  /** Round half to the nearest even quotient. Minimises cumulative bias. */
  | 'half-even'
  /** Toward negative infinity. */
  | 'floor'
  /** Toward positive infinity. */
  | 'ceil'
  /** Toward zero. */
  | 'trunc';

export class RoundingError extends Error {
  override readonly name = 'RoundingError';
}

/**
 * Divide two integers and round the result according to `mode`.
 *
 * Works on bigint throughout, so it is exact for values far beyond
 * Number.MAX_SAFE_INTEGER — which matters because rial amounts are large.
 */
export function divideRounded(
  numerator: bigint,
  denominator: bigint,
  mode: RoundingMode = 'half-up',
): bigint {
  if (denominator === 0n) {
    throw new RoundingError('Division by zero');
  }

  // Normalise so the denominator is positive; sign lives on the numerator.
  const n = denominator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;

  const quotient = n / d; // bigint division truncates toward zero
  const remainder = n % d; // shares the sign of n

  if (remainder === 0n) return quotient;

  const negative = n < 0n;
  const away = negative ? quotient - 1n : quotient + 1n;
  const twiceRemainder = (remainder < 0n ? -remainder : remainder) * 2n;

  switch (mode) {
    case 'trunc':
      return quotient;
    case 'floor':
      return negative ? quotient - 1n : quotient;
    case 'ceil':
      return negative ? quotient : quotient + 1n;
    case 'half-up':
      return twiceRemainder >= d ? away : quotient;
    case 'half-even': {
      if (twiceRemainder > d) return away;
      if (twiceRemainder < d) return quotient;
      return quotient % 2n === 0n ? quotient : away;
    }
  }
}
