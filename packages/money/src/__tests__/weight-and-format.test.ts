import { describe, expect, it } from 'vitest';

import {
  formatBasisPointsAsPercent,
  formatGrams,
  formatToman,
  groupThousands,
  rialsToToman,
  rialsToTomanExact,
  toLatinDigits,
  toPersianDigits,
} from '../format.js';
import { MoneyError, rials } from '../rial.js';
import {
  gramsToMilligrams,
  milligrams,
  milligramsToGramString,
  scaleWeight,
  WeightError,
} from '../weight.js';

describe('gramsToMilligrams', () => {
  it('parses decimal grams exactly', () => {
    expect(gramsToMilligrams('1.8')).toBe(1_800n);
    expect(gramsToMilligrams('12.4')).toBe(12_400n);
    expect(gramsToMilligrams('0.500')).toBe(500n);
    expect(gramsToMilligrams('5')).toBe(5_000n);
    expect(gramsToMilligrams('104.857')).toBe(104_857n);
  });

  it('avoids the classic floating-point drift', () => {
    // 0.1 + 0.2 !== 0.3 as doubles; as milligrams it is exact.
    const sum = gramsToMilligrams('0.1') + gramsToMilligrams('0.2');
    expect(sum).toBe(gramsToMilligrams('0.3'));
  });

  it('accepts the Persian decimal separator once digits are latinised', () => {
    expect(gramsToMilligrams(toLatinDigits('۱٫۸'))).toBe(1_800n);
  });

  it('refuses precision finer than a milligram instead of truncating', () => {
    expect(() => gramsToMilligrams('1.8005')).toThrow(WeightError);
  });

  it('refuses malformed or negative input', () => {
    expect(() => gramsToMilligrams('-1.8')).toThrow(WeightError);
    expect(() => gramsToMilligrams('abc')).toThrow(WeightError);
    expect(() => gramsToMilligrams('')).toThrow(WeightError);
  });

  it('refuses a negative milligram value', () => {
    expect(() => milligrams(-1n)).toThrow(WeightError);
    expect(() => milligrams(1.5)).toThrow(WeightError);
  });
});

describe('milligramsToGramString', () => {
  it('round-trips and trims trailing zeros', () => {
    expect(milligramsToGramString(gramsToMilligrams('1.8'))).toBe('1.8');
    expect(milligramsToGramString(gramsToMilligrams('5'))).toBe('5');
    expect(milligramsToGramString(gramsToMilligrams('0.500'))).toBe('0.5');
    expect(milligramsToGramString(milligrams(1_005n))).toBe('1.005');
  });
});

describe('scaleWeight', () => {
  it('scales by a ratio with explicit rounding', () => {
    expect(scaleWeight(milligrams(1_000n), 3n, 4n)).toBe(750n);
    expect(scaleWeight(milligrams(1n), 1n, 2n, 'half-up')).toBe(1n);
    expect(scaleWeight(milligrams(1n), 1n, 2n, 'floor')).toBe(0n);
  });

  it('rejects a non-positive denominator', () => {
    expect(() => scaleWeight(milligrams(10n), 1n, 0n)).toThrow(WeightError);
  });
});

describe('digit conversion', () => {
  it('converts to and from Persian numerals', () => {
    expect(toPersianDigits('1234567890')).toBe('۱۲۳۴۵۶۷۸۹۰');
    expect(toLatinDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
  });

  it('leaves non-digit characters untouched', () => {
    expect(toPersianDigits('۱۸ عیار')).toBe('۱۸ عیار');
    expect(toPersianDigits('12 گرم')).toBe('۱۲ گرم');
  });

  it('also latinises Arabic-Indic digits', () => {
    expect(toLatinDigits('١٢٣')).toBe('123');
  });
});

describe('groupThousands', () => {
  it('groups into three-digit blocks', () => {
    expect(groupThousands('1234567', ',')).toBe('1,234,567');
    expect(groupThousands('100', ',')).toBe('100');
    expect(groupThousands('1000', ',')).toBe('1,000');
  });

  it('keeps the sign outside the grouping', () => {
    expect(groupThousands('-1234', ',')).toBe('-1,234');
  });
});

describe('toman conversion', () => {
  it('converts rials to toman', () => {
    expect(rialsToToman(rials(104_800_000n))).toBe(10_480_000n);
  });

  it('refuses to silently drop a remainder in the exact variant', () => {
    expect(rialsToTomanExact(rials(100n))).toBe(10n);
    expect(() => rialsToTomanExact(rials(105n))).toThrow(MoneyError);
  });
});

describe('formatToman', () => {
  it('renders Persian numerals with the Persian separator and unit', () => {
    expect(formatToman(rials(104_800_000n))).toBe('۱۰٬۴۸۰٬۰۰۰ تومان');
  });

  it('can render a Latin form for data contexts', () => {
    expect(formatToman(rials(104_800_000n), { persianDigits: false, withUnit: false })).toBe(
      '10,480,000',
    );
  });

  it('formats the reference order total', () => {
    // 236,469,672 rials rounds to 23,646,967 toman.
    expect(formatToman(rials(236_469_672n))).toBe('۲۳٬۶۴۶٬۹۶۷ تومان');
  });

  it('handles zero', () => {
    expect(formatToman(rials(0n))).toBe('۰ تومان');
  });
});

describe('formatGrams', () => {
  it('renders the Persian decimal separator and unit', () => {
    expect(formatGrams(gramsToMilligrams('1.8'))).toBe('۱٫۸ گرم');
    expect(formatGrams(gramsToMilligrams('12.4'))).toBe('۱۲٫۴ گرم');
  });

  it('drops the fraction for whole grams', () => {
    expect(formatGrams(gramsToMilligrams('5'))).toBe('۵ گرم');
  });

  it('groups thousands of grams', () => {
    expect(formatGrams(gramsToMilligrams('1234.5'))).toBe('۱٬۲۳۴٫۵ گرم');
  });
});

describe('formatBasisPointsAsPercent', () => {
  it('renders whole percentages', () => {
    expect(formatBasisPointsAsPercent(700)).toBe('۷٪');
    expect(formatBasisPointsAsPercent(1_500)).toBe('۱۵٪');
  });

  it('renders fractional percentages', () => {
    expect(formatBasisPointsAsPercent(750)).toBe('۷٫۵٪');
    expect(formatBasisPointsAsPercent(80)).toBe('۰٫۸٪');
  });

  it('rejects a non-integer rate', () => {
    expect(() => formatBasisPointsAsPercent(1.5)).toThrow(MoneyError);
  });
});
