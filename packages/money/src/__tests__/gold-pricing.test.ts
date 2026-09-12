import { describe, expect, it } from 'vitest';

import {
  pricePerGramForKarat,
  PURITY,
  quoteGoldLine,
  quoteGoldPrice,
  roundTotalToStep,
  type GoldQuoteInput,
} from '../gold-pricing.js';
import { MoneyError, rials, sumRials } from '../rial.js';
import { gramsToMilligrams, milligrams } from '../weight.js';

/**
 * Reference case, in rials.
 *
 * 18-carat spot of ۱۰٬۴۸۰٬۰۰۰ تومان per gram = 104,800,000 rials per gram,
 * on a 1.8 g piece, with a 15% making fee, 7% profit and 10% VAT.
 */
const REFERENCE: GoldQuoteInput = {
  pricePerGram: rials(104_800_000n),
  weight: gramsToMilligrams('1.8'),
  makingFeeBasisPoints: 1_500,
  profitBasisPoints: 700,
  vatBasisPoints: 1_000,
};

describe('quoteGoldPrice', () => {
  it('computes the reference breakdown exactly', () => {
    const quote = quoteGoldPrice(REFERENCE);

    expect(quote.goldValue).toBe(188_640_000n);
    expect(quote.makingFee).toBe(28_296_000n);
    expect(quote.profit).toBe(15_185_520n);
    expect(quote.vat).toBe(4_348_152n);
    expect(quote.total).toBe(236_469_672n);
  });

  it('produces a breakdown that re-adds to the stated total', () => {
    const quote = quoteGoldPrice(REFERENCE);
    expect(sumRials([quote.goldValue, quote.makingFee, quote.profit, quote.vat])).toBe(quote.total);
  });

  it('charges VAT on the making fee and profit only, never on the gold itself', () => {
    const quote = quoteGoldPrice(REFERENCE);

    // Correct base: makingFee + profit.
    const correctBase = quote.makingFee + quote.profit;
    expect(quote.vat).toBe(correctBase / 10n);

    // The common mistake: VAT on the whole subtotal. Guard against a regression
    // that would overcharge every customer.
    const wrongBase = quote.goldValue + quote.makingFee + quote.profit;
    expect(quote.vat).not.toBe(wrongBase / 10n);
    expect(quote.vat).toBeLessThan(wrongBase / 10n);
  });

  it('bases profit on the gold value plus the making fee', () => {
    const quote = quoteGoldPrice(REFERENCE);
    expect(quote.profit).toBe(((quote.goldValue + quote.makingFee) * 700n) / 10_000n);
  });

  it('returns a zero breakdown for a zero weight', () => {
    const quote = quoteGoldPrice({ ...REFERENCE, weight: milligrams(0n) });
    expect(quote.total).toBe(0n);
  });

  it('omits fees entirely when every rate is zero', () => {
    const quote = quoteGoldPrice({
      ...REFERENCE,
      makingFeeBasisPoints: 0,
      profitBasisPoints: 0,
      vatBasisPoints: 0,
    });
    expect(quote.total).toBe(quote.goldValue);
    expect(quote.total).toBe(188_640_000n);
  });

  it('stays exact for magnitudes a double could not represent', () => {
    const quote = quoteGoldPrice({
      pricePerGram: rials(10n ** 18n),
      weight: milligrams(1_000_000n), // one kilogram
      makingFeeBasisPoints: 0,
      profitBasisPoints: 0,
      vatBasisPoints: 0,
    });

    expect(quote.goldValue).toBe(10n ** 21n);
    // The same computation in double precision would silently drift.
    expect(Number.isSafeInteger(Number(quote.goldValue))).toBe(false);
  });

  it('rejects negative inputs', () => {
    expect(() => quoteGoldPrice({ ...REFERENCE, pricePerGram: rials(-1n) })).toThrow(MoneyError);
    expect(() => quoteGoldPrice({ ...REFERENCE, makingFeeBasisPoints: -1 })).toThrow(MoneyError);
    expect(() => quoteGoldPrice({ ...REFERENCE, vatBasisPoints: 10.5 })).toThrow(MoneyError);
  });
});

describe('quoteGoldLine', () => {
  it('multiplies every line of the breakdown by the quantity', () => {
    const unit = quoteGoldPrice(REFERENCE);
    const line = quoteGoldLine(REFERENCE, 3);

    expect(line.goldValue).toBe(unit.goldValue * 3n);
    expect(line.total).toBe(unit.total * 3n);
    expect(sumRials([line.goldValue, line.makingFee, line.profit, line.vat])).toBe(line.total);
  });

  it('rejects a zero, negative or fractional quantity', () => {
    expect(() => quoteGoldLine(REFERENCE, 0)).toThrow(MoneyError);
    expect(() => quoteGoldLine(REFERENCE, -1)).toThrow(MoneyError);
    expect(() => quoteGoldLine(REFERENCE, 1.5)).toThrow(MoneyError);
  });
});

/**
 * A discount on the making fee.
 *
 * The making fee is the only part of an Iranian gold price a shop can
 * discount, and discounting it has to move the two figures derived from it.
 * Charging VAT on a fee nobody paid overcharges the customer on every
 * discounted order, which is what these pin.
 */
describe('discounting the making fee', () => {
  const DISCOUNT = rials(10_000_000n);

  it('leaves the gold value alone and reduces the fee', () => {
    const plain = quoteGoldPrice(REFERENCE);
    const cut = quoteGoldPrice({ ...REFERENCE, makingFeeDiscount: DISCOUNT });

    expect(cut.goldValue).toBe(plain.goldValue);
    // The invoice still shows the fee that was charged before the discount.
    expect(cut.makingFee).toBe(plain.makingFee);
    expect(cut.makingFeeDiscount).toBe(DISCOUNT);
  });

  it('takes the profit and the VAT off the discounted fee, not the full one', () => {
    const plain = quoteGoldPrice(REFERENCE);
    const cut = quoteGoldPrice({ ...REFERENCE, makingFeeDiscount: DISCOUNT });

    expect(cut.profit).toBeLessThan(plain.profit);
    expect(cut.vat).toBeLessThan(plain.vat);
  });

  it('still produces a breakdown that re-adds to the total', () => {
    const cut = quoteGoldPrice({ ...REFERENCE, makingFeeDiscount: DISCOUNT });

    expect(
      sumRials([cut.goldValue, cut.makingFee, cut.profit, cut.vat]) - cut.makingFeeDiscount,
    ).toBe(cut.total);
  });

  it('never discounts more of the fee than there is', () => {
    const cut = quoteGoldPrice({ ...REFERENCE, makingFeeDiscount: rials(999_999_999_999n) });

    expect(cut.makingFeeDiscount).toBe(cut.makingFee);
    // The gold itself is never given away, whatever the code claims to be worth.
    expect(cut.total).toBeGreaterThanOrEqual(cut.goldValue);
  });

  it('refuses a negative discount, which would be a surcharge', () => {
    expect(() => quoteGoldPrice({ ...REFERENCE, makingFeeDiscount: rials(-1n) })).toThrow(
      MoneyError,
    );
  });

  it('applies to a line as a whole, not once per item', () => {
    const line = quoteGoldLine({ ...REFERENCE, makingFeeDiscount: DISCOUNT }, 3);
    const plain = quoteGoldLine(REFERENCE, 3);

    expect(line.makingFeeDiscount).toBe(DISCOUNT);
    expect(plain.total - line.total).toBeGreaterThan(0n);
    expect(
      sumRials([line.goldValue, line.makingFee, line.profit, line.vat]) - line.makingFeeDiscount,
    ).toBe(line.total);
  });
});

describe('pricePerGramForKarat', () => {
  it('converts 18-carat to 24-carat', () => {
    // 18k at 750/1000 fine; 24k is 4/3 of the 18k price.
    expect(pricePerGramForKarat(rials(90_000_000n), PURITY.k18, PURITY.k24)).toBe(120_000_000n);
  });

  it('round-trips back to the original purity', () => {
    const eighteen = rials(104_800_000n);
    const twentyFour = pricePerGramForKarat(eighteen, PURITY.k18, PURITY.k24);
    expect(pricePerGramForKarat(twentyFour, PURITY.k24, PURITY.k18)).toBe(eighteen);
  });

  it('rejects a non-positive carat', () => {
    expect(() => pricePerGramForKarat(rials(1n), 0, 18)).toThrow(MoneyError);
  });
});

describe('roundTotalToStep', () => {
  it('settles a total to the nearest 1,000 rials', () => {
    expect(roundTotalToStep(rials(236_469_672n), 1_000n)).toBe(236_470_000n);
    expect(roundTotalToStep(rials(236_469_372n), 1_000n)).toBe(236_469_000n);
  });

  it('can settle upward only', () => {
    expect(roundTotalToStep(rials(236_469_072n), 1_000n, 'ceil')).toBe(236_470_000n);
  });

  it('rejects a non-positive step', () => {
    expect(() => roundTotalToStep(rials(100n), 0n)).toThrow(MoneyError);
  });
});
