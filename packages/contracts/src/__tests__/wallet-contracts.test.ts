import { describe, expect, it } from 'vitest';

import {
  paymentMethodSchema,
  paymentStatusSchema,
  TOP_UP_MAX_RIALS,
  TOP_UP_MIN_RIALS,
  TOP_UP_QUICK_RIALS,
  topUpReceiptSchema,
  topUpTomanSchema,
  walletStateSchema,
} from '../index.js';

/**
 * The wallet contracts carry money, so what is pinned is the part that decides
 * how much: the shape of the amount that leaves the form, and the shape of the
 * receipt that comes back.
 */

describe('the amount as it leaves the form', () => {
  it('takes a plain string of digits', () => {
    expect(topUpTomanSchema.parse('5000000')).toBe('5000000');
    expect(topUpTomanSchema.parse('  50000  ')).toBe('50000');
  });

  it('refuses anything that is not digits, including the grouping it is shown with', () => {
    for (const value of ['5٬000٬000', '۵۰۰۰۰', '5e6', '-50000', '50000.5', '']) {
      expect(topUpTomanSchema.safeParse(value).success, value).toBe(false);
    }
  });

  it('refuses a number longer than any amount could be', () => {
    // Bounded before it is ever converted, so a pasted field cannot become an
    // allocation.
    expect(topUpTomanSchema.safeParse('9'.repeat(12)).success).toBe(true);
    expect(topUpTomanSchema.safeParse('9'.repeat(13)).success).toBe(false);
  });
});

describe('the limits', () => {
  it('are whole rials, and the smaller is smaller', () => {
    expect(TOP_UP_MIN_RIALS).toBe(500_000n);
    expect(TOP_UP_MAX_RIALS).toBe(5_000_000_000n);
    expect(TOP_UP_MIN_RIALS < TOP_UP_MAX_RIALS).toBe(true);
  });

  it('contain every suggested amount', () => {
    for (const amount of TOP_UP_QUICK_RIALS) {
      expect(amount >= TOP_UP_MIN_RIALS, String(amount)).toBe(true);
      expect(amount <= TOP_UP_MAX_RIALS, String(amount)).toBe(true);
      // Whole tomans, because that is the unit the chip is labelled in.
      expect(amount % 10n).toBe(0n);
    }
  });
});

describe('the method and the status', () => {
  it('are closed sets', () => {
    expect(paymentMethodSchema.safeParse('gateway').success).toBe(true);
    expect(paymentMethodSchema.safeParse('bitcoin').success).toBe(false);
    expect(paymentStatusSchema.safeParse('succeeded').success).toBe(true);
    expect(paymentStatusSchema.safeParse('refunded').success).toBe(false);
  });
});

describe('the receipt', () => {
  const receipt = {
    id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41b1',
    reference: '82491037',
    amountRials: '50000000',
    method: 'gateway',
    status: 'succeeded',
    createdAt: '2026-09-11T09:00:00.000Z',
    settledAt: '2026-09-11T09:00:12.000Z',
    balanceAfterRials: '98200000',
  };

  it('carries whole rials as digits, never a number', () => {
    expect(topUpReceiptSchema.safeParse(receipt).success).toBe(true);
    expect(topUpReceiptSchema.safeParse({ ...receipt, amountRials: 50_000_000 }).success).toBe(
      false,
    );
    expect(topUpReceiptSchema.safeParse({ ...receipt, amountRials: '5.0e7' }).success).toBe(false);
  });

  it('refuses a negative amount, which no top-up can be', () => {
    expect(topUpReceiptSchema.safeParse({ ...receipt, amountRials: '-50000000' }).success).toBe(
      false,
    );
  });

  it('allows a payment that has not settled to have neither time nor balance', () => {
    const pending = {
      ...receipt,
      status: 'pending',
      settledAt: null,
      balanceAfterRials: null,
    };
    expect(topUpReceiptSchema.safeParse(pending).success).toBe(true);
  });

  it('requires the tracking number to be the eight digits support asks for', () => {
    expect(topUpReceiptSchema.safeParse({ ...receipt, reference: '8249103' }).success).toBe(false);
    expect(topUpReceiptSchema.safeParse({ ...receipt, reference: '۸۲۴۹۱۰۳۷' }).success).toBe(false);
  });
});

describe('the wallet', () => {
  it('is money and metal, both as whole units', () => {
    expect(
      walletStateSchema.safeParse({ balanceRials: '48200000', goldMilligrams: '3200' }).success,
    ).toBe(true);
    expect(
      walletStateSchema.safeParse({ balanceRials: '48200000.5', goldMilligrams: '3200' }).success,
    ).toBe(false);
  });
});
