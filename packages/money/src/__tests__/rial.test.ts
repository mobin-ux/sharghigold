import { describe, expect, it } from 'vitest';

import {
  addRials,
  allocateRials,
  MoneyError,
  multiplyRialsByInteger,
  rials,
  scaleRialsByBasisPoints,
  sumRials,
} from '../rial.js';

describe('rials()', () => {
  it('accepts bigint, safe integers and integer strings', () => {
    expect(rials(1_000n)).toBe(1_000n);
    expect(rials(1_000)).toBe(1_000n);
    expect(rials('104800000')).toBe(104_800_000n);
    expect(rials('-500')).toBe(-500n);
  });

  it('refuses a non-integer number, rather than truncating it silently', () => {
    expect(() => rials(10.5)).toThrow(MoneyError);
  });

  it('refuses a number that has already lost precision', () => {
    expect(() => rials(Number.MAX_SAFE_INTEGER + 2)).toThrow(MoneyError);
  });

  it('refuses a decimal or malformed string', () => {
    expect(() => rials('10.5')).toThrow(MoneyError);
    expect(() => rials('1e6')).toThrow(MoneyError);
    expect(() => rials('')).toThrow(MoneyError);
    expect(() => rials('۱۰۰')).toThrow(MoneyError);
  });
});

describe('arithmetic', () => {
  it('adds and sums exactly at magnitudes that would break a double', () => {
    const large = rials(9_007_199_254_740_993n); // MAX_SAFE_INTEGER + 2
    expect(addRials(large, rials(1n))).toBe(9_007_199_254_740_994n);
    expect(sumRials([large, large])).toBe(18_014_398_509_481_986n);
  });

  it('multiplies by an integer factor', () => {
    expect(multiplyRialsByInteger(rials(1_234n), 3)).toBe(3_702n);
    expect(multiplyRialsByInteger(rials(1_234n), 3n)).toBe(3_702n);
  });

  it('rejects a fractional multiplication factor', () => {
    expect(() => multiplyRialsByInteger(rials(100n), 1.5)).toThrow(MoneyError);
  });
});

describe('scaleRialsByBasisPoints', () => {
  it('applies a percentage without floating point', () => {
    // 7% of 216,936,000 is exactly 15,185,520.
    expect(scaleRialsByBasisPoints(rials(216_936_000n), 700)).toBe(15_185_520n);
  });

  it('rounds to a whole rial using the requested mode', () => {
    // 1% of 1005 is 10.05 -> 10
    expect(scaleRialsByBasisPoints(rials(1_005n), 100, 'half-up')).toBe(10n);
    // 50% of 5 is 2.5 -> 3 half-up, 2 half-even
    expect(scaleRialsByBasisPoints(rials(5n), 5_000, 'half-up')).toBe(3n);
    expect(scaleRialsByBasisPoints(rials(5n), 5_000, 'half-even')).toBe(2n);
  });

  it('rejects a negative rate', () => {
    expect(() => scaleRialsByBasisPoints(rials(100n), -1)).toThrow(MoneyError);
  });
});

describe('allocateRials', () => {
  it('splits without losing or inventing a rial', () => {
    const parts = allocateRials(rials(100n), [1n, 1n, 1n]);
    expect(parts).toEqual([34n, 33n, 33n]);
    expect(sumRials(parts)).toBe(100n);
  });

  it('honours proportional weights', () => {
    const parts = allocateRials(rials(1_000n), [1n, 4n]);
    expect(parts).toEqual([200n, 800n]);
  });

  it('produces an installment schedule that sums back to the exact total', () => {
    const total = rials(236_469_672n);
    const months = 36;
    const schedule = allocateRials(
      total,
      Array.from({ length: months }, () => 1n),
    );

    expect(schedule).toHaveLength(months);
    expect(sumRials(schedule)).toBe(total);
    // Every installment is within one rial of every other.
    const min = schedule.reduce((a, b) => (a < b ? a : b));
    const max = schedule.reduce((a, b) => (a > b ? a : b));
    expect(max - min).toBeLessThanOrEqual(1n);
  });

  it('keeps the sum exact for negative amounts, such as a refund split', () => {
    const parts = allocateRials(rials(-100n), [1n, 1n, 1n]);
    expect(sumRials(parts)).toBe(-100n);
  });

  it('is deterministic when remainders tie', () => {
    expect(allocateRials(rials(10n), [1n, 1n, 1n])).toEqual(
      allocateRials(rials(10n), [1n, 1n, 1n]),
    );
  });

  it('rejects empty, negative or all-zero weights', () => {
    expect(() => allocateRials(rials(10n), [])).toThrow(MoneyError);
    expect(() => allocateRials(rials(10n), [-1n, 2n])).toThrow(MoneyError);
    expect(() => allocateRials(rials(10n), [0n, 0n])).toThrow(MoneyError);
  });
});
