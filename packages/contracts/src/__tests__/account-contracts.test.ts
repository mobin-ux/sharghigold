import { describe, expect, it } from 'vitest';

import {
  addressDraftSchema,
  addressSchema,
  ageInYears,
  isValidIranianIban,
  isValidIranianNationalId,
  isValidJalaliDate,
  iranianIbanSchema,
  jalaliDateSchema,
  jalaliToGregorian,
  kycProgressSchema,
  accountProfileSchema,
  orderFilterSchema,
  orderQuerySchema,
  postalCodeSchema,
  setPasswordSchema,
} from '../index.js';

/**
 * The account contracts are the only thing standing between a form post and
 * the customer's record, so what is pinned here is what would let a bad value
 * through: a check digit that is not checked, a date that does not exist, a
 * recipient that can be omitted.
 *
 * A fixed instant is used wherever age matters — a test that reads the clock
 * is a test that fails on a birthday.
 */
const NOW = new Date('2026-09-11T00:00:00.000Z');

/* -------------------------------------------------------------------------- */
/* The national identifier                                                    */
/* -------------------------------------------------------------------------- */

describe('the Iranian national identifier', () => {
  it('accepts a number whose check digit agrees', () => {
    expect(isValidIranianNationalId('0012345679')).toBe(true);
  });

  it('rejects the same number with one digit changed', () => {
    expect(isValidIranianNationalId('0012345678')).toBe(false);
  });

  it('rejects ten of the same digit, which the check digit alone allows', () => {
    expect(isValidIranianNationalId('1111111111')).toBe(false);
  });

  it('rejects anything that is not ten digits', () => {
    expect(isValidIranianNationalId('001234567')).toBe(false);
    expect(isValidIranianNationalId('00123456790')).toBe(false);
    expect(isValidIranianNationalId('00123 45679')).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* The bank account                                                           */
/* -------------------------------------------------------------------------- */

describe('the IBAN', () => {
  it('accepts a number whose mod-97 remainder is one', () => {
    expect(isValidIranianIban('IR300600000000000000000001')).toBe(true);
  });

  it('rejects a transposition, which is what the checksum exists to catch', () => {
    expect(isValidIranianIban('IR300600000000000000000010')).toBe(false);
  });

  it('adds the country code and drops the spacing a card is printed with', () => {
    const parsed = iranianIbanSchema.parse(' 30 0600 0000 0000 0000 000001 ');
    expect(parsed).toBe('IR300600000000000000000001');
  });

  it('refuses a number of the right shape with the wrong checksum', () => {
    expect(iranianIbanSchema.safeParse('IR310600000000000000000001').success).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* The Persian calendar                                                       */
/* -------------------------------------------------------------------------- */

describe('the Jalali date', () => {
  it('converts a date to the Gregorian one it names', () => {
    expect(jalaliToGregorian(1370, 5, 12)).toEqual([1991, 8, 3]);
    expect(jalaliToGregorian(1405, 6, 19)).toEqual([2026, 9, 10]);
  });

  it('accepts the thirty-first of a month that has one', () => {
    expect(isValidJalaliDate('1370/06/31')).toBe(true);
  });

  it('rejects the thirty-first of a month that does not', () => {
    expect(isValidJalaliDate('1370/07/31')).toBe(false);
  });

  it('rejects the thirtieth of Esfand in an ordinary year', () => {
    expect(isValidJalaliDate('1374/12/30')).toBe(false);
    expect(isValidJalaliDate('1375/12/30')).toBe(true);
  });

  it('accepts a date written in Latin digits, which is what reaches it', () => {
    expect(jalaliDateSchema.parse('1370/05/12')).toBe('1370/05/12');
    // Persian digits are turned to Latin ones by the action that reads the
    // form, so the contract never has to guess which set it was given.
    expect(jalaliDateSchema.safeParse('۱۳۷۰/۰۵/۱۲').success).toBe(false);
  });

  it('counts a year only once the day has passed', () => {
    expect(ageInYears('1370/05/12', NOW)).toBe(35);
    expect(ageInYears('2008/06/19', NOW)).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* The postal code                                                            */
/* -------------------------------------------------------------------------- */

describe('the postal code', () => {
  it('accepts a code whose positions are all allowed', () => {
    expect(postalCodeSchema.parse('1194733109')).toBe('1194733109');
  });

  it('drops the separator people type it with', () => {
    expect(postalCodeSchema.parse('11947-33109')).toBe('1194733109');
  });

  it('rejects a digit the position forbids', () => {
    // The last five may not contain 2; the rest of this code is well formed.
    expect(postalCodeSchema.safeParse('1997845612').success).toBe(false);
  });

  it('rejects ten of the same digit', () => {
    expect(postalCodeSchema.safeParse('1111111111').success).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* The address                                                                */
/* -------------------------------------------------------------------------- */

const SELF_DRAFT = {
  deliverToSelf: true,
  label: 'home',
  province: 'تهران',
  city: 'تهران',
  line: 'سعادت‌آباد، خیابان علامه شمالی، کوچه ۱۸',
  plate: '۷',
  unit: '۴',
  postalCode: '1194733109',
  isDefault: true,
} as const;

describe('the address draft', () => {
  it('takes an address delivered to the account holder', () => {
    expect(addressDraftSchema.safeParse(SELF_DRAFT).success).toBe(true);
  });

  it('requires a recipient when somebody else is taking delivery', () => {
    const parsed = addressDraftSchema.safeParse({ ...SELF_DRAFT, deliverToSelf: false });
    expect(parsed.success).toBe(false);
  });

  it('accepts the same address once the recipient is named', () => {
    const parsed = addressDraftSchema.safeParse({
      ...SELF_DRAFT,
      deliverToSelf: false,
      recipientName: 'مهدی رضایی',
      recipientMobile: '09121112233',
    });
    expect(parsed.success).toBe(true);
  });

  it('refuses a recipient smuggled in alongside «deliver to me»', () => {
    const parsed = addressDraftSchema.safeParse({
      ...SELF_DRAFT,
      recipientName: 'مهدی رضایی',
      recipientMobile: '09121112233',
    });
    expect(parsed.success).toBe(false);
  });

  it('refuses an unknown label', () => {
    expect(addressDraftSchema.safeParse({ ...SELF_DRAFT, label: 'villa' }).success).toBe(false);
  });
});

describe('the stored address', () => {
  it('carries a recipient in every case, because delivery needs one', () => {
    const parsed = addressSchema.safeParse({
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41b1',
      label: 'home',
      recipientName: 'کاربر زرنما',
      recipientMobile: '09120001234',
      province: 'تهران',
      city: 'تهران',
      line: 'سعادت‌آباد، خیابان علامه شمالی، کوچه ۱۸',
      plate: '۷',
      unit: null,
      postalCode: '1194733109',
      isDefault: true,
    });
    expect(parsed.success).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Verification and the profile                                               */
/* -------------------------------------------------------------------------- */

const PROGRESS = {
  status: 'pending',
  steps: [
    { key: 'identity', done: true },
    { key: 'bank', done: true },
    { key: 'selfie', done: false },
  ],
  rejectionReason: null,
  selfieChallenge: '48291',
} as const;

describe('verification progress', () => {
  it('always describes exactly the three steps', () => {
    expect(kycProgressSchema.safeParse(PROGRESS).success).toBe(true);
    expect(
      kycProgressSchema.safeParse({ ...PROGRESS, steps: PROGRESS.steps.slice(0, 2) }).success,
    ).toBe(false);
  });

  it('refuses a challenge that is not five digits', () => {
    expect(kycProgressSchema.safeParse({ ...PROGRESS, selfieChallenge: '4829' }).success).toBe(
      false,
    );
  });
});

describe('the profile', () => {
  const profile = {
    id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41b0',
    mobile: '09120001234',
    displayName: 'کاربر زرنما',
    nationalId: null,
    nationalIdMasked: '۰۰۱***۵۶۷۹',
    hasPassword: true,
    joinedAt: '2026-01-05T09:30:00.000Z',
    kyc: { ...PROGRESS, status: 'verified', selfieChallenge: null },
  };

  it('is returned without the identifier once it is verified', () => {
    expect(accountProfileSchema.safeParse(profile).success).toBe(true);
  });

  it('refuses to hand a verified identifier back to the browser', () => {
    const parsed = accountProfileSchema.safeParse({ ...profile, nationalId: '0012345679' });
    expect(parsed.success).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Passwords and filters                                                      */
/* -------------------------------------------------------------------------- */

describe('setting a password', () => {
  it('requires the two entries to agree', () => {
    expect(
      setPasswordSchema.safeParse({ password: 'a-long-enough-one', confirmation: 'something else' })
        .success,
    ).toBe(false);
  });

  it('accepts a pair that agrees', () => {
    expect(
      setPasswordSchema.safeParse({
        password: 'a-long-enough-one',
        confirmation: 'a-long-enough-one',
      }).success,
    ).toBe(true);
  });
});

describe('the order filter', () => {
  it('is one of the four the page offers', () => {
    expect(orderFilterSchema.safeParse('delivered').success).toBe(true);
    expect(orderFilterSchema.safeParse('refunded').success).toBe(false);
  });

  it('falls back to the whole list for a query nobody wrote on purpose', () => {
    expect(orderQuerySchema.parse({}).filter).toBe('all');
    expect(orderQuerySchema.parse({ filter: 'refunded' }).filter).toBe('all');
    expect(orderQuerySchema.parse({ filter: ['open', 'delivered'] }).filter).toBe('all');
    expect(orderQuerySchema.parse({ filter: 'delivered' }).filter).toBe('delivered');
  });
});
