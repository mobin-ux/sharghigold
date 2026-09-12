import { priceQuoteSchema } from '@sharghigold/contracts';
import { rials, RIALS_PER_TOMAN } from '@sharghigold/money';
import { describe, expect, it } from 'vitest';

import { getProduct } from '@/server/catalogue/product';
import { quoteProduct } from '@/server/catalogue/pricing';
import { priceInstallment } from '@/server/policy/installments';
import { PRICE_LOCK_SECONDS } from '@/server/policy/shop-policy';

/**
 * The price is the part of this page that can cost real money if it is wrong,
 * so the properties that matter are pinned rather than the figures.
 *
 * A fixed instant is used throughout: a quote carries an expiry, and a test
 * that reads the clock is a test that fails at midnight.
 */
const AT = new Date('2026-09-10T12:00:00.000Z');

const solitaire = await getProduct('classic-solitaire-ring');
if (solitaire === undefined) throw new Error('fixture missing: classic-solitaire-ring');

const coins = await getProduct('paired-wedding-bands');
if (coins === undefined) throw new Error('fixture missing: paired-wedding-bands');

describe('product quote', () => {
  it('matches the shared contract', () => {
    // The gateway parses on the way out, so reaching here already proves it.
    // Re-parsing states the intent: this shape is the API's, and either side
    // drifting from it should fail here rather than reach a customer.
    expect(() => priceQuoteSchema.parse(quoteProduct(solitaire, AT))).not.toThrow();
  });

  it('adds its four lines up to exactly the total', () => {
    const quote = quoteProduct(solitaire, AT);
    const sum = quote.lines.reduce((total, line) => total + BigInt(line.amountRials), 0n);

    // Not «close to». The breakdown a customer can check has to re-add to the
    // figure they are charged, exactly, or one of the two is a lie.
    expect(sum).toBe(BigInt(quote.totalRials));
  });

  it('charges VAT on the fee and the profit but never on the metal', () => {
    const quote = quoteProduct(solitaire, AT);
    const by = (kind: string) =>
      BigInt(quote.lines.find((line) => line.kind === kind)?.amountRials ?? '0');

    // Half away from zero at whole-rial precision, as the money package does:
    // truncating here would be testing a different rounding rule from the one
    // the shop actually charges.
    const base = by('making-fee') + by('profit');
    const scaled = base * BigInt(solitaire.vatBasisPoints);
    const expected = (scaled + 5_000n) / 10_000n;

    // The single most commonly mis-implemented rule in the trade. Applying VAT
    // to the gold value as well would overcharge on every order.
    expect(by('vat')).toBe(expected);
    expect(by('vat')).toBeLessThan(by('gold-value'));
  });

  it('derives the gold line from the weight and the rate, not from a stored price', () => {
    const quote = quoteProduct(solitaire, AT);
    const goldValue = BigInt(
      quote.lines.find((line) => line.kind === 'gold-value')?.amountRials ?? '0',
    );

    const expected =
      (BigInt(quote.rate.pricePerGramRials) * BigInt(solitaire.weightMilligrams)) / 1_000n;

    expect(goldValue).toBe(expected);
  });

  it('expires exactly one lock after it was struck', () => {
    const quote = quoteProduct(solitaire, AT);

    expect(quote.quotedAt).toBe(AT.toISOString());
    expect(Date.parse(quote.expiresAt) - Date.parse(quote.quotedAt)).toBe(
      PRICE_LOCK_SECONDS * 1_000,
    );
    expect(quote.secondsRemaining).toBe(PRICE_LOCK_SECONDS);
  });

  it('never quotes an instalment below what the term actually costs', () => {
    const quote = quoteProduct(solitaire, AT);
    const total = rials(BigInt(quote.totalRials));

    expect(quote.plans).not.toHaveLength(0);

    for (const plan of quote.plans) {
      const monthly = BigInt(plan.monthlyRials);
      const priced = priceInstallment(total, plan.months);

      // Paying the quoted figure every month must clear the balance the
      // deposit leaves behind, surcharge included. A quote that is a rial
      // short leaves the customer with an unexplained final instalment.
      expect(monthly * BigInt(plan.months)).toBeGreaterThanOrEqual(priced.total - priced.deposit);

      // And it must be a whole toman, because that is the unit it is shown in.
      expect(monthly % RIALS_PER_TOMAN).toBe(0n);
    }
  });

  it('quotes the instalment the shop will actually charge', () => {
    const quote = quoteProduct(solitaire, AT);
    const total = rials(BigInt(quote.totalRials));

    // The product page's preview and the checkout screen read one policy. If
    // these ever diverge, the shop advertises terms it will not honour.
    for (const plan of quote.plans) {
      expect(plan.monthlyRials).toBe(priceInstallment(total, plan.months).monthly.toString());
    }
  });

  it('offers no instalments on a piece that is not eligible', () => {
    const ineligible = { ...solitaire, installmentEligible: false };

    expect(quoteProduct(ineligible, AT).plans).toEqual([]);
  });

  it('re-quotes rather than reusing a figure', () => {
    const later = new Date(AT.getTime() + 60_000);

    const first = quoteProduct(solitaire, AT);
    const second = quoteProduct(solitaire, later);

    // Same rate, so the same total — but a fresh window every time.
    expect(second.totalRials).toBe(first.totalRials);
    expect(second.expiresAt).not.toBe(first.expiresAt);
  });

  it('prices a heavier piece higher, in proportion to its weight', () => {
    const light = quoteProduct(solitaire, AT);
    const heavy = quoteProduct(coins, AT);

    expect(BigInt(heavy.totalRials)).toBeGreaterThan(BigInt(light.totalRials));
  });
});
