import { INSTALLMENT_QUOTE_MAX_TOMAN, INSTALLMENT_QUOTE_MIN_TOMAN } from '@sharghigold/contracts';
import { rials, RIALS_PER_TOMAN } from '@sharghigold/money';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_QUOTE_MONTHS,
  DEFAULT_QUOTE_TOMAN,
  quoteFromQuery,
  readQuoteAmount,
  readQuoteMonths,
} from '@/server/policy/installment-calculator';
import { priceInstallment } from '@/server/policy/installments';
import { INSTALLMENT } from '@/server/policy/shop-policy';

/**
 * The `/installment` calculator reads a URL anybody can edit, so what matters
 * is that no address makes it throw or quote a term the shop does not offer,
 * and that what it quotes is exactly what checkout would charge.
 */

describe('reading the amount', () => {
  it('prices the default when the URL names none', () => {
    expect(readQuoteAmount(undefined)).toEqual({
      typed: DEFAULT_QUOTE_TOMAN.toString(),
      toman: DEFAULT_QUOTE_TOMAN,
      error: null,
    });
  });

  it('accepts Persian digits and thousands separators', () => {
    expect(readQuoteAmount('۶۰٬۰۰۰٬۰۰۰').toman).toBe(60_000_000n);
    expect(readQuoteAmount('45,000,000').toman).toBe(45_000_000n);
  });

  it('prices the nearest accepted amount and says why', () => {
    const low = readQuoteAmount('5000');
    expect(low.toman).toBe(INSTALLMENT_QUOTE_MIN_TOMAN);
    expect(low.typed).toBe('5000');
    expect(low.error).toContain('حداقل');

    const high = readQuoteAmount('9999999999999');
    expect(high.toman).toBe(INSTALLMENT_QUOTE_MAX_TOMAN);
    expect(high.error).toContain('بیشترین');
  });

  it('refuses anything but digits without parsing it', () => {
    expect(readQuoteAmount('1e9').error).not.toBeNull();
    expect(readQuoteAmount('9'.repeat(5_000)).toman).toBe(DEFAULT_QUOTE_TOMAN);
    expect(readQuoteAmount(['30000000', '90000000']).toman).toBe(30_000_000n);
  });
});

describe('reading the term', () => {
  it('keeps a term the shop offers', () => {
    for (const months of INSTALLMENT.terms) expect(readQuoteMonths(String(months))).toBe(months);
  });

  it('falls back rather than quoting an unoffered term', () => {
    expect(readQuoteMonths('36')).toBe(DEFAULT_QUOTE_MONTHS);
    expect(readQuoteMonths('twelve')).toBe(DEFAULT_QUOTE_MONTHS);
    expect(readQuoteMonths(undefined)).toBe(DEFAULT_QUOTE_MONTHS);
  });
});

describe('the quote', () => {
  it('is what checkout charges for the same amount and term', () => {
    const quote = quoteFromQuery('30000000', '12');
    const checkout = priceInstallment(rials(30_000_000n * RIALS_PER_TOMAN), 12);

    expect(quote.depositRials).toBe(checkout.deposit.toString());
    expect(quote.monthlyRials).toBe(checkout.monthly.toString());
    expect(quote.totalRials).toBe(checkout.total.toString());
  });

  it('adds up: deposit and balance make the price, the surcharge makes the total', () => {
    const quote = quoteFromQuery('85000000', '18');
    const cash = BigInt(quote.cashRials);

    expect(BigInt(quote.depositRials) + BigInt(quote.financedRials)).toBe(cash);
    expect(cash + BigInt(quote.surchargeRials)).toBe(BigInt(quote.totalRials));
    expect(quote.surchargeRials).toBe('183600000');
  });

  it('lists one row per month, none above the quoted figure, all whole toman', () => {
    const quote = quoteFromQuery('85000000', '18');

    expect(quote.instalmentRials).toHaveLength(18);
    for (const part of quote.instalmentRials) {
      expect(BigInt(part) <= BigInt(quote.monthlyRials)).toBe(true);
      expect(BigInt(part) % RIALS_PER_TOMAN).toBe(0n);
    }
    expect(quote.monthlyRials).toBe('38533340');
  });
});
