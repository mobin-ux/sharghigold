import { paymentStatusSchema, TOP_UP_QUICK_RIALS } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import {
  PAYMENT_METHODS,
  receiptStamp,
  referenceLabel,
  RESULT_COPY,
  tomanField,
  tomanWords,
} from '@/lib/wallet-view';

describe('an amount in words', () => {
  it('says whole millions plainly', () => {
    expect(tomanWords('10000000')).toBe('۱ میلیون تومان');
    expect(tomanWords('200000000')).toBe('۲۰ میلیون تومان');
  });

  it('joins the remainder in thousands', () => {
    expect(tomanWords('15000000')).toBe('۱ میلیون و ۵۰۰ هزار تومان');
  });

  it('says thousands on their own below a million', () => {
    expect(tomanWords('500000')).toBe('۵۰ هزار تومان');
  });

  it('says nothing where the words would be longer than the figure', () => {
    expect(tomanWords('0')).toBe('');
    expect(tomanWords('5000')).toBe('');
    // A figure that is not a round number of thousands has no short phrasing.
    expect(tomanWords('12345670')).toBe('۱ میلیون و ۲۳۴ هزار تومان');
  });

  it('labels every suggested amount', () => {
    for (const amount of TOP_UP_QUICK_RIALS) {
      expect(tomanWords(String(amount)), String(amount)).not.toBe('');
    }
  });

  it('groups the figure a field shows', () => {
    expect(tomanField('50000000')).toBe('۵٬۰۰۰٬۰۰۰');
  });
});

describe('the tracking number', () => {
  it('is shown in Persian numerals with its leading zeros', () => {
    expect(referenceLabel('00491037')).toBe('۰۰۴۹۱۰۳۷');
  });
});

describe('the receipt stamp', () => {
  it('is a Persian date and a time, in Tehran', () => {
    const stamp = receiptStamp('2026-09-11T11:02:00.000Z');
    expect(stamp).toContain('۱۴۰۵');
    expect(stamp).toContain(' — ');
    // 11:02 UTC is 14:32 in Tehran.
    expect(stamp.endsWith('۱۴:۳۲')).toBe(true);
  });

  it('says nothing for a value it cannot read', () => {
    expect(receiptStamp('not a date')).toBe('');
  });
});

describe('the copy', () => {
  it('covers every status a payment can be in', () => {
    for (const status of paymentStatusSchema.options) {
      expect(RESULT_COPY[status], status).toBeDefined();
      expect(RESULT_COPY[status].title.length, status).toBeGreaterThan(0);
    }
  });

  it('offers another attempt only where one makes sense', () => {
    expect(RESULT_COPY.failed.retry).toBe(true);
    expect(RESULT_COPY.canceled.retry).toBe(true);
    // Retrying a payment that worked would take the money twice; retrying one
    // the bank has not answered would open a second alongside it.
    expect(RESULT_COPY.succeeded.retry).toBe(false);
    expect(RESULT_COPY.pending.retry).toBe(false);
  });

  it('marks card to card as the one that is not built', () => {
    expect(PAYMENT_METHODS.gateway.available).toBe(true);
    expect(PAYMENT_METHODS['card-to-card'].available).toBe(false);
  });
});
