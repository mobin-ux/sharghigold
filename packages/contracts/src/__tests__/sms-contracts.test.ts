import { describe, expect, it } from 'vitest';

import { maskIranianMobile } from '../primitives.js';
import {
  isGsmText,
  isOptionalPurpose,
  isRetryableStatus,
  isSettledStatus,
  smsSegments,
  smsSendRequestSchema,
  smsStatusQuerySchema,
  SMS_DELIVERY_STATUSES,
} from '../sms.js';

describe('maskIranianMobile', () => {
  it('keeps enough to recognise a number and not enough to dial it', () => {
    expect(maskIranianMobile('09120001234')).toBe('0912***34');
  });

  it('normalises before masking, so one number has one masked form', () => {
    // The same number typed four ways must not produce four log identities.
    for (const spelling of ['09120001234', '+989120001234', '00989120001234', '9120001234']) {
      expect(maskIranianMobile(spelling)).toBe('0912***34');
    }
  });

  it('does not echo input it could not parse', () => {
    // The one time this is called with the wrong variable must not be the time
    // a secret reaches the log.
    expect(maskIranianMobile('sk-live-abcdef')).toBe('09**invalid**');
    expect(maskIranianMobile('')).toBe('09**invalid**');
  });
});

describe('smsSegments', () => {
  it('counts Persian as UCS-2, not as the 160 characters people expect', () => {
    expect(smsSegments('ا'.repeat(70))).toBe(1);
    expect(smsSegments('ا'.repeat(71))).toBe(2);
    expect(smsSegments('ا'.repeat(134))).toBe(2);
    expect(smsSegments('ا'.repeat(135))).toBe(3);
  });

  it('counts Latin text against the 7-bit alphabet', () => {
    expect(smsSegments('a'.repeat(160))).toBe(1);
    expect(smsSegments('a'.repeat(161))).toBe(2);
  });

  it('drops to UCS-2 as soon as one character leaves the alphabet', () => {
    // A single Persian comma in an otherwise Latin message triples its cost.
    expect(smsSegments('a'.repeat(100))).toBe(1);
    expect(smsSegments(`${'a'.repeat(100)}،`)).toBe(2);
  });

  it('counts an emoji as the sender sees it, not as UTF-16 does', () => {
    // '🙂' is two UTF-16 units and one character to the operator.
    expect(smsSegments('🙂'.repeat(70))).toBe(1);
  });

  it('charges nothing for nothing', () => {
    expect(smsSegments('')).toBe(0);
  });
});

describe('isGsmText', () => {
  it('accepts the awkward members of the basic set', () => {
    // '-', '^', ']' and '\\' all change meaning inside a character class, which
    // is why the set is a list rather than a regex.
    expect(isGsmText('a-b^c]d\\e{f}g[h~i|j€')).toBe(true);
    expect(isGsmText('£$¥èéùìòÇØåΔΦΓΛΩΠΨΣΘΞÆæßÉ')).toBe(true);
  });

  it('rejects Persian', () => {
    expect(isGsmText('سلام')).toBe(false);
  });
});

describe('delivery status vocabulary', () => {
  it('treats only the terminal statuses as settled', () => {
    expect(SMS_DELIVERY_STATUSES.filter(isSettledStatus)).toEqual([
      'delivered',
      'undelivered',
      'rejected',
      'expired',
      'failed',
    ]);
  });

  it('leaves unknown unsettled, so a status we do not recognise is not buried', () => {
    expect(isSettledStatus('unknown')).toBe(false);
  });

  it('never suggests resending to a recipient who refused', () => {
    expect(isRetryableStatus('rejected')).toBe(false);
    expect(isRetryableStatus('delivered')).toBe(false);
    expect(isRetryableStatus('undelivered')).toBe(true);
  });
});

describe('purposes', () => {
  it('does not let a customer switch off their own login codes', () => {
    expect(isOptionalPurpose('marketing')).toBe(true);
    expect(isOptionalPurpose('transactional')).toBe(false);
    expect(isOptionalPurpose('otp')).toBe(false);
  });
});

describe('smsSendRequestSchema', () => {
  it('normalises the recipient', () => {
    const parsed = smsSendRequestSchema.parse({
      mobile: '+989120001234',
      purpose: 'transactional',
      text: '  سفارش ارسال شد  ',
    });

    expect(parsed.mobile).toBe('09120001234');
    expect(parsed.text).toBe('سفارش ارسال شد');
  });

  it('cannot be used to send a one-time code', () => {
    // An endpoint that sent one on request would be a way to make somebody's
    // phone ring with a code they did not ask for.
    expect(
      smsSendRequestSchema.safeParse({ mobile: '09120001234', purpose: 'otp', text: 'x' }).success,
    ).toBe(false);
  });

  it('rejects a line the caller tried to choose for itself', () => {
    expect(
      smsSendRequestSchema.safeParse({
        mobile: '09120001234',
        purpose: 'marketing',
        text: 'x',
        sender: '50004075005185',
      }).success,
    ).toBe(false);
  });
});

describe('smsStatusQuerySchema', () => {
  it('takes one kind of identifier or the other, never both and never neither', () => {
    expect(smsStatusQuerySchema.safeParse({ messageIds: ['1'] }).success).toBe(true);
    expect(smsStatusQuerySchema.safeParse({ traceIds: ['1'] }).success).toBe(true);
    expect(smsStatusQuerySchema.safeParse({ messageIds: ['1'], traceIds: ['2'] }).success).toBe(
      false,
    );
    expect(smsStatusQuerySchema.safeParse({}).success).toBe(false);
  });

  it('holds the batch to what the vendor accepts', () => {
    const hundred = Array.from({ length: 100 }, (_, index) => String(index + 1));
    expect(smsStatusQuerySchema.safeParse({ messageIds: hundred }).success).toBe(true);
    expect(smsStatusQuerySchema.safeParse({ messageIds: [...hundred, '101'] }).success).toBe(false);
  });
});
