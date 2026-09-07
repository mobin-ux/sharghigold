import { describe, expect, it } from 'vitest';

import { divideRounded, RoundingError } from '../rounding.js';

describe('divideRounded', () => {
  it('returns the exact quotient when the division has no remainder', () => {
    expect(divideRounded(100n, 4n)).toBe(25n);
    expect(divideRounded(-100n, 4n)).toBe(-25n);
  });

  it('rejects division by zero rather than producing Infinity', () => {
    expect(() => divideRounded(1n, 0n)).toThrow(RoundingError);
  });

  describe('half-up (half away from zero)', () => {
    it('rounds a positive half away from zero', () => {
      expect(divideRounded(5n, 2n, 'half-up')).toBe(3n);
    });

    it('rounds a negative half away from zero, so it is symmetric', () => {
      expect(divideRounded(-5n, 2n, 'half-up')).toBe(-3n);
    });

    it('leaves values below the halfway point alone', () => {
      expect(divideRounded(4n, 3n, 'half-up')).toBe(1n);
      expect(divideRounded(-4n, 3n, 'half-up')).toBe(-1n);
    });
  });

  describe('half-even', () => {
    it('rounds an exact half toward the even quotient', () => {
      expect(divideRounded(5n, 2n, 'half-even')).toBe(2n);
      expect(divideRounded(7n, 2n, 'half-even')).toBe(4n);
      expect(divideRounded(-5n, 2n, 'half-even')).toBe(-2n);
    });

    it('behaves like half-up when the remainder is not exactly half', () => {
      expect(divideRounded(8n, 3n, 'half-even')).toBe(3n);
      expect(divideRounded(7n, 3n, 'half-even')).toBe(2n);
    });
  });

  describe('directed modes', () => {
    it('floors toward negative infinity', () => {
      expect(divideRounded(7n, 2n, 'floor')).toBe(3n);
      expect(divideRounded(-7n, 2n, 'floor')).toBe(-4n);
    });

    it('ceils toward positive infinity', () => {
      expect(divideRounded(7n, 2n, 'ceil')).toBe(4n);
      expect(divideRounded(-7n, 2n, 'ceil')).toBe(-3n);
    });

    it('truncates toward zero', () => {
      expect(divideRounded(7n, 2n, 'trunc')).toBe(3n);
      expect(divideRounded(-7n, 2n, 'trunc')).toBe(-3n);
    });
  });

  it('normalises a negative denominator onto the numerator', () => {
    expect(divideRounded(7n, -2n, 'floor')).toBe(-4n);
    expect(divideRounded(-7n, -2n, 'floor')).toBe(3n);
  });

  it('stays exact far beyond Number.MAX_SAFE_INTEGER', () => {
    const huge = 10n ** 30n + 1n;
    expect(divideRounded(huge * 7n, 7n)).toBe(huge);
  });
});
