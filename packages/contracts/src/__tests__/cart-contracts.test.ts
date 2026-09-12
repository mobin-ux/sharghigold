import { describe, expect, it } from 'vitest';

import {
  addToCartSchema,
  billLineSchema,
  CART_MAX_QUANTITY,
  cartLineSchema,
  cartTotalsSchema,
  checkoutPaymentSchema,
  companyDetailsSchema,
  discountCodeSchema,
  orderCodeSchema,
  orderNoteSchema,
  otherRecipientSchema,
  placedOrderSchema,
} from '../index.js';

/**
 * The basket contracts decide what a customer is allowed to say about their
 * own order, so what is pinned is the boundary: what goes in, and the shape of
 * the money that comes back.
 */

describe('what goes into the basket', () => {
  const valid = { productSlug: 'classic-solitaire-ring', size: 54, colour: 'yellow', quantity: 1 };

  it('takes a product, a size, a colour and a count', () => {
    expect(addToCartSchema.parse(valid)).toEqual(valid);
  });

  it('accepts a piece that has no size, as a null and not an absence', () => {
    expect(addToCartSchema.parse({ ...valid, size: null }).size).toBeNull();
  });

  it('refuses a quantity that is not a whole positive number', () => {
    for (const quantity of [0, -1, 1.5, Number.NaN]) {
      expect(addToCartSchema.safeParse({ ...valid, quantity }).success, String(quantity)).toBe(
        false,
      );
    }
  });

  it('bounds the quantity before anything multiplies by it', () => {
    expect(addToCartSchema.safeParse({ ...valid, quantity: CART_MAX_QUANTITY }).success).toBe(true);
    expect(addToCartSchema.safeParse({ ...valid, quantity: CART_MAX_QUANTITY + 1 }).success).toBe(
      false,
    );
  });

  it('refuses a colour the workshop does not offer', () => {
    expect(addToCartSchema.safeParse({ ...valid, colour: 'platinum' }).success).toBe(false);
  });

  it('carries no price of any kind', () => {
    // The single most important property in this file. A line says what was
    // chosen; what it costs is the server's to decide.
    const keys = Object.keys(addToCartSchema.parse(valid));
    expect(keys.some((key) => /rial|price|total|amount/i.test(key))).toBe(false);
  });
});

describe('a discount code', () => {
  it('is upper-cased before it is matched', () => {
    expect(discountCodeSchema.parse(' zarnama10 ')).toBe('ZARNAMA10');
  });

  it('is only ever letters and digits, so it can only be a key', () => {
    for (const value of ['ZAR NAMA', 'ZAR-10', "ZAR';--", 'ZA', '']) {
      expect(discountCodeSchema.safeParse(value).success, value).toBe(false);
    }
  });
});

describe('the recipient and the company', () => {
  it('wants a real Iranian mobile for somebody else’s parcel', () => {
    expect(
      otherRecipientSchema.safeParse({ name: 'مینا رضایی', mobile: '09121110000' }).success,
    ).toBe(true);
    expect(otherRecipientSchema.safeParse({ name: 'مینا رضایی', mobile: '12345' }).success).toBe(
      false,
    );
  });

  it('refuses a one-letter recipient', () => {
    expect(otherRecipientSchema.safeParse({ name: 'م', mobile: '09121110000' }).success).toBe(
      false,
    );
  });

  it('takes an economic code of ten to sixteen digits and nothing else', () => {
    const name = 'شرکت نمونه';
    expect(companyDetailsSchema.safeParse({ name, economicCode: '1234567890' }).success).toBe(true);
    expect(companyDetailsSchema.safeParse({ name, economicCode: '123456789' }).success).toBe(false);
    expect(companyDetailsSchema.safeParse({ name, economicCode: '۱۲۳۴۵۶۷۸۹۰' }).success).toBe(
      false,
    );
  });

  it('bounds the note, because it is the one field a customer writes freely', () => {
    expect(orderNoteSchema.safeParse('پیش از ارسال تماس بگیرید').success).toBe(true);
    expect(orderNoteSchema.safeParse('ا'.repeat(401)).success).toBe(false);
  });
});

describe('the money that comes back', () => {
  const line = {
    id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e4201',
    productSlug: 'classic-solitaire-ring',
    title: 'انگشتر تک‌نگین',
    sku: 'ZN-10482',
    mediaId: 'front',
    size: 54,
    colour: 'yellow',
    colourLabel: 'زرد',
    quantity: 2,
    weightMilligrams: '5600',
    unitTotalRials: '360000000',
    lineTotalRials: '720000000',
    stockRemaining: 5,
    orderable: true,
  };

  it('carries whole rials as digits, never a number', () => {
    expect(cartLineSchema.safeParse(line).success).toBe(true);
    expect(cartLineSchema.safeParse({ ...line, lineTotalRials: 720_000_000 }).success).toBe(false);
    expect(cartLineSchema.safeParse({ ...line, lineTotalRials: '7.2e8' }).success).toBe(false);
  });

  it('refuses a negative line total, which no basket line can be', () => {
    expect(cartLineSchema.safeParse({ ...line, lineTotalRials: '-1' }).success).toBe(false);
  });

  it('lets a bill line be negative, because a discount is one', () => {
    expect(
      billLineSchema.safeParse({ kind: 'discount', amountRials: '-20000000', detail: '۱۰٪ اجرت' })
        .success,
    ).toBe(true);
    expect(
      billLineSchema.safeParse({ kind: 'discount', amountRials: '-2e7', detail: null }).success,
    ).toBe(false);
  });

  it('carries the payable figure separately from the total', () => {
    // An instalment purchase asks for the deposit today, so no screen has to
    // work out which of the two its button is about.
    const totals = {
      weightMilligrams: '5600',
      lines: [{ kind: 'gold-value', amountRials: '500000000', detail: null }],
      itemsRials: '720000000',
      discountRials: '0',
      shippingRials: '0',
      giftRials: '0',
      totalRials: '720000000',
      payNowRials: '288000000',
    };
    expect(cartTotalsSchema.safeParse(totals).success).toBe(true);
  });
});

describe('the order', () => {
  it('names itself the way support asks for it', () => {
    expect(orderCodeSchema.safeParse('ZN-88520').success).toBe(true);
    expect(orderCodeSchema.safeParse('ZN-8852').success).toBe(false);
    expect(orderCodeSchema.safeParse('88520').success).toBe(false);
  });

  it('keeps where the money got to apart from where the goods got to', () => {
    const order = {
      code: 'ZN-88520',
      placedAt: '2026-09-12T09:00:00.000Z',
      paymentState: 'paid',
      payment: 'gateway',
      paymentLabel: 'درگاه پرداخت بانکی',
      totalRials: '720000000',
      paidRials: '720000000',
      itemCount: 2,
      deliveryMode: 'ship',
      deliveryLabel: 'پست پیشتاز بیمه‌شده — تهران',
      reference: '4490217',
      failureReason: null,
    };

    expect(placedOrderSchema.safeParse(order).success).toBe(true);
    // «processing» is where the goods are, not where the money is.
    expect(placedOrderSchema.safeParse({ ...order, paymentState: 'processing' }).success).toBe(
      false,
    );
  });

  it('names a closed set of ways to pay', () => {
    expect(checkoutPaymentSchema.safeParse('wallet').success).toBe(true);
    expect(checkoutPaymentSchema.safeParse('cash-on-delivery').success).toBe(false);
  });
});
