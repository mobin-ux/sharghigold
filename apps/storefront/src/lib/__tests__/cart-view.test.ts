import { billLineKindSchema, orderPaymentStateSchema } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import {
  billLabel,
  billTone,
  billValue,
  cartProblem,
  countLabel,
  feeLabel,
  lineSpec,
  lowStockNote,
  ORDER_RESULT,
  PAYMENT_COPY,
  PAYMENT_ORDER,
  resultRows,
  signedToman,
  slotLabel,
} from '@/lib/cart-view';

describe('amounts', () => {
  it('writes a discount with a true minus sign, not a hyphen', () => {
    // At this size, in a right-to-left line, a hyphen reads as a dash between
    // two numbers.
    expect(signedToman('-20000000')).toBe('−۲٬۰۰۰٬۰۰۰');
    expect(signedToman('20000000')).toBe('۲٬۰۰۰٬۰۰۰');
  });

  it('says «رایگان» rather than a zero a reader has to interpret', () => {
    expect(feeLabel('0')).toBe('رایگان');
    expect(feeLabel('4500000')).toBe('۴۵۰٬۰۰۰');
  });
});

describe('the bill', () => {
  it('names every line the server can send', () => {
    for (const kind of billLineKindSchema.options) {
      const label = billLabel({ kind, amountRials: '1000', detail: null }, '5600');
      expect(label.length, kind).toBeGreaterThan(0);
    }
  });

  it('puts the weight beside the gold, because that is what makes it checkable', () => {
    expect(billLabel({ kind: 'gold-value', amountRials: '1', detail: null }, '5600')).toContain(
      '۵٫۶۰',
    );
  });

  it('names the code that produced a discount', () => {
    expect(
      billLabel({ kind: 'discount', amountRials: '-1', detail: '۱۰٪ تخفیف اجرت' }, '0'),
    ).toContain('۱۰٪ تخفیف اجرت');
  });

  it('reads a discount and a waived fee as credits', () => {
    expect(billTone({ kind: 'discount', amountRials: '-1', detail: null })).toBe('credit');
    expect(billTone({ kind: 'shipping', amountRials: '0', detail: null })).toBe('free');
    expect(billTone({ kind: 'shipping', amountRials: '4500000', detail: null })).toBe('plain');
    expect(billValue({ kind: 'pickup', amountRials: '0', detail: null })).toBe('رایگان');
  });
});

describe('a basket line', () => {
  it('quotes the weight of one piece, not the line', () => {
    // 5600 mg across two pieces is 2.80 g each.
    expect(lineSpec({ size: 54, colourLabel: 'زرد', weightMilligrams: '5600', quantity: 2 })).toBe(
      'سایز ۵۴ · طلای زرد · ۲٫۸۰ گرم',
    );
  });

  it('leaves the size out of a piece that has none', () => {
    expect(
      lineSpec({ size: null, colourLabel: 'رزگلد', weightMilligrams: '1400', quantity: 1 }),
    ).toBe('طلای رزگلد · ۱٫۴۰ گرم');
  });

  it('counts in Persian, and says «خالی» rather than «۰ قطعه»', () => {
    expect(countLabel(3)).toBe('۳ قطعه');
    expect(countLabel(0)).toBe('خالی');
    expect(lowStockNote(1)).toBe('تنها ۱ عدد در انبار مانده است');
  });
});

describe('a collection window', () => {
  const slot = { date: '2026-09-14', fromHour: 15, toHour: 18 };

  it('names the day the way a customer would', () => {
    expect(slotLabel(slot, '2026-09-14')).toBe('امروز ۱۵ تا ۱۸');
    expect(slotLabel(slot, '2026-09-13')).toBe('فردا ۱۵ تا ۱۸');
  });

  it('falls back to the Persian date further out', () => {
    const label = slotLabel(slot, '2026-09-10');
    expect(label).not.toContain('امروز');
    expect(label).not.toContain('فردا');
    expect(label).toContain('۱۵ تا ۱۸');
  });
});

describe('how it ended', () => {
  it('covers every state a payment can be in', () => {
    for (const state of orderPaymentStateSchema.options) {
      expect(ORDER_RESULT[state].title.length, state).toBeGreaterThan(0);
    }
  });

  it('offers another attempt only where one makes sense', () => {
    expect(ORDER_RESULT.failed.retry).toBe(true);
    expect(ORDER_RESULT.canceled.retry).toBe(true);
    // Retrying a payment that worked would charge twice; retrying one the bank
    // has not answered would open a second alongside it.
    expect(ORDER_RESULT.paid.retry).toBe(false);
    expect(ORDER_RESULT.pending.retry).toBe(false);
  });

  it('shows where the order is going when it worked, and why when it did not', () => {
    const order = {
      code: 'ZN-88520',
      placedAt: '2026-09-12T09:00:00.000Z',
      paymentState: 'paid',
      payment: 'gateway',
      paymentLabel: 'درگاه پرداخت بانکی',
      totalRials: '720000000',
      paidRials: '720000000',
      itemCount: 1,
      deliveryMode: 'ship',
      deliveryLabel: 'پست پیشتاز بیمه‌شده',
      reference: '4490217',
      failureReason: null,
    } as const;

    const paid = resultRows(order).map(([label]) => label);
    expect(paid).toContain('کد پیگیری بانک');
    expect(paid).toContain('تحویل');

    const failed = resultRows({
      ...order,
      paymentState: 'failed',
      reference: null,
      failureReason: 'declined',
    }).map(([label]) => label);
    expect(failed).toContain('علت');
    expect(failed).not.toContain('تحویل');
  });

  it('names every way of paying it offers', () => {
    for (const method of PAYMENT_ORDER) {
      expect(PAYMENT_COPY[method].label.length, method).toBeGreaterThan(0);
    }
  });
});

describe('what went wrong', () => {
  it('resolves a key and never prints one it does not know', () => {
    expect(cartProblem('out-of-stock')).toBeDefined();
    // The query string is something a stranger can write, so an unrecognised
    // value renders nothing rather than becoming the page's own text.
    expect(cartProblem('<script>alert(1)</script>')).toBeUndefined();
    expect(cartProblem(undefined)).toBeUndefined();
  });
});
